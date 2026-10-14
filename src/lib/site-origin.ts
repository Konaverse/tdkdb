/** The canonical origin, with no other imports so server utilities (CAPI,
    IndexNow) can use it without pulling the CMS client along. */

const FALLBACK_ORIGIN = 'https://tdkdb.com';

/** A configured https site URL wins; Vercel's production domain is the next
    best fact; the registered domain is the last resort. */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https:\/\/[^/]+/i.test(configured)) return configured.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`;
  return FALLBACK_ORIGIN;
}

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${siteOrigin()}/`).href;
}
