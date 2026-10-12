import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { retryPendingSubmissions, resumeSubmission } from '@/lib/crm/submissions';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = req.headers.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  return (
    !!secret &&
    Buffer.byteLength(supplied) === Buffer.byteLength(expected) &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const counts = await retryPendingSubmissions();
    return NextResponse.json(
      { success: true, counts },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    console.error('CRM retry worker unavailable');
    return NextResponse.json(
      { success: false, error: 'CRM retry worker unavailable' },
      { status: 503 },
    );
  }
}

const recoverySchema = z.object({
  id: z.string().regex(/^enquiry\.[a-f0-9]{64}$/),
  action: z.enum(['retry', 'confirm-absent-deal', 'confirm-absent-note']),
  confirmedAbsent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = recoverySchema.safeParse(body);
  if (!parsed.success || (parsed.data.action !== 'retry' && parsed.data.confirmedAbsent !== true)) {
    return NextResponse.json(
      {
        error: 'Invalid recovery request; verify absence in Brevo before authorizing a new create.',
      },
      { status: 400 },
    );
  }
  try {
    const status = await resumeSubmission(parsed.data.id, parsed.data.action);
    return NextResponse.json(
      { status },
      {
        status: status === 'missing' ? 404 : ['busy', 'conflict'].includes(status) ? 409 : 200,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  } catch {
    console.error('CRM recovery unavailable');
    return NextResponse.json({ error: 'CRM recovery unavailable' }, { status: 503 });
  }
}
