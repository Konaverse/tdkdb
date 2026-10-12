'use client';

import { useLayoutEffect, useRef } from 'react';
import ContactForm from '@/components/contact/ContactForm';

import RevealFrame from '@/components/animations/RevealFrame';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { CHAR_HIDDEN, maskChars, riseIn, whenFontsReady } from '@/lib/animations/text';
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

   MOTION — once, on arrival: the heading and lead rise letter by letter, the details and fields rise, and the photograph
   takes the site's one image entrance.
   ─────────────────────────────────────────────────────────────────────────── */

interface ContactClientProps {
  settings: SiteSettings | null;
  /** siteImage `contact-plate`. */
  plate?: SanityImage;
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';

const LEAD =
  'Tell us about the home you have in mind, or ask about a residence. We read everything ourselves and answer within a day or two.';

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

    const cancelFonts = whenFontsReady(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);
        const leadEl = q('[data-lead]')[0];
        const leadSplit = leadEl ? maskChars(leadEl) : null;

        const heroChars = maskChars(q('[data-hero-word]')).chars;
        if (leadSplit) gsap.set(leadSplit.chars, CHAR_HIDDEN);
        gsap.set(q('[data-hero-copy]'), { autoAlpha: 1 });
        gsap.set(q('[data-rise]'), { autoAlpha: 0, y: 20 });

        const hero = gsap
          .timeline({ delay: 0.15, onComplete: () => leadSplit?.split.revert() })
          .to(heroChars, riseIn(heroChars), 0);
        if (leadSplit) {
          hero.to(leadSplit.chars, riseIn(leadSplit.chars), 0.45);
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
      cancelFonts();
      ctx?.revert();
    };
  }, []);

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
          <h1
            data-hero-copy
            className="-mb-[0.1em] -mt-[0.18em] overflow-hidden pb-[0.1em] pt-[0.18em] text-[clamp(64px,10.5vw,200px)] font-[200] leading-[0.86] tracking-[-0.02em] lg:col-span-7"
          >
            <span data-hero-word className="block">
              Contact
            </span>
          </h1>

          <p
            data-lead
            data-hero-copy
            className="max-w-[34ch] text-[clamp(18px,1.35vw,24px)] font-[300] leading-[1.45] lg:col-span-4 lg:col-start-9"
          >
            {LEAD}
          </p>
        </div>
      </section>

      {/* ── The letter, and the studio ───────────────────────────────────── */}
      <div data-body className="px-page lg:gap-x-gutter grid gap-y-20 pb-[18svh] lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ContactForm />
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

          <RevealFrame lightbox nav="dark" className="mt-16 aspect-[4/5] w-full">
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
