'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useConsent } from './ConsentProvider';

/* The consent banner: a white panel on the page margins at the foot of the
   screen, in Josefin, with Accept and Reject as two identical buttons. Nothing
   is pre-selected and nothing loads until a choice is made. It sits below the
   first-load intro (z 300) and the project transition (z 480). */

const BUTTON =
  'inline-flex min-h-12 flex-1 items-center justify-center bg-[#111111] px-7 py-3.5 text-[13px] font-[600] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-threshold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-threshold sm:flex-none';

export default function CookieBanner() {
  const { consent, ready, settingsOpen, grant, deny, closeSettings } = useConsent();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const firstButton = useRef<HTMLButtonElement>(null);
  const open = ready && (consent === 'unknown' || settingsOpen);

  useEffect(() => {
    if (open && settingsOpen) firstButton.current?.focus();
  }, [open, settingsOpen]);

  if (!open) return null;

  return (
    <section
      role="region"
      aria-label="Cookie consent"
      aria-describedby="cookie-consent-copy"
      className="px-page pointer-events-none fixed inset-x-0 bottom-0 z-[250] pb-4 sm:pb-6"
      style={{ fontFamily: 'var(--font-josefin)' }}
    >
      <div className="pointer-events-auto ml-auto max-w-[640px] border border-[#111111]/15 bg-white p-6 text-[#111111] shadow-[0_18px_48px_rgba(17,17,17,0.12)] sm:p-7">
        <p className="text-[12px] font-[600] uppercase tracking-[0.24em]">Cookies</p>
        <p id="cookie-consent-copy" className="mt-3 text-[15px] font-[300] leading-[1.5]">
          With your permission we use Meta&rsquo;s Pixel and Conversions API to measure how our
          advertising performs. Nothing is set until you choose, and you can change your choice at
          any time from &ldquo;Cookie settings&rdquo; in the footer. Read our{' '}
          <Link
            href={`/${locale}/privacy-policy#cookies`}
            className="underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold"
          >
            cookie and privacy policy
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button ref={firstButton} type="button" onClick={grant} className={BUTTON}>
            <span className="button-label">Accept</span>
          </button>
          <button type="button" onClick={deny} className={BUTTON}>
            <span className="button-label">Reject</span>
          </button>
          {settingsOpen && consent !== 'unknown' && (
            <button
              type="button"
              onClick={closeSettings}
              className="min-h-12 text-[14px] font-[300] underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-threshold sm:ml-auto"
            >
              Keep current choice
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
