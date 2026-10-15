import { createHash, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

import { escapeHtml } from '@/lib/contact/delivery';
import { brevoRequest, BrevoError } from './brevo';
import {
  ensureLeadDeal,
  humanize,
  isAgent,
  type LeadContact,
  type LeadDealOutcome,
} from './lead-deal';

/* ───────────────────────────────────────────────────────────────────────────
   Instant alert for Meta Instant Form leads. Meta leads sync into the Brevo
   list "TDK | Meta Leads"; Brevo's "contact added to a list" marketing
   webhook calls /api/webhooks/brevo-lead, which reads the full contact back
   from Brevo, emails the studio its details in Greek, and then gives the
   lead the same Brevo deal a website enquiry gets (`lead-deal.ts`). Brevo's
   own "Notify by email" automation cannot include the attributes.

   Nothing here touches the website forms, the CRM queue, the Pixel or
   consent. Failures are logged; the webhook still answers 200 so Brevo does
   not keep retrying a lead the studio will see in Brevo anyway. The deal
   comes strictly after the alert and can never delay or fail it.
   ─────────────────────────────────────────────────────────────────────────── */

const DEFAULT_META_LEADS_LIST_ID = 4;
const ALERT_WINDOW_MS = 10 * 60 * 1000;
const BREVO_TIMEOUT_MS = 6000;

export { humanize, isAgent };
export type { LeadContact };

export function leadAlertSettings() {
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.LEAD_ALERT_TO_EMAIL?.trim() || process.env.CONTACT_FORM_TO_EMAIL?.trim();
  const listId = Number(process.env.BREVO_META_LEADS_LIST_ID?.trim() || DEFAULT_META_LEADS_LIST_ID);
  return {
    secret: secret || null,
    mail: apiKey && from && to ? { apiKey, from, to } : null,
    listId: Number.isSafeInteger(listId) && listId > 0 ? listId : DEFAULT_META_LEADS_LIST_ID,
  };
}

/** The shared secret may arrive as `?secret=` (the dashboard offers only a
    URL) or as an `x-webhook-secret` header. Constant-time comparison. */
export function authorizedWebhook(url: string, headers: Headers, secret: string | null): boolean {
  if (!secret) return false;
  const supplied = headers.get('x-webhook-secret') || new URL(url).searchParams.get('secret') || '';
  return (
    Buffer.byteLength(supplied) === Buffer.byteLength(secret) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))
  );
}

export interface ListAdditionEvent {
  email: string;
  listIds: number[];
  /** When Brevo says it happened: `ts` (unix seconds), else the `date_time`
      or `date` text. Brevo's `id` is deliberately not kept: it is NOT unique
      per event, so it must never identify an alert. */
  occurredAt?: string;
}

/** Brevo's marketing webhook for "contact added to a list". The docs spell
    the event `list_addition`; the API's enum spells it `listAddition`; both
    are accepted. `list_id` is an array, but a single number is tolerated. */
export function parseListAddition(body: unknown): ListAdditionEvent | null {
  if (!body || typeof body !== 'object') return null;
  const event = body as Record<string, unknown>;
  const name = String(event.event ?? '')
    .toLowerCase()
    .replace(/_/g, '');
  if (name !== 'listaddition') return null;
  const email = typeof event.email === 'string' ? event.email.trim().toLowerCase() : '';
  if (!email || !email.includes('@')) return null;
  const raw = event.list_id ?? event.listId ?? event.list_ids;
  const listIds = (Array.isArray(raw) ? raw : [raw])
    .map((value) => Number(value))
    .filter((value) => Number.isSafeInteger(value) && value > 0);
  const ts = typeof event.ts === 'number' && Number.isFinite(event.ts) ? String(event.ts) : '';
  const dateText = [event.date_time, event.date].find(
    (value) => typeof value === 'string' && value.trim(),
  );
  const occurredAt = ts || (typeof dateText === 'string' ? dateText.trim() : '');
  return { email, listIds, occurredAt: occurredAt || undefined };
}

