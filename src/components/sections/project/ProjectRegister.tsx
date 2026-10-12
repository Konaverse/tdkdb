'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { maskChars, riseIn } from '@/lib/animations/text';
import TDKSelect from '@/components/forms/TDKSelect';
import controls from '@/components/forms/FormControls.module.css';
import { submissionAttempt, type SubmissionAttempt } from '@/lib/contact/attribution';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectRegister — the page's last word: leave your details

   The one teal ground on the page, so the ending reads as a destination. A
   very large heading on the left; on the right a short form whose fields are
   solid blocks rather than underlined lines, turning white when focused.
   Posts to /api/project-interest (validation, rate limit, Resend, Sanity
   lead) with explicit validation and delivery error handling.

   MOTION — once, on arrival: the heading rises letter by letter through masks, the
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
const FIELD = controls.control;
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'name' | 'email', string>>>({});
  const attemptRef = useRef<SubmissionAttempt | null>(null);
  const submittingRef = useRef(false);

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const words = maskChars(gsap.utils.toArray<HTMLElement>('[data-word]')).chars;
      const rise = gsap.utils.toArray<HTMLElement>('[data-rise]');
      gsap.set(rise, { autoAlpha: 0, y: 24 });
      const tl = gsap
        .timeline({ paused: true })
        .to(words, riseIn(words), 0)
        .to(rise, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 }, 0.35);
      ScrollTrigger.create({
        trigger: root,
        start: 'top 80%',
        once: true,
        animation: tl,
      }).refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current || status === 'sending') return;
    const form = e.currentTarget;
    const fields = new FormData(form);
    const field = (name: string) => String(fields.get(name) ?? '').trim();
    const data = {
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
      unitPreference: field('unitPreference'),
      message: field('message'),
      projectSlug,
      projectName,
      _honeypot: field('_honeypot'),
    };
    const next: Partial<Record<'name' | 'email', string>> = {};
    if (!data.name) next.name = 'Please tell us your name.';
    if (!data.email) next.email = 'Please leave an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      next.email = 'Please enter a valid email address.';
    setFieldErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    attemptRef.current = submissionAttempt(data, attemptRef.current);
    submittingRef.current = true;
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/project-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          submissionId: attemptRef.current.submissionId,
          attribution: attemptRef.current.attribution,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setStatus('sent');
        try {
          (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.(
            'event',
            'project_interest_submit',
            { project_slug: projectSlug, unit_preference: data.unitPreference },
          );
        } catch {
          console.warn('Enquiry submitted; analytics event unavailable.');
        }
      } else {
        setStatus('error');
        setError(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setError('We could not reach the server. Please try again.');
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <section
      ref={rootRef}
      id="register-interest"
      data-nav="dark"
      aria-labelledby="register-heading"
      className={`${controls.teal} px-page lg:gap-x-gutter relative grid min-h-svh gap-16 pb-[14svh] pt-[16svh] text-white lg:grid-cols-12`}
      style={{ background: TEAL, fontFamily: 'var(--font-josefin)' }}
    >
      <div className="lg:col-span-5">
        <h2
          id="register-heading"
          className="text-[clamp(56px,7.2vw,138px)] font-[300] leading-[0.92] tracking-[-0.01em]"
        >
          {heading.split(' ').map((w, i) => (
            <span
              key={i}
              className="-mb-[0.1em] -mt-[0.18em] block overflow-hidden pb-[0.1em] pt-[0.18em]"
            >
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
          <form
            onSubmit={onSubmit}
            noValidate
            aria-label={`Register interest in ${projectName}`}
            aria-busy={status === 'sending'}
            className="grid gap-x-5 gap-y-7 sm:grid-cols-2"
          >
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
              <div className={controls.shell}>
                <input
                  id="ri-name"
                  name="name"
                  required
                  maxLength={200}
                  autoComplete="name"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'ri-name-error' : undefined}
                  className={FIELD}
                />
              </div>
              {fieldErrors.name && (
                <p id="ri-name-error" className="mt-2 text-[13px] text-white">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div data-rise>
              <label htmlFor="ri-email" className={LABEL}>
                Email
              </label>
              <div className={controls.shell}>
                <input
                  id="ri-email"
                  name="email"
                  type="email"
                  required
                  maxLength={320}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'ri-email-error' : undefined}
                  className={FIELD}
                />
              </div>
              {fieldErrors.email && (
                <p id="ri-email-error" className="mt-2 text-[13px] text-white">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div data-rise>
              <label htmlFor="ri-phone" className={LABEL}>
                Phone <span className="text-white/55">(optional)</span>
              </label>
              <div className={controls.shell}>
                <input
                  id="ri-phone"
                  name="phone"
                  type="tel"
                  maxLength={80}
                  autoComplete="tel"
                  className={FIELD}
                />
              </div>
            </div>
            <div data-rise>
              <label htmlFor="ri-pref" className={LABEL}>
                Interested in
              </label>
              <TDKSelect
                id="ri-pref"
                name="unitPreference"
                label="Interested in"
                placeholder="Any residence"
                options={[
                  { value: '', label: 'Any residence' },
                  ...preferences.map((value) => ({ value, label: value })),
                ]}
              />
            </div>
            <div data-rise className="sm:col-span-2">
              <label htmlFor="ri-message" className={LABEL}>
                Message <span className="text-white/55">(optional)</span>
              </label>
              <div className={controls.shell}>
                <textarea
                  id="ri-message"
                  name="message"
                  rows={4}
                  maxLength={10000}
                  className={`${FIELD} resize-none`}
                />
              </div>
            </div>

            <div
              data-rise
              className="flex flex-col-reverse items-start gap-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p
                role={status === 'error' ? 'alert' : undefined}
                aria-live="polite"
                className="text-[15px] text-white"
              >
                {status === 'error' ? error : ''}
              </p>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex min-h-12 items-center justify-center bg-white px-10 py-5 text-[13px] font-[600] uppercase tracking-[0.2em] text-[#111111] transition-colors duration-300 hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-60"
              >
                <span className="button-label">
                  {status === 'sending' ? 'Sending' : 'Register interest'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
