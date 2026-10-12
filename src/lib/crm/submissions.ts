import { createHash, randomUUID } from 'node:crypto';
import { serverClient } from '@/lib/sanity/client';
import { escapeHtml } from '@/lib/contact/delivery';
import type { Attribution } from '@/lib/contact/metadata';
import { crmEnabled, brevoSettings } from './config';
import {
  BrevoError,
  ReviewRequired,
  brevoRequest,
  upsertContact,
  findDeal,
  dealName,
  enquiryNotes,
  findNote,
} from './brevo';
import type { Enquiry, Submission, StoredSubmission } from './types';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export function makeSubmission(
  kind: Enquiry['kind'],
  data: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    projectSlug?: string;
    projectName?: string;
    projectType?: string;
    unitPreference?: string;
    submissionId?: string;
    attribution?: Attribution;
  },
): Submission {
  const enquiry: Enquiry = {
    kind,
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    message: data.message || '',
    projectSlug: data.projectSlug || '',
    projectName: data.projectName || '',
    projectType: data.projectType || '',
    unitPreference: data.unitPreference || '',
    attribution: data.attribution || {},
  };
  const id = digest(`${kind}:${data.submissionId || randomUUID()}`);
  return {
    id,
    enquiry,
    submittedAt: new Date().toISOString(),
    payloadHash: digest(JSON.stringify(enquiry)),
    idempotencyKey: data.submissionId ? `tdk-enquiry/${id}` : undefined,
  };
}

export async function previousSubmission(
  submission: Submission,
): Promise<'new' | 'accepted' | 'conflict'> {
  // Accepted receipts also protect retries while CRM delivery is paused.
  if (!submission.idempotencyKey) return 'new';
  try {
    const stored = await serverClient.getDocument<StoredSubmission>(`enquiry.${submission.id}`);
    if (!stored) return 'new';
    if (stored.payloadHash !== submission.payloadHash) return 'conflict';
    return stored.emailId ? 'accepted' : 'new';
  } catch {
    console.error('CRM submission lookup unavailable', { submissionId: submission.id });
    // Email remains protected by the same Resend idempotency key during a CMS outage.
    return 'new';
  }
}

export function submissionEmailHtml(submission: Submission): string {
  if (!submission.idempotencyKey && !Object.keys(submission.enquiry.attribution).length) return '';
  return `<p><strong>Website enquiry reference:</strong> ${submission.id}</p><p><strong>Marketing attribution:</strong><br/>${escapeHtml(JSON.stringify(submission.enquiry.attribution, null, 2)).replace(/\n/g, '<br/>')}</p>`;
}

/** Run only after Resend accepts the studio notification. CRM errors never
 * change that success or ask the visitor to resend an accepted enquiry.
 */
export async function queueAcceptedSubmission(
  submission: Submission,
  emailId: string,
): Promise<void> {
  if (!crmEnabled()) return;
  let id: string;
  try {
    const record = await serverClient.createIfNotExists({
      // Dotted IDs deliberately make enquiry PII private to authenticated Sanity clients.
      _id: `enquiry.${submission.id}`,
      _type: 'enquirySubmission',
      payloadHash: submission.payloadHash,
      enquiry: submission.enquiry,
      submittedAt: submission.submittedAt,
      emailId,
      crm: {
        status: 'pending',
        attempts: 0,
        notesDone: 0,
        nextAttemptAt: new Date().toISOString(),
      },
    });
    id = record._id;
  } catch {
    console.error('CRM queue unavailable after accepted email', {
      submissionId: submission.id,
      emailId,
    });
    return;
  }
  try {
    await processSubmission(id, 8000);
  } catch {
    console.error('CRM queued; immediate attempt unavailable', { submissionId: submission.id });
  }
}

