'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import RevealFrame from '@/components/animations/RevealFrame';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';
import { imageSrcSet, imageUrl } from '@/lib/sanity/image';
import type { SanityImage, SiteSettings } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   Contact — the page

   Editorial and plain: a typographic hero (the page's name, as on the
   projects hub), then the letter itself — the form at six columns — with the
   studio's details beside it and one photograph under them. No eyebrows, no
   map embed (the old one dropped a generic Nicosia pin behind a dark filter),
   and nothing hardcoded: every detail comes from Sanity siteSettings.

   The fields are solid blocks rather than underlines, as in the project
   page's register section; on white they sit on the faintest grey and take a
   teal ring when focused. Validation messages are teal — the page's one
   accent, used only where attention is needed.

   MOTION — once, on arrival: the heading slides into its mask, the lead is
   written on line by line, the details and fields rise, and the photograph
   takes the site's one image entrance.
   ─────────────────────────────────────────────────────────────────────────── */

interface ContactClientProps {
  settings: SiteSettings | null;
  /** siteImage `contact-plate`. */
  plate?: SanityImage;
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';
const TEAL = 'var(--color-threshold, #66979f)';

const LEAD =
  'Tell us about the home you have in mind, or ask about a residence. We read everything ourselves and answer within a day or two.';

const PROJECT_TYPES = [
  { value: 'new-build', label: 'A new build' },
  { value: 'renovation', label: 'A renovation' },
  { value: 'interior-design', label: 'Interior design' },
  { value: 'consultation', label: 'A consultation' },
  { value: 'other', label: 'Something else' },
];

const FIELD =
  'block w-full bg-[#f4f4f1] px-5 py-4 text-[17px] font-[300] text-[#111111] outline-none transition-colors duration-300 placeholder:text-[rgba(17,17,17,0.38)] focus-visible:bg-[#eceae5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-threshold)]';
const LABEL = 'mb-2.5 block text-[14px] font-[400]';

interface FieldErrors {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** "Nafpliou 1, Lakatameia, Nicosia, Cyprus" → two lines, as in the footer
    and the homepage's contact section. Four one-word lines read as a list. */
function addressLines(address?: string): string[] {
  const parts = (address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const half = Math.ceil(parts.length / 2);
  return [parts.slice(0, half), parts.slice(half)].filter((p) => p.length).map((p) => p.join(', '));
}

export default function ContactClient({ settings, plate }: ContactClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const email = settings?.email;
  const phone = settings?.phone;
  const address = addressLines(settings?.address);
  const socials = settings?.socialLinks ?? [];

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let alive = true;
    let ctx: gsap.Context | null = null;

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);
        const leadEl = q('[data-lead]')[0];
        const leadSplit = leadEl ? maskLines(leadEl) : null;

        gsap.set(q('[data-hero-word]'), { xPercent: -104, x: 0 });
        if (leadSplit) gsap.set(leadSplit.lines, { clipPath: LINE_HIDDEN });
        gsap.set(q('[data-rise]'), { autoAlpha: 0, y: 20 });

        const hero = gsap
          .timeline({ delay: 0.15, onComplete: () => leadSplit?.split.revert() })
          .to(q('[data-hero-word]'), { xPercent: 0, x: 0, duration: 1.4, ease: 'power4.out' }, 0);
        if (leadSplit) {
          hero.to(
            leadSplit.lines,
            { clipPath: LINE_SHOWN, duration: 0.9, ease: 'power2.inOut', stagger: 0.12 },
            0.45,
          );
        }

        gsap.to(q('[data-rise]'), {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: q('[data-body]')[0], start: 'top 85%', once: true },
        });

