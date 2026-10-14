import { NextRequest, NextResponse } from 'next/server';

import { authorizedWebhook, handleListAddition, leadAlertSettings } from '@/lib/crm/lead-alert';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const NO_STORE = { headers: { 'Cache-Control': 'no-store' } };

/** Brevo marketing webhook: contact added to a list. Secret in `?secret=`
    or `x-webhook-secret`. Everything after authentication answers 200 so
    Brevo stops; outcomes are in the body and the logs. */
export async function POST(req: NextRequest) {
  if (!authorizedWebhook(req.url, req.headers, leadAlertSettings().secret))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, ...NO_STORE });
  const body = await req.json().catch(() => null);
  // Brevo may batch several events in one call; handle each.
  const events = Array.isArray(body) ? body : [body];
  const outcomes: string[] = [];
  for (const event of events) outcomes.push(await handleListAddition(event));
  return NextResponse.json({ received: true, outcomes }, NO_STORE);
}
