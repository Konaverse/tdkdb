'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, gsapInit, SplitText } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import type { SiteSettings } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ContactSection — the homepage's last word before the footer

   From the Sept 2026 board "contact section.png" (Norm Architects' contact
   page as the reference): a giant CONTACT top left, an intro under it, a grid
   of labelled details to its right, and a tall photograph holding the whole
   right edge.

   TDK VERSION
   · Josefin light for CONTACT, spaced to hold the board's width.
   · The details are real and come from Sanity siteSettings (email, phone,
     address, socials) — nothing is hardcoded. The board's six cells become
     four, because four is what TDK has: new residences, general enquiries,
     the studio, follow us.
   · One link to the contact form sits under the intro ("Write to us"). It
     is the section's one teal moment, on hover.
   · Each detail cell carries a hairline above it: the grid is drawn, as on
     the About plate.

   MOTION — once, on arrival, nothing on scroll
   · CONTACT: every letter slides one slot right into its own mask, the
     hero's TDK reveal, so the page ends the way it began.
   · The photograph wipes down from its top edge while the render inside
     settles out of a slight over-scale (clip and scale on separate nodes).
   · The intro and every detail value are written on line by line, left to
     right (SplitText lines in masks), the hero's paragraph reveal.
   · Cell hairlines draw left to right just before their text lands.

   LAYERS — one node, one property
     [data-letter]   xPercent      entrance
     [data-plate]    clip-path     entrance
       [data-settle] scale         entrance
     [data-rule]     scaleX        entrance
     line masks      clip-path     entrance
   ─────────────────────────────────────────────────────────────────────────── */

const IMAGE_ID = 'clients/tdkdb/armonia/interior/6';

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.48)';
const RULE = 'rgba(17, 17, 17, 0.14)';

const HEADING = 'CONTACT';

const INTRO =
  'For a new home, a question about a residence, or simply to say hello, we would like to hear from you.';

const REGISTER_HREF = '/en/projects/almond-suites';
const FORM_HREF = '/en/contact';

interface ContactSectionProps {
  settings: SiteSettings | null;
}

