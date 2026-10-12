import type { Attribution, AttributionTouch } from './metadata';
import { CAMPAIGN_FIELDS } from './campaign-fields';

const STORAGE_KEY = 'tdk-enquiry-attribution-v1';
let captured: Attribution | null = null;

/** Only campaign parameters enter storage/CRM; unrelated query data is omitted. */
function cleanUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const safe = new URL(url.origin + url.pathname);
    CAMPAIGN_FIELDS.forEach((field) => {
      const value = url.searchParams.get(field);
      if (value) safe.searchParams.set(field, value.slice(0, 500));
    });
    return safe.href.slice(0, 2048);
  } catch {
    return '';
  }
}

export function captureAttribution(): Attribution {
  const url = new URL(window.location.href);
  const touch: AttributionTouch = {
    landingPage: cleanUrl(url.href),
    referrer: cleanUrl(document.referrer),
    capturedAt: new Date().toISOString(),
  };
  let campaign = false;
  CAMPAIGN_FIELDS.forEach((field) => {
    const value = url.searchParams.get(field);
    if (value) {
      touch[field] = value.slice(0, 500);
      campaign = true;
    }
  });
  if (!captured) {
    try {
      captured = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }
  if (!captured?.firstTouch) captured = { firstTouch: touch, lastTouch: touch };
  else if (campaign && captured.lastTouch?.landingPage !== touch.landingPage)
    captured = { ...captured, lastTouch: touch };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  } catch {
    /* The in-memory copy still survives client navigation. */
  }
  return { ...captured, sourceUrl: cleanUrl(url.href) };
}

export interface SubmissionAttempt {
  fingerprint: string;
  submissionId: string;
  attribution: Attribution;
}

function newSubmissionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Network retries keep the same ID and attribution; edited enquiries get a new ID. */
export function submissionAttempt(
  data: object,
  previous: SubmissionAttempt | null,
): SubmissionAttempt {
  const fingerprint = JSON.stringify(data);
  if (previous?.fingerprint === fingerprint) return previous;
  return { fingerprint, submissionId: newSubmissionId(), attribution: captureAttribution() };
}