/** `tel:` wants digits with a leading `+`; Brevo stores SMS with or without it. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return /^\d{7,15}$/.test(digits) ? `tel:+${digits}` : null;
}

export function leadAlertEmail(contact: LeadContact): {
  subject: string;
  text: string;
  html: string;
} {
  const a = contact.attributes;
  const firstName = humanize(a.FIRSTNAME);
  const lastName = humanize(a.LASTNAME);
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const phone = humanize(a.SMS);
  const tel = phone ? telHref(phone) : null;
  const agent = isAgent(a.LEAD_ROLE);
  const rows: [string, string, string | null][] = [
    ['Όνομα', name, null],
    ['Τηλέφωνο', phone, tel],
    ['Email', contact.email, `mailto:${contact.email}`],
    ['Διαμέρισμα', humanize(a.INTERESTED_UNIT), null],
    ['Πότε', humanize(a.PURCHASE_TIMELINE), null],
    ['Αγοραστής/Μεσίτης', humanize(a.LEAD_ROLE), null],
  ];
  const footer = 'Καλέστε εντός 5 λεπτών.';
  const subject = `${agent ? '[ΜΕΣΙΤΗΣ] ' : ''}🔔 Νέο lead Almond Suites – ${firstName || contact.email}`;
  const text = [...rows.map(([label, value]) => `${label}: ${value || '—'}`), '', footer].join(
    '\n',
  );
  const html = [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#111">',
    `<h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(subject)}</h2>`,
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse">',
    ...rows.map(([label, value, href]) => {
      const shown = value ? escapeHtml(value) : '—';
      const cell = value && href ? `<a href="${escapeHtml(href)}">${shown}</a>` : shown;
      return `<tr><td style="padding:4px 16px 4px 0;color:#555">${escapeHtml(label)}</td><td style="padding:4px 0"><strong>${cell}</strong></td></tr>`;
    }),
    '</table>',
    `<p style="margin:16px 0 0;font-weight:bold">${escapeHtml(footer)}</p>`,
    '</div>',
  ].join('');
  return { subject, text, html };
}

/** One alert per email address per window. Module state lives as long as the
    function instance does, which covers Brevo's quick retries of one event;
    the Resend idempotency key below covers retries that land elsewhere. */
const recentAlerts = new Map<string, number>();

export function recentlyAlerted(email: string, now = Date.now()): boolean {
  recentAlerts.forEach((at, key) => {
    if (now - at > ALERT_WINDOW_MS) recentAlerts.delete(key);
  });
  if (recentAlerts.has(email)) return true;
  recentAlerts.set(email, now);
  return false;
}

export function resetRecentAlerts(): void {
  recentAlerts.clear();
}

/** Resend refuses a second send with the same key for 24 h, which covers
    Brevo retrying one delivery onto another function instance. The key is
    the lead, the list and the event's time: a retry of one event repeats
    all three, two leads never share an email. (Brevo's event `id` is shared
    across events, so keying on it made every alert after the first a 409.)
    Without a time from Brevo, the current minute stands in. */
export function alertIdempotencyKey(
  event: ListAdditionEvent,
  listId: number,
  now = Date.now(),
): string {
  const moment = event.occurredAt ?? `minute:${Math.floor(now / 60_000)}`;
  const subject = `${event.email}|${listId}|${moment}`;
  return `brevo-lead/${createHash('sha256').update(subject).digest('hex').slice(0, 40)}`;
}

/** Resend answers 409 when a key is reused with a different body (or while
    the first send with it is still in flight). The alert matters more than
    the dedup, so one retry goes out without a key. */
function idempotencyConflict(error: { name?: string; statusCode?: number | null }): boolean {
  return (
    error.statusCode === 409 ||
    error.name === 'invalid_idempotent_request' ||
    error.name === 'concurrent_idempotent_requests'
  );
}

