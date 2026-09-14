'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, MouseEvent } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import type { SocialLink } from '@/lib/sanity/types';
import { useIntro } from './IntroProvider';

/* ───────────────────────────────────────────────────────────────────────────
   Hero — "TDK" behind the building

   Three plates stacked in one frame, all in the render's own pixel space
   (1512 × 1300, aspect 1.163):

     1. `hero-plate`    — the street with the building removed: the render's
                          own sky interpolated across the footprint, the
                          inpainted plot below the horizon. Fully seen only
                          for the first second, before the building arrives.
     2. the letters     — TDK, DESIGN & BUILD, in container-query units so
                          they hold their place against the roofline at any
                          width. Every number is measured off the board.
     3. `hero-building` — the building alone, cut out along the sky with an
                          alpha channel, so the roof slab reads in front of the
                          D and the T's stem stops at the peak.

   The board is the plate at full width, taller than a viewport (the MacBook
   artboard is 3024 × 2600 against a 1964px screen), with the paragraphs and
   the CTA in the lower third of the PLATE. So the section is as tall as the
   plate and all desktop copy lives in plate coordinates too. On wide screens
   the frame is capped so the letter block still fits the first viewport; the
   narrow bands either side are covered by a blurred copy of the plate.

   Entrance: the letters are drawn first, then the building is built in front
   of them. That order is the studio in one move.

   Layering discipline (see gsap-transform-pitfalls): every animated
   transform property has its own node. Scroll `y` wrappers sit outside the
   entrance nodes; percentage offsets are set by gsap.set(), never by class.
   ─────────────────────────────────────────────────────────────────────────── */

const PLATE_W = 1512;
const PLATE_H = 1300;
const ASPECT = PLATE_W / PLATE_H;
const A = ASPECT.toFixed(4);

/** Frame maths, on the section so the frame and the section height share it.
    --hw  frame width: viewport width, capped where the letter block (rows
          13.7–68.6% of the plate) would no longer fit the viewport height.
    --hh  frame height, from the plate's aspect.
    --ht  frame top: 0, or up to 10% of the plate slid off the top so the
          letters survive a wide crop. */
const SECTION_VARS: CSSProperties = {
  ['--hw' as string]: `min(max(100vw, calc(100svh * ${A})), calc(100svh * 1.984))`,
  ['--hh' as string]: `calc(var(--hw) / ${A})`,
  ['--ht' as string]: 'clamp(calc(var(--hh) * -0.1), calc(100svh - var(--hh) * 0.69), 0px)',
  height: 'calc(var(--hh) + var(--ht))',
  minHeight: '100svh',
};

const FRAME_STYLE: CSSProperties = {
  width: 'var(--hw)',
  height: 'var(--hh)',
  left: 'calc((100vw - var(--hw)) / 2)',
  top: 'var(--ht)',
  containerType: 'inline-size',
};

/** Plate-space copy positions, measured off the board as fractions of the
    plate and expressed in cqw (fractions of height × 85.98). */
const COPY: CSSProperties = {
  fontSize: 'clamp(13px, 1.2cqw, 20px)',
  lineHeight: 1.3,
};

