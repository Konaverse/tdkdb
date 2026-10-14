import { readConsent } from '@/lib/consent';

/* The browser side of Meta tracking. `fbq` exists only after MetaPixel has
   injected the script with consent; every call here is a no-op otherwise. */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/** Standard Meta events only, with parameters that are never personal data.
    `eventId` must equal the server's event_id so Meta deduplicates the pair. */
export function trackMeta(
  event: 'PageView' | 'ViewContent' | 'Contact' | 'Lead',
  params: Record<string, string | number> = {},
  eventId?: string,
): boolean {
  if (typeof window === 'undefined' || !window.fbq || readConsent() !== 'granted') return false;
  if (eventId) window.fbq('track', event, params, { eventID: eventId });
  else window.fbq('track', event, params);
  return true;
}

/** Retry briefly while the stub is still being injected after consent. */
export function trackMetaWhenReady(
  event: Parameters<typeof trackMeta>[0],
  params: Record<string, string | number> = {},
  eventId?: string,
): () => void {
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const attempt = () => {
    if (trackMeta(event, params, eventId) || attempts++ >= 30) return;
    timer = setTimeout(attempt, 100);
  };
  attempt();
  return () => clearTimeout(timer);
}
