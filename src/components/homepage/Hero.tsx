'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, MouseEvent } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import type { SocialLink } from '@/lib/sanity/types';
import { useIntro } from './IntroProvider';

/* ───────────────────────────────────────────────────────────────────────────
   Hero — "TDK" behind the building

   Two supplied plates, identical 1512 × 1300 frames, stacked in one box with
   the letters between them:

     1. `hero-back`   — the street with the building removed.
     2. the letters   — TDK, in container-query units so they hold their place
                        against the roofline at any width. Every number is
                        measured off the board.
     3. `hero-front`  — the building and its ground, sky knocked out, so the
                        roof slab reads in front of the D and the T's stem
                        stops at the peak.

   The box is full-bleed: the section width at the plate's aspect, nothing
   cropped and nothing scaled. Like the board (3024 × 2600 against a 1964px
   screen) it is taller than a viewport, and the paragraphs and CTA sit in
   the lower third of the PLATE, so all desktop copy is in plate coordinates.

   ON LOAD, in order:
     · the back plate wipes in as vertical stripes, left to right;
     · T, D, K each slide one slot to the right into their own mask;
     · the front plate wipes down over the letters behind a soft edge;
     · the social rings draw, then their marks appear.
   ON REACHING THE VIEWPORT, once each (armed after the load sequence):
     · DESIGN & / BUILD slide in from the left, one line each;
     · the paragraphs slide in line by line (SplitText, masked lines);
     · the CTA's brackets grow from their corners, then the label wipes on.
   Nothing is scrubbed by scroll.

   Layering discipline (see gsap-transform-pitfalls): every animated
   transform property has its own node, and percentage offsets are set by
   gsap.set(), never by class.
   ─────────────────────────────────────────────────────────────────────────── */

const PLATE_W = 1512;
const PLATE_H = 1300;
const BACK_SRC = '/hero/hero-back.webp';

/** Vertical stripes the back plate is cut into for its wipe. */
const STRIPES = 14;

/** The frame is a normal block: full width at the plate's aspect, so the
    section is exactly as tall as the plate and nothing is cropped or scaled.
    Below `lg` (portrait screens) it is at least a viewport tall and the two
    plates cover it — still the same box, so they stay aligned. */
const FRAME_STYLE: CSSProperties = {
  aspectRatio: `${PLATE_W} / ${PLATE_H}`,
  containerType: 'inline-size',
};

/** Plate-space copy positions, measured off the board as fractions of the
    plate and expressed in cqw (fractions of height × 85.98). */
const COPY: CSSProperties = {
  fontSize: 'clamp(13px, 1.2cqw, 20px)',
  lineHeight: 1.3,
};

/** The front plate's wipe: a soft-edged mask driven by one CSS variable that
    GSAP tweens from 0% to past the bottom. */