        ScrollTrigger.refresh();
      }, root);
    });

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const field = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';

    const data = {
      name: field('name'),
      email: field('email'),
      phone: field('phone'),
      projectType: field('projectType'),
      message: field('message'),
      _honeypot: field('_honeypot'),
    };

    const next: FieldErrors = {};
    if (!data.name.trim()) next.name = 'Please tell us your name.';
    if (!data.email.trim()) next.email = 'Please leave an email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'That address looks off.';
    if (!data.projectType) next.projectType = 'Please choose one.';
    if (!data.message.trim()) next.message = 'Please write us a line.';
    setErrors(next);
    if (Object.keys(next).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }

    setStatus('sending');
    setServerError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) setStatus('sent');
      else {
        setStatus('error');
        setServerError(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setServerError('We could not reach the server. Please try again.');
    }
  }

  const link =
    'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-smooth hover:bg-[length:100%_1px]';

  return (
    <main
      ref={rootRef}
      data-nav="light"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      {/* ── Hero — type only ─────────────────────────────────────────────── */}
      <section className="px-page flex min-h-[72svh] flex-col justify-end pb-[9svh] pt-[24svh]">
        <div className="lg:gap-x-gutter grid items-end gap-y-12 lg:grid-cols-12">
          <h1 className="-mb-[0.1em] -mt-[0.18em] overflow-hidden pb-[0.1em] pt-[0.18em] text-[clamp(64px,10.5vw,200px)] font-[200] leading-[0.86] tracking-[-0.02em] lg:col-span-7">
            <span data-hero-word className="block">
              Contact
            </span>
          </h1>

          <p
            data-lead
            className="max-w-[34ch] text-[clamp(18px,1.35vw,24px)] font-[300] leading-[1.45] lg:col-span-4 lg:col-start-9"
          >
            {LEAD}
          </p>
        </div>
      </section>

      {/* ── The letter, and the studio ───────────────────────────────────── */}
      <div data-body className="px-page lg:gap-x-gutter grid gap-y-20 pb-[18svh] lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-6">
          {status === 'sent' ? (
            <div aria-live="polite" data-rise>
              <p className="text-[clamp(28px,2.6vw,48px)] font-[300] leading-[1.15]">
                Thank you — your message is with us.
              </p>
              <p
                className="mt-6 max-w-[42ch] text-[clamp(17px,1.25vw,21px)] font-[300]"
                style={{ color: 'rgba(17, 17, 17, 0.72)' }}
              >
                Someone from the studio will write back within a day or two.
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="gap-x-gutter grid gap-y-7 sm:grid-cols-2"
            >
              <input
                type="text"
                name="_honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <Field id="c-name" name="name" label="Name" error={errors.name} autoComplete="name" />
              <Field
                id="c-email"
                name="email"
                type="email"
                label="Email"
                error={errors.email}
                autoComplete="email"
              />
              <Field
                id="c-phone"
                name="phone"
                type="tel"
                label="Phone"
                optional
                autoComplete="tel"
              />

              <div data-rise>
                <label htmlFor="c-type" className={LABEL}>
                  What is it about?
                </label>
                <select
                  id="c-type"
                  name="projectType"
                  defaultValue=""
                  aria-invalid={!!errors.projectType}
                  aria-describedby={errors.projectType ? 'c-type-note' : undefined}
                  className={`${FIELD} appearance-none bg-[length:12px] bg-[right_20px_center] bg-no-repeat`}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='%23111111' stroke-width='1.2'%3E%3Cpath d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E\")",
                  }}
                >
                  <option value="">Choose one</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.projectType && <Note id="c-type-note">{errors.projectType}</Note>}
              </div>

              <div data-rise className="sm:col-span-2">
                <label htmlFor="c-message" className={LABEL}>
                  Message
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  rows={6}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'c-message-note' : undefined}
                  className={`${FIELD} resize-none`}
                />
                {errors.message && <Note id="c-message-note">{errors.message}</Note>}
              </div>

              <div
                data-rise
                className="flex flex-col-reverse items-start gap-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <p aria-live="polite" className="text-[15px]" style={{ color: TEAL }}>
                  {status === 'error' ? serverError : ''}
                </p>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="bg-[#111111] px-10 py-5 text-[13px] font-[600] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[color:var(--color-threshold)] disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending' : 'Send message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* The studio */}
        <div className="lg:col-span-4 lg:col-start-9">
          <dl className="gap-x-gutter grid grid-cols-2 gap-y-10">
            {email && (
              <Detail label="Email" rise>
                <a href={`mailto:${email}`} className={link}>
                  {email}
                </a>
              </Detail>
            )}
            {phone && (
              <Detail label="Phone" rise>
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className={link}>
                  {phone}
                </a>
              </Detail>
            )}
            {address.length > 0 && (
              <Detail label="Studio" rise>
                <address className="not-italic">
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </Detail>
            )}
            {socials.length > 0 && (
              <Detail label="Follow" rise>
                {socials.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${link} block w-fit`}
                  >
                    {s.platform}
                  </a>
                ))}
              </Detail>
            )}
          </dl>

          <RevealFrame nav="dark" className="mt-16 aspect-[4/5] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plate ? imageUrl(plate, { width: 1200 }) : ''}
              srcSet={plate ? imageSrcSet(plate, [600, 900, 1200, 1600]) : undefined}
              sizes="(min-width: 1024px) 60vw, 100vw"
              alt="An Armonia interior, the glass wall onto the terrace"
              loading="lazy"
              decoding="async"
              className="block h-full w-full object-cover"
            />
          </RevealFrame>
        </div>
      </div>
    </main>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Field({
  id,
  name,
  label,
  type = 'text',
  error,
  optional,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  error?: string;
  optional?: boolean;
  autoComplete?: string;
}) {
  return (
    <div data-rise>
      <label htmlFor={id} className={LABEL}>
        {label} {optional && <span style={{ color: MUTED }}>(optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-note` : undefined}
        className={FIELD}
      />
      {error && <Note id={`${id}-note`}>{error}</Note>}
    </div>
  );
}

function Note({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 text-[14px]" style={{ color: TEAL }}>
      {children}
    </p>
  );
}

function Detail({
  label,
  rise,
  children,
}: {
  label: string;
  rise?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div {...(rise ? { 'data-rise': '' } : {})} className="min-w-0">
      <dt className="text-[clamp(12px,0.9vw,15px)]" style={{ color: MUTED }}>
        {label}
      </dt>
      <dd className="mt-2.5 text-[clamp(15px,1.15vw,19px)] font-[300] leading-[1.5]">{children}</dd>
    </div>
  );
}
