import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { serverClient } from '@/lib/sanity/client';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  unitPreference: z.string().optional(),
  message: z.string().optional(),
  projectSlug: z.string().min(1),
  projectName: z.string().min(1),
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

  const { name, email, phone, unitPreference, message, projectSlug, projectName, _honeypot } =
    parsed.data;

  // Honeypot check — return 200 silently to not tip off bots
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

  const toEmail = process.env.INTEREST_FORM_TO_EMAIL;
  if (!toEmail) {
    console.error('INTEREST_FORM_TO_EMAIL not configured');
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 },
    );
  }

  try {
    // Send notification to TDK team
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@tdkdb.com',
      to: toEmail,
      subject: `New Interest: ${projectName}`,
      html: `
        <h2>New Project Interest — ${projectName}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone ?? 'Not provided'}</p>
        <p><strong>Unit Preference:</strong> ${unitPreference ?? 'Not specified'}</p>
        <p><strong>Message:</strong> ${message ?? 'None'}</p>
        <p><strong>Project Slug:</strong> ${projectSlug}</p>
      `,
    });

    // Auto-reply to lead
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@tdkdb.com',
      to: email,
      subject: `Thank you for your interest in ${projectName}`,
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for registering your interest in <strong>${projectName}</strong>.</p>
        <p>We have received your enquiry and a member of our team will be in touch shortly.</p>
        <p>Best regards,<br/>TDK Design & Build</p>
      `,
    });

    // Write lead document to Sanity
    await serverClient.create({
      _type: 'projectLead',
      name,
      email,
      phone: phone ?? '',
      unitPreference: unitPreference ?? '',
      message: message ?? '',
      projectSlug,
      projectName,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Interest form error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process your request. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