const FRONT_MASK =
  'linear-gradient(to bottom, #000 calc(var(--wipe) - 9%), transparent var(--wipe))';

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
  const frontWrapRef = useRef<HTMLDivElement>(null); // carries --wipe
  const stripesRef = useRef<HTMLDivElement>(null); // the striped back plate
  const backRef = useRef<HTMLDivElement>(null); // the whole back plate, after the wipe

  // ── Entrance ──────────────────────────────────────────────────────────────
  // The load sequence is the picture: plot, letters, building, socials. The
  // copy — DESIGN & / BUILD, the paragraphs, the CTA — is on scroll triggers
  // created once the picture is complete, so whatever is already on screen
  // follows straight on and whatever is below the fold waits to be reached.
  useLayoutEffect(() => {
    if (phase === 'loading') return;
    gsapInit();

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {}, section);
    const splits: SplitText[] = [];

    // Line splitting needs the final font, so the whole sequence waits on it.
    // Anything created inside ctx.add() is tracked by the context.
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx.add(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const stripes = gsap.utils.toArray<HTMLElement>('[data-stripe]');
        const glyphs = gsap.utils.toArray<HTMLElement>('[data-glyph]');
        const mobileLines = gsap.utils.toArray<HTMLElement>('[data-mobile-line]');
        const subLines = gsap.utils.toArray<HTMLElement>('[data-sub-line]');
        const rings = gsap.utils.toArray<SVGCircleElement>('[data-ring]');
        const marks = gsap.utils.toArray<HTMLElement>('[data-mark]');
        const paras = gsap.utils.toArray<HTMLElement>('[data-para]');
        const ctas = gsap.utils.toArray<HTMLElement>('[data-cta]');
        const wrap = frontWrapRef.current;

        // Start states. Percentages MUST be established here, not in CSS — a
        // class-based translate computes to a pixel matrix that GSAP reads
        // back as `y`, and the percent tween that undoes it silently no-ops.
        // Each glyph sits one slot to the left, hidden by its own mask.
        gsap.set([...glyphs, ...mobileLines, ...subLines], {
          xPercent: -100,
          x: 0,
          visibility: 'visible',
        });
        gsap.set(rings, { strokeDashoffset: 1 });
        gsap.set(marks, { autoAlpha: 0 });
        ctas.forEach((cta) => {
          gsap.set(cta.querySelectorAll('[data-bracket]'), { scale: 0 });
          gsap.set(cta.querySelector('[data-cta-label]'), { clipPath: 'inset(0 100% 0 0)' });
        });

        if (reduced) {
          gsap.set(backRef.current, { autoAlpha: 1 });
          gsap.set(stripesRef.current, { display: 'none' });
          gsap.set([...glyphs, ...mobileLines, ...subLines], { xPercent: 0 });
          gsap.set(wrap, { '--wipe': '112%' });
          gsap.set(rings, { strokeDashoffset: 0 });
          gsap.set(marks, { autoAlpha: 1 });
          gsap.set(paras, { autoAlpha: 1 });
          ctas.forEach((cta) => {
            gsap.set(cta.querySelectorAll('[data-bracket]'), { scale: 1 });
            gsap.set(cta.querySelector('[data-cta-label]'), { clipPath: 'inset(0 0% 0 0)' });
          });
          return;
        }

        // Paragraphs are split into masked lines now, while the font is
        // certain, and revealed later by their own triggers.
        const lineSets = paras.map((p) => {
          const split = SplitText.create(p, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'hero-line',
          });
          splits.push(split);
          gsap.set(split.lines, { xPercent: -100, x: 0 });
          return { p, split };
        });

        // ── On scroll — each block reveals itself when it reaches the
        //    viewport, once. Created after the load sequence, inside the
        //    context so they are cleaned up with it.
        const armScrollReveals = () =>
          ctx.add(() => {
            const once = (trigger: Element) => ({
              scrollTrigger: { trigger, start: 'top 88%', once: true },
            });

            // DESIGN & / BUILD — the same side reveal as the letters.
            if (subLines.length) {
              gsap
                .timeline(once(subLines[0].parentElement as Element))
                .to(subLines, { xPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.15 });
            }

            // Paragraphs — line by line from the left. The split is undone
            // when the lines are home so the text reflows normally after.
            lineSets.forEach(({ p, split }) => {
              gsap
                .timeline(once(p))
                .set(p, { autoAlpha: 1 })
                .to(split.lines, {
                  xPercent: 0,
                  duration: 0.75,
                  ease: 'power3.out',
                  stagger: 0.07,
                  onComplete: () => split.revert(),
                });
            });

            // CTA — brackets grow out of their corners, then the label wipes on.
            ctas.forEach((cta) => {
              gsap
                .timeline(once(cta))
                .to(cta.querySelectorAll('[data-bracket]'), {
                  scale: 1,
                  duration: 0.45,
                  ease: 'power3.out',
                  stagger: 0.08,
                })
                .to(
                  cta.querySelector('[data-cta-label]'),
                  { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'power2.inOut' },
                  0.15,
                );
            });

            ScrollTrigger.refresh();
          });

        // ── On load ───────────────────────────────────────────────────────
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: armScrollReveals,
        });
        // Dev hook: lets the sequence be scrubbed from the console.
        if (process.env.NODE_ENV !== 'production') {
          const w = window as unknown as {
            __heroTl?: gsap.core.Timeline;
            __ST?: typeof ScrollTrigger;
          };
          w.__heroTl = tl;
          w.__ST = ScrollTrigger;
        }

        // 1. The plot — stripes wipe in, left to right.
        tl.to(
          stripes,
          { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power2.inOut', stagger: 0.06 },
          0,
        );
        // Once every stripe is open the plate is whole: swap the fourteen
        // layered slices for the single image so nothing heavy stays alive.
        tl.set(backRef.current, { autoAlpha: 1 }, 1.4).set(
          stripesRef.current,
          { display: 'none' },
          1.4,
        );

        // 2. The drawing — T, then D, then K, each sliding into its slot.
        glyphs.forEach((g, i) => {
          tl.to(g, { xPercent: 0, duration: 0.8, ease: 'power4.out' }, 0.9 + i * 0.3);
        });
        tl.to(mobileLines, { xPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.3 }, 0.9);

        // 3. The build — the front plate wipes down over the letters behind a
        //    soft edge.
        tl.to(wrap, { '--wipe': '112%', duration: 1.6, ease: 'power2.inOut' }, 1.9);

        // 4. Socials — each ring draws, then its mark appears.
        tl.to(
          rings,
          { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.12 },
          2.8,
        );
        tl.to(marks, { autoAlpha: 1, duration: 0.4, stagger: 0.12 }, 3.05);
      });
    });

    return () => {
      cancelled = true;
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [phase]);

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
      data-cta
      href={ctaHref}
      onClick={onCta}
      className="group pointer-events-auto relative inline-block whitespace-nowrap px-[1.1em] py-[0.7em] font-[400] tracking-[0.02em] text-white"
    >
      {/* Corner brackets — grow out of their corners on entrance, draw closed
          on hover. Resting scale is set by GSAP, not by a class. */}
      <span
        data-bracket
        className="absolute left-0 top-0 h-[0.8em] w-[0.8em] origin-top-left border-l border-t border-white transition-[width,height] duration-medium ease-smooth group-hover:h-full group-hover:w-full"
      />
      <span
        data-bracket
        className="absolute bottom-0 right-0 h-[0.8em] w-[0.8em] origin-bottom-right border-b border-r border-white transition-[width,height] duration-medium ease-smooth group-hover:h-full group-hover:w-full"
      />
      <span data-cta-label className="block" style={{ clipPath: 'inset(0 100% 0 0)' }}>
        {ctaLabel}
      </span>
    </Link>
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#0e141c' }}
    >
      {/* ── Frame — plate coordinates ─────────────────────────────────────── */}
      <div className="relative min-h-[100svh] w-full lg:min-h-0" style={FRAME_STYLE}>
        {/* 1 · back plate — cut into vertical stripes, each showing its own
               slice of the image so the wipe can run stripe by stripe. Each is
               a pixel wider than its share so no hairline opens at a seam. */}
        <div ref={backRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
          <Image
            src={BACK_SRC}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div ref={stripesRef} className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: STRIPES }, (_, i) => (
            <div
              key={i}
              data-stripe
              className="absolute inset-y-0"
              style={{
                left: `${(i * 100) / STRIPES}cqw`,
                width: `calc(${100 / STRIPES}cqw + 1px)`,
                backgroundImage: `url(${BACK_SRC})`,
                backgroundSize: '100cqw 100%',
                backgroundPosition: `-${(i * 100) / STRIPES}cqw 0`,
                backgroundRepeat: 'no-repeat',
                clipPath: 'inset(0 100% 0 0)',
              }}
            />
          ))}
        </div>

        {/* 2 · the letters — desktop only; below lg the title is set in the
               viewport layer instead, where it can scale with the screen. */}
        <div
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
              own metrics (cap 0.719em, T's left bearing 0.047em).

              Each letter sits in its own slot — the glyph's natural advance
              box, which holds its ink with room to spare — and the tight
              tracking is a negative margin BETWEEN slots rather than
              letter-spacing, so a slot never clips the glyph it masks. */}
          <div
            className="absolute flex origin-top-left"
            style={{
              left: '24.9cqw',
              top: '10.2cqw',
              fontSize: '50.3cqw',
              fontWeight: 200,
              lineHeight: 1,
              transform: 'scaleX(0.835)',
            }}
          >
            {['T', 'D', 'K'].map((ch) => (
              <span
                key={ch}
                data-slot
                className="block overflow-hidden"
                style={{ marginRight: '-0.08em' }}
              >
                <span
                  data-glyph
                  className="block will-change-transform"
                  style={{ visibility: 'hidden' }}
                >
                  {ch}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 3 · front plate — the building, sky knocked out. The wrapper owns
               --wipe; the masked layer reads it. */}
        <div ref={frontWrapRef} className="absolute inset-0" style={{ ['--wipe' as string]: '0%' }}>
          <div
            className="absolute inset-0"
            style={{ maskImage: FRONT_MASK, WebkitMaskImage: FRONT_MASK }}
          >
            <Image
              src="/hero/hero-front.webp"
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
        <div
          className="pointer-events-none absolute inset-0 z-10 hidden text-white lg:block"
          style={{ fontFamily: 'var(--font-josefin)' }}
        >
          {/* Socials — a column at the top-left, under the navbar. Hairline
              rings, white marks. */}
          {socials.length > 0 && (
            <ul
              className="absolute flex flex-col"
              style={{ left: '2cqw', top: '11.9cqw', gap: '0.55cqw' }}
            >
              {socials.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="group/ring pointer-events-auto relative grid place-items-center text-white"
                    style={{ width: '4.2cqw', height: '4.2cqw' }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 h-full w-full -rotate-90"
                    >
                      <circle
                        data-ring
                        cx="50"
                        cy="50"
                        r="49"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        pathLength={1}
                        strokeDasharray="1"
                        strokeDashoffset="1"
                        className="transition-opacity duration-medium ease-smooth group-hover/ring:opacity-60"
                      />
                    </svg>
                    <span
                      data-mark
                      className="relative grid h-[46%] w-[46%] place-items-center transition-transform duration-medium ease-smooth group-hover/ring:scale-110"
                      style={{ opacity: 0 }}
                    >
                      <SocialGlyph platform={s.platform} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Paragraph 1 — bottom-left, over the fence. */}
          <p
            data-para
            className="absolute text-white"
            style={{ ...COPY, left: '2cqw', top: '60cqw', width: '30.5cqw', opacity: 0 }}
          >
            {paragraphs[0]}
          </p>

          {/* Paragraph 2 and the CTA share a row: the CTA's bottom edge sits on
              the paragraph's, and its right edge on the headline's right ink
              edge (98.65% of the plate). */}
          <div
            className="absolute flex items-end justify-between"
            style={{ left: '34.5cqw', right: '1.35cqw', top: '72.5cqw' }}
          >
            <p data-para className="text-white" style={{ ...COPY, width: '30.5cqw', opacity: 0 }}>
              {paragraphs[1]}
            </p>
            <div style={{ fontSize: 'clamp(12px, 1.05cqw, 17px)' }}>{cta}</div>
          </div>

          {/* DESIGN & / BUILD — right-aligned under the K, in front of the front
              plate (the board has them clear of the tree). Each line has its
              own mask, padded a touch above so the & keeps its ascender, and
              slides in from the left like the letters. */}
          {[
            { text: 'DESIGN &', top: '49.0cqw' },
            { text: 'BUILD', top: '55.6cqw' },
          ].map(({ text, top }) => (
            <span
              key={text}
              className="absolute block select-none overflow-hidden whitespace-nowrap"
              style={{
                right: '0.84cqw',
                top: `calc(${top} - 0.4cqw)`,
                padding: '0.4cqw 0 0.2cqw',
                fontSize: '6.4cqw',
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}
            >
              <span
                data-sub-line
                className="block will-change-transform"
                style={{ visibility: 'hidden' }}
              >
                {text}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Accessible name for the composition. */}
      <h1 className="sr-only">TDK Design &amp; Build</h1>

      {/* ── Mobile layer — viewport coordinates, below lg only ────────────── */}
      <div className="pointer-events-none absolute inset-0 z-10 lg:hidden">
        <div
          className="absolute left-5 right-5 top-[13svh] text-white"
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
          data-para
          className="absolute bottom-[12svh] left-5 right-5 text-[15px] leading-[1.4] text-white"
          style={{ opacity: 0 }}
        >
          {paragraphs[0]}
        </p>

        <div className="absolute bottom-[4svh] right-5 text-[13px]">{cta}</div>
      </div>
    </section>
  );
}

/* ── Social glyphs — white marks, sized by their parent ──────────────────── */

function SocialGlyph({ platform }: { platform: string }) {
  const key = platform.toLowerCase();

  if (key.includes('instagram')) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-full w-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (key.includes('facebook')) {
    return (
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
        <path d="M13.5 21v-7.3h2.5l.4-3h-2.9V8.9c0-.9.3-1.5 1.5-1.5h1.5V4.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8.1v3h2.5V21h2.9z" />
      </svg>
    );
  }
  if (key.includes('linkedin')) {
    return (
      <svg viewBox="0 0 24 24" className="h-[92%] w-[92%]" fill="currentColor">
        <path d="M6.9 8.7H3.6V20h3.3V8.7zM5.3 3.5a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM20.4 13.1c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.7H10V20h3.3v-5.6c0-1.5.3-2.9 2.1-2.9 1.8 0 1.8 1.7 1.8 3V20h3.3v-6.9z" />
      </svg>
    );
  }
  return <span className="text-[11px] font-[600] uppercase">{platform.slice(0, 2)}</span>;
}