export interface HeroProps {
  /** Two short paragraphs — bottom-left and centre-bottom of the plate. */
  paragraphs: [string, string];
  socials: SocialLink[];
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Hero({
  paragraphs,
  socials,
  ctaLabel = 'See Our Projects',
  ctaHref = '/en/projects',
}: HeroProps) {
  const { phase } = useIntro();

  const sectionRef = useRef<HTMLElement>(null);
  const plateScrollRef = useRef<HTMLDivElement>(null); // scroll — y
  const plateEnterRef = useRef<HTMLDivElement>(null); // entrance — scale
  const lettersScrollRef = useRef<HTMLDivElement>(null); // scroll — y
  const buildingScrollRef = useRef<HTMLDivElement>(null); // scroll — y
  const buildingEnterRef = useRef<HTMLDivElement>(null); // entrance — y / alpha
  const mobileTitleRef = useRef<HTMLDivElement>(null); // scroll — y

  // ── Entrance ──────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (phase === 'loading') return;
    gsapInit();

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const glyphs = gsap.utils.toArray<HTMLElement>('[data-glyph]');
      const subLines = gsap.utils.toArray<HTMLElement>('[data-sub-line]');
      const chrome = gsap.utils.toArray<HTMLElement>('[data-chrome]');
      const mobileLines = gsap.utils.toArray<HTMLElement>('[data-mobile-line]');

      // Start states. Percentages MUST be established here, not in CSS — a
      // class-based translate computes to a pixel matrix that GSAP reads back
      // as `y`, and the yPercent tween that undoes it silently no-ops.
      gsap.set(glyphs, { yPercent: 40, y: 0, autoAlpha: 0 });
      gsap.set(mobileLines, { yPercent: 40, y: 0, autoAlpha: 0 });
      gsap.set(subLines, { x: 40, autoAlpha: 0 });
      gsap.set(buildingEnterRef.current, { y: 70, autoAlpha: 0 });
      gsap.set(plateEnterRef.current, { scale: 1.08 });
      gsap.set(chrome, { y: 16, autoAlpha: 0 });

      if (reduced) {
        gsap.set([...glyphs, ...mobileLines], { yPercent: 0, autoAlpha: 1 });
        gsap.set(subLines, { x: 0, autoAlpha: 1 });
        gsap.set(buildingEnterRef.current, { y: 0, autoAlpha: 1 });
        gsap.set(plateEnterRef.current, { scale: 1 });
        gsap.set(chrome, { y: 0, autoAlpha: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. The plot. Settles out of a slow over-scale for the whole intro.
      tl.to(plateEnterRef.current, { scale: 1, duration: 2.8, ease: 'power2.out' }, 0);

      // 2. The drawing — T, D, K rise in one after the other.
      tl.to(glyphs, { yPercent: 0, autoAlpha: 1, duration: 1.2, stagger: 0.14 }, 0.25);
      tl.to(mobileLines, { yPercent: 0, autoAlpha: 1, duration: 1.1, stagger: 0.12 }, 0.25);
      tl.to(subLines, { x: 0, autoAlpha: 1, duration: 0.9, stagger: 0.1 }, 0.85);

      // 3. The build — the building rises in front of the letters.
      tl.to(
        buildingEnterRef.current,
        { y: 0, autoAlpha: 1, duration: 1.7, ease: 'power3.out' },
        1.0,
      );

      // 4. Everything that talks — after the picture is complete.
      tl.to(chrome, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.08 }, 1.7);
    }, section);

    return () => ctx.revert();
  }, [phase]);

  // ── Scroll exit ───────────────────────────────────────────────────────────
  // Two depths. The plate and the building travel together — they share a
  // ground line, and any difference between them would lift the building off
  // its own fence. The letters, behind both, lag, so the roofline slides up
  // the D as the section leaves.
  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add(
      { isDesktop: '(min-width: 1024px)', isReduced: '(prefers-reduced-motion: reduce)' },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as {
          isDesktop: boolean;
          isReduced: boolean;
        };
        if (isReduced) return;

        const tl = gsap.timeline({
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });

        tl.to([plateScrollRef.current, buildingScrollRef.current], { y: -140 }, 0);
        if (isDesktop) {
          tl.to(lettersScrollRef.current, { y: -60 }, 0);
        } else {
          tl.to(mobileTitleRef.current, { y: -80 }, 0);
        }
      },
    );

    return () => mm.revert();
  }, []);

  // The CTA scrolls to the projects section when it is on the page, and only
  // falls through to the projects index when it is not.
  const onCta = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById('projects');
    if (!target) return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  const cta = (
    <Link
      href={ctaHref}
      onClick={onCta}
      className="group pointer-events-auto relative inline-block whitespace-nowrap px-[1.1em] py-[0.7em] font-[400] tracking-[0.02em] text-white"
    >
      {/* Corner brackets — draw closed on hover. */}
      <span className="absolute left-0 top-0 h-[0.8em] w-[0.8em] border-l border-t border-white transition-all duration-medium ease-smooth group-hover:h-full group-hover:w-full" />
      <span className="absolute bottom-0 right-0 h-[0.8em] w-[0.8em] border-b border-r border-white transition-all duration-medium ease-smooth group-hover:h-full group-hover:w-full" />
      {ctaLabel}
    </Link>
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#0e141c', ...SECTION_VARS }}
    >
      {/* Ambient backdrop — only ever visible in the side bands on very wide
          viewports, where the frame is capped narrower than the screen. */}
      <Image
        src="/hero/hero-plate-blur.webp"
        alt=""
        fill
        unoptimized
        sizes="100vw"
        className="object-cover opacity-80"
        aria-hidden="true"
      />

      {/* ── Frame — plate coordinates ─────────────────────────────────────── */}
      <div className="absolute" style={FRAME_STYLE}>
        {/* 1 · empty plot */}
        <div ref={plateScrollRef} className="absolute inset-0 will-change-transform">
          <div ref={plateEnterRef} className="absolute inset-0 will-change-transform">
            <Image
              src="/hero/hero-plate.webp"
              alt=""
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* 2 · the letters — desktop only; below lg the title is set in the
               viewport layer instead, where it can scale with the screen. */}
        <div
          ref={lettersScrollRef}
          className="absolute inset-0 hidden select-none text-white lg:block"
          style={{ fontFamily: 'var(--font-josefin)' }}
          aria-hidden="true"
        >
          {/* TDK. Measured off the board: cap top at 13.69% of the plate's
              height, caps 42.0% tall, ink from 26.9% to 98.7% of the width.
              Josefin at that cap height is ~17% wider than the board's
              letters, so the block is tracked tight and compressed to land
              on both edges — that is what puts the T's stem on the roof peak
              and the D's bowl behind the slab. Offsets below are the font's
              own metrics (cap 0.719em, T's left bearing 0.047em). */}
          <div
            className="absolute flex origin-top-left"
            style={{
              left: '24.9cqw',
              top: '10.2cqw',
              fontSize: '50.3cqw',
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: '-0.08em',
              transform: 'scaleX(0.835)',
            }}
          >
            {['T', 'D', 'K'].map((ch) => (
              <span
                key={ch}
                data-glyph
                className="block will-change-transform"
                style={{ visibility: 'hidden' }}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* DESIGN & / BUILD — right-aligned under the K, each line placed
              on its own so the measured tops hold (54.3% and 62.3% of H). */}
          {[
            { text: 'DESIGN &', top: '46.8cqw' },
            { text: 'BUILD', top: '53.4cqw' },
          ].map(({ text, top }) => (
            <span
              key={text}
              data-sub-line
              className="absolute block whitespace-nowrap will-change-transform"
              style={{
                right: '0.84cqw',
                top,
                fontSize: '6.4cqw',
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: '0.02em',
                visibility: 'hidden',
              }}
            >
              {text}
            </span>
          ))}
        </div>

        {/* 3 · the building */}
        <div ref={buildingScrollRef} className="absolute inset-0 will-change-transform">
          <div
            ref={buildingEnterRef}
            className="absolute inset-0 will-change-transform"
            style={{ visibility: 'hidden' }}
          >
            <Image
              src="/hero/hero-building.webp"
              alt="Almond Suites, Strovolos — the current TDK project"
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* ── Desktop copy — plate coordinates, as on the board ──────────── */}
        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          {/* Socials — a column at the top-left, under the navbar. */}
          {socials.length > 0 && (
            <ul
              className="absolute flex flex-col"
              style={{ left: '2cqw', top: '11.9cqw', gap: '0.55cqw' }}
            >
              {socials.map((s) => (
                <li key={s.platform} data-chrome className="will-change-transform">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="pointer-events-auto grid place-items-center rounded-full transition-transform duration-medium ease-smooth hover:scale-110"
                    style={{ width: '4.2cqw', height: '4.2cqw', backgroundColor: '#e8e8ea' }}
                  >
                    <SocialGlyph platform={s.platform} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Paragraph 1 — bottom-left, over the fence. */}
          <p
            data-chrome
            className="absolute text-white will-change-transform"
            style={{ ...COPY, left: '2cqw', top: '60cqw', width: '30.5cqw' }}
          >
            {paragraphs[0]}
          </p>

          {/* Paragraph 2 — centre, on the pavement. */}
          <p
            data-chrome
            className="absolute text-white will-change-transform"
            style={{ ...COPY, left: '34.5cqw', top: '72.5cqw', width: '30.5cqw' }}
          >
            {paragraphs[1]}
          </p>

          {/* CTA — bracketed label, lower right. */}
          <div
            data-chrome
            className="absolute will-change-transform"
            style={{ left: '76cqw', top: '79.4cqw', fontSize: 'clamp(12px, 1.05cqw, 17px)' }}
          >
            {cta}
          </div>
        </div>
      </div>

      {/* Accessible name for the composition. */}
      <h1 className="sr-only">TDK Design &amp; Build</h1>

      {/* ── Mobile layer — viewport coordinates, below lg only ────────────── */}
      <div className="pointer-events-none absolute inset-0 z-10 lg:hidden">
        <div
          ref={mobileTitleRef}
          className="absolute left-5 right-5 top-[13svh] text-white will-change-transform"
          style={{ fontFamily: 'var(--font-josefin)' }}
          aria-hidden="true"
        >
          <span className="block overflow-hidden">
            <span
              data-mobile-line
              className="block text-[34vw] font-[200] leading-[0.9] tracking-[-0.01em]"
              style={{ visibility: 'hidden' }}
            >
              TDK
            </span>
          </span>
          <span className="mt-2 block overflow-hidden text-right">
            <span
              data-mobile-line
              className="block text-[8.5vw] font-[300] leading-[1.2] tracking-[0.07em]"
              style={{ visibility: 'hidden' }}
            >
              DESIGN &amp;
              <br />
              BUILD
            </span>
          </span>
        </div>

        <p
          data-chrome
          className="absolute bottom-[12svh] left-5 right-5 text-[15px] leading-[1.4] text-white will-change-transform"
        >
          {paragraphs[0]}
        </p>

        <div
          data-chrome
          className="absolute bottom-[4svh] right-5 text-[13px] will-change-transform"
        >
          {cta}
        </div>
      </div>
    </section>
  );
}

/* ── Social glyphs — monochrome brand marks on a light disc ─────────────── */

function SocialGlyph({ platform }: { platform: string }) {
  const key = platform.toLowerCase();
  const size = { width: '46%', height: '46%' };

  if (key.includes('instagram')) {
    return (
      <svg viewBox="0 0 24 24" style={size} fill="none" stroke="#111" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="#111" stroke="none" />
      </svg>
    );
  }
  if (key.includes('facebook')) {
    return (
      <svg viewBox="0 0 24 24" style={size} fill="#1877f2">
        <path d="M13.5 21v-7.3h2.5l.4-3h-2.9V8.9c0-.9.3-1.5 1.5-1.5h1.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8.1v3h2.5V21h2.9z" />
      </svg>
    );
  }
  if (key.includes('linkedin')) {
    return (
      <svg viewBox="0 0 24 24" style={{ width: '42%', height: '42%' }} fill="#0a66c2">
        <path d="M6.9 8.7H3.6V20h3.3V8.7zM5.3 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.1c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.7H10V20h3.3v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h3.3v-6.9z" />
      </svg>
    );
  }
  return (
    <span className="text-[11px] font-[600] uppercase text-[#111]">{platform.slice(0, 2)}</span>
  );
}
