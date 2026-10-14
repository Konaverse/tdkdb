/* ───────────────────────────────────────────────────────────────────────────
   Meta Pixel + Conversions API: the shared facts. The Pixel ID is public and
   inlined into the browser bundle; the access token is server-only and read
   in capi.ts. Nothing here touches the DOM or the network.
   ─────────────────────────────────────────────────────────────────────────── */

/** Confirmed against developers.facebook.com/docs/graph-api/changelog on
    2026-10-14: v26.0 (released 2026-07-29) is current. */
export const META_GRAPH_API_VERSION = 'v26.0';

/** First-party consent cookie: `granted` or `denied`, kept for six months. */
export const CONSENT_COOKIE = 'tdk_consent';
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export type ConsentValue = 'granted' | 'denied';

/** Lead events carry the same parameters in the browser and on the server, so
    Meta deduplicates them by event_id. Never personal data. */
export const LEAD_CATEGORIES = {
  contact: 'general_contact',
  interest: 'property_interest',
} as const;

export function metaPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return id && /^\d{5,20}$/.test(id) ? id : null;
}
