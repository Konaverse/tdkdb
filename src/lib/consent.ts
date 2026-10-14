import { CONSENT_COOKIE, CONSENT_MAX_AGE_SECONDS, type ConsentValue } from '@/lib/meta/config';

/* The consent cookie, readable on both sides. The browser reads and writes
   `document.cookie`; route handlers parse the request's Cookie header. */

export function parseConsent(value: string | null | undefined): ConsentValue | null {
  return value === 'granted' || value === 'denied' ? value : null;
}

/** The consent value inside a raw Cookie header, or null when unset. */
export function consentFromCookieHeader(header: string | null | undefined): ConsentValue | null {
  if (!header) return null;
  const match = header.split(';').find((part) => part.trim().startsWith(`${CONSENT_COOKIE}=`));
  return parseConsent(match?.split('=')[1]?.trim());
}

export function readConsent(): ConsentValue | null {
  if (typeof document === 'undefined') return null;
  return consentFromCookieHeader(document.cookie);
}

export function writeConsent(value: ConsentValue): void {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/** Withdrawn consent also removes Meta's own browser cookies. They are set on
    the registrable domain, so both spellings of the host are expired. */
export function clearMetaCookies(): void {
  if (typeof document === 'undefined') return;
  const host = location.hostname;
  const bare = host.replace(/^www\./, '');
  for (const name of ['_fbp', '_fbc']) {
    for (const domain of ['', `; Domain=${host}`, `; Domain=.${bare}`, `; Domain=${bare}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
    }
  }
}