export async function fetchLeadContact(email: string): Promise<LeadContact | null> {
  try {
    const contact = await brevoRequest<{
      id?: number;
      email?: string;
      attributes?: Record<string, unknown>;
    }>(
      'contact_lookup',
      `/contacts/${encodeURIComponent(email)}`,
      undefined,
      Date.now() + BREVO_TIMEOUT_MS,
    );
    if (!contact || typeof contact !== 'object') return null;
    return {
      id: Number.isSafeInteger(contact.id) && contact.id! > 0 ? contact.id : undefined,
      email: contact.email?.toLowerCase() || email,
      attributes: contact.attributes || {},
    };
  } catch (error) {
    if (error instanceof BrevoError && error.status === 404) return null;
    throw error;
  }
}

export type LeadAlertOutcome =
  | 'sent'
  | 'ignored'
  | 'duplicate'
  | 'missing_contact'
  | 'not_configured'
  | 'failed';

export interface LeadOutcome {
  alert: LeadAlertOutcome;
  /** 'skipped' when the event never reached the deal step. */
  deal: LeadDealOutcome | 'skipped';
}

const logFailure = (what: string, error: unknown) =>
  // Codes only: never the lead's details or any credential.
  console.error(
    what,
    error instanceof BrevoError
      ? `${error.operation}:${error.status}:${error.code}`
      : error instanceof Error
        ? error.message
        : 'unknown error',
  );

async function sendLeadAlert(
  event: ListAdditionEvent,
  contact: LeadContact,
  settings: ReturnType<typeof leadAlertSettings>,
): Promise<LeadAlertOutcome> {
  if (!settings.mail) {
    console.error('Lead alert email is not configured');
    return 'not_configured';
  }
  try {
    const email = { from: settings.mail.from, to: settings.mail.to, ...leadAlertEmail(contact) };
    const resend = new Resend(settings.mail.apiKey);
    let result = await resend.emails.send(email, {
      idempotencyKey: alertIdempotencyKey(event, settings.listId),
    });
    if (result.error && idempotencyConflict(result.error)) {
      console.error('Lead alert idempotency key refused by Resend; resending without one', {
        name: result.error.name,
        statusCode: result.error.statusCode,
      });
      result = await resend.emails.send(email);
    }
    if (result.error) {
      console.error('Lead alert rejected by Resend', {
        name: result.error.name,
        statusCode: result.error.statusCode,
        message: result.error.message,
      });
      recentAlerts.delete(event.email);
      return 'failed';
    }
    return 'sent';
  } catch (error) {
    logFailure('Lead alert failed', error);
    recentAlerts.delete(event.email);
    return 'failed';
  }
}

/** Runs the whole lead: contact, alert, then deal. Never throws: the route
    answers 200 regardless. */
export async function handleListAddition(body: unknown): Promise<LeadOutcome> {
  const event = parseListAddition(body);
  const settings = leadAlertSettings();
  if (!event || !event.listIds.includes(settings.listId))
    return { alert: 'ignored', deal: 'skipped' };
  if (recentlyAlerted(event.email)) return { alert: 'duplicate', deal: 'skipped' };
  let contact: LeadContact | null;
  try {
    contact = await fetchLeadContact(event.email);
  } catch (error) {
    logFailure('Lead alert failed', error);
    recentAlerts.delete(event.email);
    return { alert: 'failed', deal: 'skipped' };
  }
  if (!contact) {
    console.error('Lead alert: contact not found in Brevo');
    return { alert: 'missing_contact', deal: 'skipped' };
  }
  const alert = await sendLeadAlert(event, contact, settings);
  // The deal follows the alert and cannot change its outcome; a failure is
  // logged and reconciled by the backfill script or the next event.
  const deal = await ensureLeadDeal(contact);
  return { alert, deal };
}
