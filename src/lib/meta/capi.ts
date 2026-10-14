import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

import { consentFromCookieHeader } from '@/lib/consent';
import type { Attribution, AttributionTouch } from '@/lib/contact/metadata';
import { siteOrigin } from '@/lib/site-origin';
import { CONSENT_COOKIE, LEAD_CATEGORIES, META_GRAPH_API_VERSION, metaPixelId } from './config';

/* ───────────────────────────────────────────────────────────────────────────
   Conversions API: the server's copy of the Lead event, sent to Meta only
   when the visitor's consent cookie says `granted`, with the same event_id
   the browser used so Meta keeps one of the pair. Customer fields are
   normalized and SHA-256 hashed as Meta's customer-information spec requires.
   It never throws, never blocks longer than TIMEOUT_MS, and never changes
   the form's own result.
   ─────────────────────────────────────────────────────────────────────────── */

const TIMEOUT_MS = 3000;
const DEFAULT_COUNTRY_CODE = '357';
const COUNTRY = 'cy';

export function metaCapiSettings() {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const pixelId = metaPixelId();
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim() || undefined;
  return token && pixelId ? { token, pixelId, testEventCode } : null;
}

export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function normalizeEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  return value ? value : null;
}

/** Digits only with the country code. `+` or `00` marks an international
    number; anything else is read as Cyprus unless it already carries 357. */
export function normalizePhone(phone: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  // "(0)" is a trunk prefix written for domestic dialling; it is not part of
  // the international number.
  const raw = phone.trim().replace(/\(0\)/g, '');
  if (!raw) return null;
  const international = raw.startsWith('+') || raw.startsWith('00');
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;
  if (international) return digits;
  if (digits.startsWith(countryCode) && digits.length > 8) return digits;
  return `${countryCode}${digits}`;
}

/** Lowercase, no punctuation or digits, single spaces. Non-Latin letters stay. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9_!"#$%&'()*+,\-./:;<=>?@[\\\]^`{|}~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitName(name: string): { first: string | null; last: string | null } {
  const [first, ...rest] = normalizeName(name).split(' ').filter(Boolean);
  return { first: first || null, last: rest.length ? rest.join(' ') : null };
}

/** `_fbc` when the browser has it; otherwise rebuilt from the fbclid the
    attribution snapshot captured on the landing page. */
export function resolveFbc(cookie: string | undefined, attribution?: Attribution): string | null {
  if (cookie && /^fb\.\d\.\d+\./.test(cookie)) return cookie;
  const lastTouch = attribution?.lastTouch as AttributionTouch | undefined;
  const firstTouch = attribution?.firstTouch as AttributionTouch | undefined;
  const touch = lastTouch?.fbclid ? lastTouch : firstTouch?.fbclid ? firstTouch : null;
  if (!touch?.fbclid) return null;
  const captured = touch.capturedAt ? Date.parse(touch.capturedAt) : NaN;
  const creationTime = Number.isFinite(captured) ? captured : Date.now();
  return `fb.1.${creationTime}.${touch.fbclid}`;
}

interface LeadInput {
  request: NextRequest;
  kind: keyof typeof LEAD_CATEGORIES;
  /** The browser's submission UUID; the Pixel sent the same value as eventID. */
  eventId?: string;
  name: string;
  email: string;
  phone?: string;
  projectName?: string;
  attribution?: Attribution;
}

/** Identical to the browser's Lead parameters: that is what makes the pair
    deduplicate cleanly. */
export function leadCustomData(kind: LeadInput['kind'], projectName?: string) {
  return kind === 'interest'
    ? {
        content_name: projectName || 'Project interest',
        content_category: LEAD_CATEGORIES.interest,
      }
    : { content_category: LEAD_CATEGORIES.contact };
}

export function buildLeadEvent(input: LeadInput) {
  const { request, attribution } = input;
  const cookies = request.cookies;
  const { first, last } = splitName(input.name);
  const email = normalizeEmail(input.email);
  const phone = input.phone ? normalizePhone(input.phone) : null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  const fbp = cookies.get('_fbp')?.value;
  const fbc = resolveFbc(cookies.get('_fbc')?.value, attribution);

  return {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id:
      input.eventId ||
      createHash('sha256').update(`${Date.now()}:${Math.random()}`).digest('hex').slice(0, 32),
    action_source: 'website',
    event_source_url: attribution?.sourceUrl || request.headers.get('referer') || siteOrigin(),
    user_data: {
      ...(email ? { em: [sha256(email)] } : {}),
      ...(phone ? { ph: [sha256(phone)] } : {}),
      ...(first ? { fn: [sha256(first)] } : {}),
      ...(last ? { ln: [sha256(last)] } : {}),
      country: [sha256(COUNTRY)],
      ...(ip ? { client_ip_address: ip } : {}),
      ...(userAgent ? { client_user_agent: userAgent } : {}),
      ...(fbp ? { fbp } : {}),
      ...(fbc ? { fbc } : {}),
    },
    custom_data: leadCustomData(input.kind, input.projectName),
  };
}

/** Send the Lead to Meta. Resolves to what happened; never rejects. */
export async function sendMetaLead(input: LeadInput): Promise<'sent' | 'skipped' | 'failed'> {
  try {
    const consent = consentFromCookieHeader(input.request.headers.get('cookie'));
    if (consent !== 'granted') return 'skipped';
    const settings = metaCapiSettings();
    if (!settings) return 'skipped';

    const body: Record<string, unknown> = {
      data: [buildLeadEvent(input)],
      access_token: settings.token,
    };
    if (settings.testEventCode) body.test_event_code = settings.testEventCode;

    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${settings.pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      // Graph errors carry a code and a message; neither echoes the token or
      // the visitor's details.
      const detail = (await response.json().catch(() => null)) as {
        error?: { code?: number; message?: string };
      } | null;
      console.error('Meta CAPI rejected the Lead event', {
        status: response.status,
        code: detail?.error?.code,
        message: detail?.error?.message,
      });
      return 'failed';
    }
    return 'sent';
  } catch (error) {
    console.error(
      'Meta CAPI Lead event failed',
      error instanceof Error ? error.message : 'unknown error',
    );
    return 'failed';
  }
}

export { CONSENT_COOKIE };
