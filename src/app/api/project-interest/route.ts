import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serverClient } from '@/lib/sanity/client';
import { escapeHtml, mailSettings, sendEnquiry } from '@/lib/contact/delivery';
import { submissionMetadataSchema } from '@/lib/contact/metadata';
import {
  makeSubmission,
  previousSubmission,
  queueAcceptedSubmission,
  submissionEmailHtml,
} from '@/lib/crm/submissions';

export const runtime = 'nodejs';
export const maxDuration = 60;

// In-memory rate limiter: IP → timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  rateLimitMap.set(ip, [...timestamps, now]);
  return false;
}

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: z.string().trim().email('Invalid email address').max(320),
    phone: z.string().trim().max(80).optional(),
    unitPreference: z.string().trim().max(200).optional(),
    message: z.string().trim().max(10000).optional(),
    projectSlug: z.string().trim().min(1).max(200),
    projectName: z.string().trim().min(1).max(200),
    _honeypot: z.string().optional(),
  })
  .extend(submissionMetadataSchema.shape);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 422 },
    );
  }

  const { name, email, phone, unitPreference, message, projectSlug, projectName, _honeypot } =
    parsed.data;

  // Honeypot check — return 200 silently to not tip off bots
  if (_honeypot && _honeypot.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const submission = makeSubmission('interest', parsed.data);
  const previous = await previousSubmission(submission);
  if (previous === 'conflict')
    return NextResponse.json(
      {
        success: false,
        error: 'This submission reference was already used. Please submit a new enquiry.',
      },
      { status: 409 },
    );
  if (previous === 'accepted') return NextResponse.json({ success: true });

  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions. Please try again later.' },
      { status: 429 },
    );
  }

  const mail = mailSettings('interest');
  if (!mail) {
    console.error('Project interest email delivery is not configured');
    return NextResponse.json(
      { success: false, error: 'We could not send your enquiry. Please try again later.' },
      { status: 503 },
    );
  }

  let emailId: string;
  try {
    // Send notification to TDK team
    emailId = await sendEnquiry(
      mail.apiKey,
      {
        from: mail.from,
        to: mail.to,
        replyTo: email,
        subject: `New Interest: ${projectName}`,
        html: `
        <h2>New Project Interest — ${escapeHtml(projectName)}</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
        <p><strong>Unit Preference:</strong> ${escapeHtml(unitPreference || 'Any residence')}</p>
        <p><strong>Message:</strong> ${escapeHtml(message || 'None').replace(/\n/g, '<br/>')}</p>
        <p><strong>Project Slug:</strong> ${escapeHtml(projectSlug)}</p>
        ${submissionEmailHtml(submission)}
      `,
      },
      {
        from: mail.from,
        to: email,
        replyTo: mail.to,
        subject: `Thank you for your interest in ${projectName}`,
        html: `
        <p>Dear ${escapeHtml(name)},</p>
        <p>Thank you for registering your interest in <strong>${escapeHtml(projectName)}</strong>.</p>
        <p>We have received your enquiry and a member of our team will be in touch shortly.</p>
        <p>Best regards,<br/>TDK Design &amp; Build</p>
      `,
      },
      submission.idempotencyKey,
    );
  } catch (err) {
    console.error(
      'Interest form error:',
      err instanceof Error ? err.message : 'Unknown mail error',
    );
    return NextResponse.json(
      { success: false, error: 'Failed to send your enquiry. Please try again.' },
      { status: 500 },
    );
  }

  // The email is already accepted. Archiving must not turn it into a failed
  // submission and cause the visitor to send the same enquiry again.
  try {
    const lead = {
      _type: 'lead',
      name,
      email,
      phone: phone ?? '',
      unitPreference: unitPreference ?? '',
      message: message ?? '',
      projectSlug,
      projectName,
      submittedAt: new Date().toISOString(),
      status: 'new',
      attribution: submission.enquiry.attribution,
    };
    if (parsed.data.submissionId)
      await serverClient.createIfNotExists({ ...lead, _id: `lead.${submission.id}` });
    else await serverClient.create(lead);
  } catch (err) {
    console.error(
      'Project lead archive failed:',
      err instanceof Error ? err.message : 'Unknown archive error',
    );
  }

  await queueAcceptedSubmission(submission, emailId);
  return NextResponse.json({ success: true });
}
