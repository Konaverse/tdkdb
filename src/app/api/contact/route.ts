import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { escapeHtml, mailSettings, sendEnquiry } from '@/lib/contact/delivery';

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

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  email: z.string().trim().email('Invalid email address').max(320),
  phone: z.string().trim().max(80).optional(),
  projectType: z.string().trim().min(1, 'Project type is required').max(100),
  message: z.string().trim().min(1, 'Message is required').max(10000),
  _honeypot: z.string().optional(),
});

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

  const { name, email, phone, projectType, message, _honeypot } = parsed.data;

  // Honeypot check — return 200 silently
  if (_honeypot && _honeypot.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

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

  const mail = mailSettings('contact');
  if (!mail) {
    console.error('Contact email delivery is not configured');
    return NextResponse.json(
      { success: false, error: 'We could not send your message. Please try again later.' },
      { status: 503 },
    );
  }

  try {
    // Send notification to TDK team
    await sendEnquiry(
      mail.apiKey,
      {
        from: mail.from,
        to: mail.to,
        replyTo: email,
        subject: `New Contact: ${name} — ${projectType}`,
        html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
        <p><strong>Project Type:</strong> ${escapeHtml(projectType)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      `,
      },
      {
        from: mail.from,
        to: email,
        replyTo: mail.to,
        subject: 'Thank you for contacting TDK Design & Build',
        html: `
        <p>Dear ${escapeHtml(name)},</p>
        <p>Thank you for getting in touch with TDK Design &amp; Build.</p>
        <p>We have received your message and will respond within 1–2 business days.</p>
        <p>Best regards,<br/>TDK Design &amp; Build</p>
      `,
      },
    );
  } catch (err) {
    console.error('Contact form error:', err instanceof Error ? err.message : 'Unknown mail error');
    return NextResponse.json(
      { success: false, error: 'Failed to send your message. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