export async function processSubmission(id: string, budgetMs = 40000): Promise<string> {
  if (!crmEnabled() || !brevoSettings()) return 'disabled';
  const deadline = Date.now() + budgetMs;
  let record = await serverClient.getDocument<StoredSubmission>(id);
  if (!record?.emailId || record._type !== 'enquirySubmission') return 'missing';
  if (record.crm.status === 'synced') return 'synced';
  if (
    (record.crm.leaseUntil && Date.parse(record.crm.leaseUntil) > Date.now()) ||
    Date.parse(record.crm.nextAttemptAt) > Date.now()
  )
    return 'busy';
  try {
    record = await serverClient
      .patch(id)
      .ifRevisionId(record._rev)
      .set({
        'crm.status': 'processing',
        'crm.leaseUntil': new Date(Date.now() + 120000).toISOString(),
        'crm.attempts': record.crm.attempts + 1,
      })
      .commit<StoredSubmission>();
  } catch {
    return 'busy';
  } // A concurrent instance already claimed this revision.

  const checkpoint = async (values: Record<string, unknown>) => {
    record = await serverClient
      .patch(id)
      .ifRevisionId(record!._rev)
      .set(values)
      .commit<StoredSubmission>();
  };

  try {
    if (!record.crm.contactId) {
      const contactId = await upsertContact(record.enquiry, deadline);
      await checkpoint({ 'crm.contactId': contactId });
    }
    if (!record.crm.dealId) {
      const existing = await findDeal(record, deadline);
      if (existing) await checkpoint({ 'crm.dealId': existing });
      else {
        // Brevo does not document an idempotency key for deal creation. An
        // ambiguous earlier POST is reconciled, never blindly repeated.
        if (record.crm.dealAttempted) throw new ReviewRequired('deal_outcome_unknown');
        await checkpoint({ 'crm.dealAttempted': true });
        const settings = brevoSettings()!;
        let deal: { id?: string };
        try {
          deal = await brevoRequest(
            'deal_create',
            '/crm/deals',
            {
              name: dealName(record),
              attributes: {
                pipeline: settings.pipelineId,
                deal_stage: settings.stageId,
                ...(settings.owner ? { deal_owner: settings.owner } : {}),
              },
              linkedContactsIds: [record.crm.contactId],
            },
            deadline,
          );
        } catch (error) {
          if (
            error instanceof BrevoError &&
            (!error.uncertain || error.code === 'budget_exhausted')
          )
            await checkpoint({ 'crm.dealAttempted': false });
          throw error;
        }
        if (!deal?.id || typeof deal.id !== 'string')
          throw new ReviewRequired('deal_outcome_unknown');
        await checkpoint({ 'crm.dealId': deal.id });
      }
    }
    const notes = enquiryNotes(record);
    for (let index = record.crm.notesDone; index < notes.length; index++) {
      const note = notes[index];
      if (record.crm.noteAttempted === index) {
        if (!(await findNote(record, note.marker, deadline)))
          throw new ReviewRequired('note_outcome_unknown');
      } else {
        if (Date.now() >= deadline - 100) throw new BrevoError('notes', 0, 'budget_exhausted');
        await checkpoint({ 'crm.noteAttempted': index });
        try {
          const created = await brevoRequest<{ id?: string }>(
            'note_create',
            '/crm/notes',
            {
              text: note.text,
              contactIds: [record.crm.contactId],
              dealIds: [record.crm.dealId],
            },
            deadline,
          );
          if (!created?.id) throw new ReviewRequired('note_outcome_unknown');
        } catch (error) {
          if (
            error instanceof BrevoError &&
            (!error.uncertain || error.code === 'budget_exhausted')
          )
            await checkpoint({ 'crm.noteAttempted': null });
          throw error;
        }
      }
      await checkpoint({ 'crm.notesDone': index + 1, 'crm.noteAttempted': null });
    }
    await checkpoint({
      'crm.status': 'synced',
      'crm.syncedAt': new Date().toISOString(),
      'crm.leaseUntil': '',
      'crm.lastError': '',
    });
    return 'synced';
  } catch (error) {
    const review =
      error instanceof ReviewRequired || (error instanceof BrevoError && !error.retryable);
    const code =
      error instanceof BrevoError
        ? `${error.operation}:${error.status}:${error.code}`
        : error instanceof ReviewRequired
          ? error.message
          : 'checkpoint_or_storage_failed';
    const backoff = Math.min(
      86400,
      Math.max(
        error instanceof BrevoError ? error.retryAfter : 0,
        60 * 2 ** Math.min(record.crm.attempts, 10),
      ),
    );
    console.error('Brevo CRM delivery pending', { submissionId: id, code, review });
    try {
      await checkpoint({
        'crm.status': review ? 'review' : 'retry',
        'crm.lastError': code,
        'crm.leaseUntil': '',
        'crm.nextAttemptAt': new Date(Date.now() + backoff * 1000).toISOString(),
      });
    } catch {
      /* An expired lease will be reconciled by the next worker. */
    }
    return review ? 'review' : 'retry';
  }
}

export async function retryPendingSubmissions(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  if (!crmEnabled() || !brevoSettings()) return { disabled: 1 };
  const deadline = Date.now() + 45000;
  const records = await serverClient.fetch<{ _id: string }[]>(
    '*[_type == "enquirySubmission" && defined(emailId) && crm.status != "synced" && crm.nextAttemptAt <= $now && (!defined(crm.leaseUntil) || crm.leaseUntil <= $now)] | order(crm.nextAttemptAt asc)[0...10]{_id}',
    { now: new Date().toISOString() },
  );
  for (const record of records) {
    const remaining = deadline - Date.now();
    if (remaining < 2000) break;
    const result = await processSubmission(record._id, remaining);
    counts[result] = (counts[result] || 0) + 1;
  }
  return counts;
}

/** Operators can resolve an ambiguous write after checking Brevo. A normal
 * retry only reconciles; it never authorizes another unconfirmed create.
 */
export async function resumeSubmission(
  id: string,
  action: 'retry' | 'confirm-absent-deal' | 'confirm-absent-note',
): Promise<string> {
  const record = await serverClient.getDocument<StoredSubmission>(id);
  if (!record?.emailId || record._type !== 'enquirySubmission') return 'missing';
  if (record.crm.leaseUntil && Date.parse(record.crm.leaseUntil) > Date.now()) return 'busy';
  if (record.crm.status === 'synced') return 'synced';
  const values: Record<string, unknown> = {
    'crm.nextAttemptAt': new Date().toISOString(),
    'crm.status': 'retry',
  };
  if (action === 'confirm-absent-deal') {
    if (record.crm.dealId || !record.crm.dealAttempted) return 'conflict';
    values['crm.dealAttempted'] = false;
  }
  if (action === 'confirm-absent-note') {
    if (typeof record.crm.noteAttempted !== 'number') return 'conflict';
    values['crm.noteAttempted'] = null;
  }
  try {
    await serverClient.patch(id).ifRevisionId(record._rev).set(values).commit();
  } catch {
    return 'busy';
  }
  return processSubmission(id, 40000);
}
