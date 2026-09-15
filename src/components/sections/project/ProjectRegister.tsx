'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectRegister — the page's last word: leave your details

   The one teal ground on the page, so the ending reads as a destination. A
   very large heading on the left; on the right a short form whose fields are
   solid blocks rather than underlined lines, turning white when focused.
   Posts to /api/project-interest (validation, rate limit, Resend, Sanity
   lead) — unchanged.

   MOTION — once, on arrival: the heading slides sideways into its mask, the
   intro and the fields rise in.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectRegisterProps {
  projectSlug: string;
  projectName: string;
  heading: string;
  intro: string;
  /** Options for the residence select, e.g. ["1 bedroom", "2 bedrooms"]. */
  preferences: string[];
}

const TEAL = '#66979f';
const FIELD =
  'block w-full bg-white/[0.14] px-5 py-4 text-[17px] font-[300] text-white outline-none transition-colors duration-300 placeholder:text-white/55 focus:bg-white focus:text-[#111111] focus:placeholder:text-[#111111]/40';
const LABEL = 'mb-2.5 block text-[14px] font-[400] text-white/80';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ProjectRegister({
  projectSlug,
  projectName,
  heading,
  intro,
  preferences,
}: ProjectRegisterProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-word]');
      const rise = gsap.utils.toArray<HTMLElement>('[data-rise]');
      gsap.set(words, { xPercent: -104, x: 0 });
      gsap.set(rise, { autoAlpha: 0, y: 24 });
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top 80%', once: true } })
        .to(words, { xPercent: 0, x: 0, duration: 1.3, ease: 'power4.out', stagger: 0.09 }, 0)
        .to(rise, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 0.35);
    }, root);

    return () => ctx.revert();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;

    const field = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';

    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/project-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: field('name'),
          email: field('email'),
          phone: field('phone'),
          unitPreference: field('unitPreference'),
          message: field('message'),
          projectSlug,
          projectName,
          _honeypot: field('_honeypot'),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        setStatus('sent');
        (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
          'event',
          'project_interest_submit',
          { project_slug: projectSlug, unit_preference: field('unitPreference') },
        );
      } else {
        setStatus('error');
        setError(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setError('We could not reach the server. Please try again.');
    }
  }

  return (
    <section
      ref={rootRef}
      id="register-interest"
      data-nav="dark"
      aria-labelledby="register-heading"
      className="relative grid min-h-svh gap-16 px-page pb-[14svh] pt-[16svh] text-white lg:grid-cols-12 lg:gap-x-gutter"
      style={{ background: TEAL, fontFamily: 'var(--font-josefin)' }}
    >
      <div className="lg:col-span-5">
        <h2
          id="register-heading"
          className="text-[clamp(56px,7.2vw,138px)] font-[300] leading-[0.92] tracking-[-0.01em]"
        >
          {heading.split(' ').map((w, i) => (
            <span key={i} className="block overflow-hidden pb-[0.1em]">
              <span data-word className="block">
                {w}
              </span>
            </span>
          ))}
        </h2>
        <p
          data-rise
          className="mt-10 max-w-[30ch] text-[clamp(19px,1.5vw,26px)] font-[300] leading-[1.35] text-white/90"
        >
          {intro}
        </p>
      </div>

      <div className="lg:col-span-6 lg:col-start-7 lg:self-end">
        {status === 'sent' ? (
          <div aria-live="polite">
            <p className="text-[clamp(30px,2.8vw,52px)] font-[300] leading-[1.15]">
              Thank you. We have your details.
            </p>
            <p className="mt-6 max-w-[40ch] text-[clamp(17px,1.25vw,21px)] font-[300] text-white/85">
              Someone from the studio will be in touch about {projectName} shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="grid gap-x-5 gap-y-7 sm:grid-cols-2">
            <input
              type="text"
              name="_honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            <div data-rise>
              <label htmlFor="ri-name" className={LABEL}>
                Name
              </label>
              <input id="ri-name" name="name" required autoComplete="name" className={FIELD} />
            </div>
            <div data-rise>
              <label htmlFor="ri-email" className={LABEL}>
                Email
              </label>
              <input
                id="ri-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={FIELD}
              />
            </div>
            <div data-rise>
              <label htmlFor="ri-phone" className={LABEL}>
                Phone <span className="text-white/55">(optional)</span>
              </label>
              <input id="ri-phone" name="phone" type="tel" autoComplete="tel" className={FIELD} />
            </div>
            <div data-rise>
              <label htmlFor="ri-pref" className={LABEL}>
                Interested in
              </label>
              <select
                id="ri-pref"
                name="unitPreference"
                defaultValue=""
                className={`${FIELD} appearance-none bg-[length:12px] bg-[right_20px_center] bg-no-repeat`}
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='white' stroke-width='1.2'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E\")",
                }}
              >
                <option value="" className="text-[#111111]">
                  Any residence
                </option>
                {preferences.map((p) => (
                  <option key={p} value={p} className="text-[#111111]">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div data-rise className="sm:col-span-2">
              <label htmlFor="ri-message" className={LABEL}>
                Message <span className="text-white/55">(optional)</span>
              </label>
              <textarea
                id="ri-message"
                name="message"
                rows={4}
                className={`${FIELD} resize-none`}
              />
            </div>

            <div
              data-rise
              className="flex flex-col-reverse items-start gap-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p aria-live="polite" className="text-[15px] text-white">
                {status === 'error' ? error : ''}
              </p>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-white px-10 py-5 text-[13px] font-[600] uppercase tracking-[0.2em] text-[#111111] transition-colors duration-300 hover:bg-[#111111] hover:text-white disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending' : 'Register interest'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