/** "Nafpliou 1, Lakatameia, Nicosia, Cyprus" → one line per part. */
function addressLines(address?: string): string[] {
  return (address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ContactSection({ settings }: ContactSectionProps) {
  const rootRef = useRef<HTMLElement>(null);

  const email = settings?.email;
  const phone = settings?.phone;
  const address = addressLines(settings?.address);
  const socials = settings?.socialLinks ?? [];

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    if (!scope) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ctx: gsap.Context | null = null;
    let alive = true;

    const build = () => {
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(scope);
        const letters = q('[data-letter]');
        const plate = q('[data-plate]')[0];
        const settle = q('[data-settle]')[0];
        const cta = q('[data-cta]')[0];
        const cells = q('[data-cell]') as HTMLElement[];

        const split = (el: Element) => {
          const s = SplitText.create(el, { type: 'lines', mask: 'lines' });
          gsap.set(s.masks, { width: 'fit-content', marginRight: 'auto' });
          return s.masks as HTMLElement[];
        };
        const introMasks = split(q('[data-intro]')[0]);
        const cellParts = cells.map((cell) => ({
          rule: cell.querySelector('[data-rule]'),
          masks: Array.from(cell.querySelectorAll('[data-lines]')).flatMap(split),
        }));

        /* hidden state, set here so a no-JS pass is always complete */
        gsap.set(letters, { xPercent: -100, x: 0 });
        gsap.set(plate, { clipPath: 'inset(0% 0% 100% 0%)' });
        gsap.set(settle, { scale: 1.14 });
        gsap.set([...introMasks, ...cellParts.flatMap((c) => c.masks)], {
          clipPath: 'inset(0% 100% 0% 0%)',
        });
        gsap.set(
          cellParts.map((c) => c.rule),
          { scaleX: 0 },
        );
        gsap.set(cta, { autoAlpha: 0 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: scope, start: 'top 68%', once: true },
        });

        tl.to(plate, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' }, 0);
        tl.to(settle, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0.25);

        tl.to(
          letters,
          { xPercent: 0, x: 0, duration: 1.2, ease: 'power4.out', stagger: 0.07 },
          0.2,
        );

        tl.to(
          introMasks,
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power2.inOut', stagger: 0.14 },
          0.75,
        );
        tl.to(cta, { autoAlpha: 1, duration: 0.8, ease: 'power1.out' }, 1.25);

        cellParts.forEach((c, i) => {
          const at = 0.95 + i * 0.16;
          if (c.rule) {
            tl.to(c.rule, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, at);
          }
          tl.to(
            c.masks,
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.inOut', stagger: 0.08 },
            at + 0.3,
          );
        });
      }, scope);
    };

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (alive) build();
    });

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, []);

  const label = 'mb-4 text-[clamp(12px,0.82vw,14px)] font-[400] tracking-[0.02em]';
  const value = 'text-[clamp(14px,1vw,17px)] font-[400] leading-[1.45]';
  const link =
    'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-smooth hover:bg-[length:100%_1px]';

  return (
    <section
      data-nav="light"
      ref={rootRef}
      id="contact"
      aria-labelledby="contact-heading"
      className="relative w-full"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1fr_29vw]">
        {/* ── Left: heading, intro, details ── */}
        <div className="flex flex-col px-5 pb-16 pt-28 sm:px-8 lg:pb-[11svh] lg:pl-[8.2vw] lg:pr-[4vw] lg:pt-[19svh]">
          <h2
            id="contact-heading"
            aria-label="Contact"
            className="-mt-[0.2em] whitespace-nowrap text-[clamp(56px,7.4vw,150px)] font-[300] leading-[0.9] tracking-[0.06em]"
          >
            {HEADING.split('').map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block overflow-hidden pb-[0.06em] pt-[0.2em] align-top"
              >
                <span data-letter className="inline-block will-change-transform">
                  {ch}
                </span>
              </span>
            ))}
          </h2>

          <div className="mt-14 grid gap-14 lg:mt-[14svh] lg:grid-cols-[minmax(0,19vw)_minmax(0,1fr)] lg:gap-[8vw]">
            {/* Intro and the one link to the form */}
            <div>
              <p
                data-intro
                className="max-w-[26ch] text-[clamp(19px,1.55vw,28px)] font-[300] leading-[1.3]"
              >
                {INTRO}
              </p>
              <Link
                data-cta
                href={FORM_HREF}
                className="group mt-9 inline-flex items-center gap-4 text-[clamp(13px,0.9vw,15px)] font-[600] uppercase tracking-[0.2em]"
              >
                <span className="transition-colors duration-300 group-hover:text-threshold">
                  Write to us
                </span>
                <span
                  aria-hidden="true"
                  className="relative block h-px w-10 bg-current transition-[width,background-color] duration-500 ease-smooth group-hover:w-16 group-hover:bg-threshold"
                >
                  <span className="absolute -top-[3px] right-0 block h-[7px] w-[7px] rotate-45 border-r border-t border-current transition-colors duration-300 group-hover:border-threshold" />
                </span>
              </Link>
            </div>

            {/* The details */}
            <div className="grid grid-cols-1 gap-x-[4vw] gap-y-12 sm:grid-cols-2 lg:gap-y-[7svh]">
              <Cell labelClass={label} title="New residences">
                <div data-lines className={value}>
                  Almond Suites, Strovolos
                  <br />
                  Now under construction
                </div>
                <div data-lines className={`${value} mt-2`}>
                  <Link href={REGISTER_HREF} className={link}>
                    Register your interest
                  </Link>
                </div>
              </Cell>

              <Cell labelClass={label} title="General enquiries">
                {email && (
                  <div data-lines className={value}>
                    <a href={`mailto:${email}`} className={link}>
                      {email}
                    </a>
                  </div>
                )}
                {phone && (
                  <div data-lines className={value}>
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className={link}>
                      {phone}
                    </a>
                  </div>
                )}
              </Cell>

              {address.length > 0 && (
                <Cell labelClass={label} title="Studio">
                  <address data-lines className={`${value} not-italic`}>
                    {address.map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < address.length - 1 && <br />}
                      </span>
                    ))}
                  </address>
                </Cell>
              )}

              {socials.length > 0 && (
                <Cell labelClass={label} title="Follow us">
                  {/* One per line, as the address is. Not flex: the split drops gaps. */}
                  <div data-lines className={value}>
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
                  </div>
                </Cell>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: the photograph, full height ── */}
        <div
          data-nav="dark"
          className="relative aspect-[4/5] w-full overflow-hidden lg:aspect-auto"
        >
          <div data-plate className="absolute inset-0 overflow-hidden">
            <div data-settle className="absolute inset-0 will-change-transform">
              <img
                src={cloudinaryUrl(IMAGE_ID, { width: 1400 })}
                alt="Armonia terrace, a sofa against the glass wall"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={{ objectPosition: '10% 50%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({
  title,
  labelClass,
  children,
}: {
  title: string;
  labelClass: string;
  children: React.ReactNode;
}) {
  return (
    <div data-cell className="relative pt-5">
      <span
        data-rule
        aria-hidden="true"
        className="absolute left-0 top-0 block h-px w-full origin-left"
        style={{ background: RULE }}
      />
      <p className={labelClass} style={{ color: MUTED }}>
        {title}
      </p>
      {children}
    </div>
  );
}
