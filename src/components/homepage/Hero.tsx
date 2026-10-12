'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, MouseEvent } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { maskChars, riseIn, whenFontsReady } from '@/lib/animations/text';
import { getLenis } from '@/lib/animations/lenis';
import SocialGlyph from '@/components/ui/SocialGlyph';
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
     · both image plates wipe in together as vertical tiles, left to right;
     · T, D, K each slide one slot to the right into their own mask;
     · the social rings draw, then their marks appear.
   ON REACHING THE VIEWPORT, once each (armed as TDK starts):
     · DESIGN & / BUILD, paragraphs and CTA letters rise through their masks;
     · the CTA's brackets grow from their corners alongside the label.
   Nothing is scrubbed by scroll.

   Layering discipline (see gsap-transform-pitfalls): every animated
   transform property has its own node, and percentage offsets are set by
   gsap.set(), never by class.
   ─────────────────────────────────────────────────────────────────────────── */

const PLATE_W = 1512;
const PLATE_H = 1300;
const BACK_SRC = '/hero/hero-back.webp';
const FRONT_SRC = '/hero/hero-front.webp';

/** Both plates use the same fourteen tile boundaries and timing. */
const STRIPES = 14;
const TILE_DURATION = 0.55;
const TILE_STAGGER = 0.06;
const TILES_DONE = TILE_DURATION + TILE_STAGGER * (STRIPES - 1);

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
  const frontWrapRef = useRef<HTMLDivElement>(null); // the whole foreground plate
  const frontStripesRef = useRef<HTMLDivElement>(null);
  const stripesRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null); // the whole back plate, after the wipe

  // ── Entrance ──────────────────────────────────────────────────────────────
  // Both picture plates finish together. TDK follows; visible copy and
  // socials overlap that entrance instead of waiting for another image wipe.
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
    const cancelFonts = whenFontsReady(() => {
      if (cancelled) return;
      ctx.add(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const glyphs = gsap.utils.toArray<HTMLElement>('[data-glyph]');
        const mobileLines = gsap.utils.toArray<HTMLElement>('[data-mobile-line]');
        const subLines = gsap.utils.toArray<HTMLElement>('[data-sub-line]');
        const rings = gsap.utils.toArray<SVGCircleElement>('[data-ring]');
        const marks = gsap.utils.toArray<HTMLElement>('[data-mark]');
        const paras = gsap.utils.toArray<HTMLElement>('[data-para]');
        const ctas = gsap.utils.toArray<HTMLElement>('[data-cta]');

        // Start states. Percentages MUST be established here, not in CSS — a
        // class-based translate computes to a pixel matrix that GSAP reads
        // back as `y`, and the percent tween that undoes it silently no-ops.
        // Each glyph sits one slot to the left, hidden by its own mask.
        gsap.set([...glyphs, ...mobileLines], {
          xPercent: -100,
          x: 0,
          visibility: 'visible',
        });
        gsap.set(rings, { strokeDashoffset: 1 });
        gsap.set(marks, { autoAlpha: 0 });
        ctas.forEach((cta) => {
          gsap.set(cta.querySelectorAll('[data-bracket]'), { scale: 0 });
        });

        if (reduced) {
          gsap.set([backRef.current, frontWrapRef.current], { autoAlpha: 1 });
          gsap.set([stripesRef.current, frontStripesRef.current], { display: 'none' });
          gsap.set([...glyphs, ...mobileLines, ...subLines], { xPercent: 0 });
          gsap.set(subLines, { autoAlpha: 1 });
          gsap.set(rings, { strokeDashoffset: 0 });
          gsap.set(marks, { autoAlpha: 1 });
          gsap.set(paras, { autoAlpha: 1 });
          ctas.forEach((cta) => {
            gsap.set(cta.querySelectorAll('[data-bracket]'), { scale: 1 });
          });
          return;
        }

        const subText = maskChars(subLines);
        splits.push(subText.split);
        gsap.set(subLines, { visibility: 'visible' });
        const textSets = paras.map((p) => {
          const { split, chars } = maskChars(p);
          splits.push(split);
          return { p, split, chars };
        });
        const ctaSets = ctas.map((cta) => {
          const { split, chars } = maskChars(cta.querySelector('[data-cta-label]'));
          splits.push(split);
          gsap.set(cta.querySelector('[data-cta-label]'), { visibility: 'visible' });
          return { cta, split, chars };
        });

        // ── On scroll — each block reveals itself when it reaches the
        //    viewport, once. Created as the wordmark starts, inside the
        //    context so they are cleaned up with it.
        const armScrollReveals = () =>
          ctx.add(() => {
            const once = (trigger: Element) => ({
              scrollTrigger: { trigger, start: 'top 88%', once: true },
            });

            if (subLines.length) {
              gsap
                .timeline(once(subLines[0].parentElement as Element))
                .to(subText.chars, riseIn(subText.chars));
            }

            textSets.forEach(({ p, split, chars }) => {
              gsap
                .timeline(once(p))
                .set(p, { autoAlpha: 1 })
                .to(chars, riseIn(chars, { onComplete: () => split.revert() }));
            });

            ctaSets.forEach(({ cta, split, chars }) => {
              gsap
                .timeline({ scrollTrigger: { trigger: cta, start: 'top bottom', once: true } })
                .to(cta.querySelectorAll('[data-bracket]'), {
                  scale: 1,
                  duration: 0.45,
                  ease: 'power3.out',
                  stagger: 0.08,
                })
                .to(chars, riseIn(chars, { onComplete: () => split.revert() }), 0);
            });

            ScrollTrigger.refresh();
          });

        // ── On load ───────────────────────────────────────────────────────
        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
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

        // Paired tiles keep the building and its background in lockstep,
        // while retaining TDK's position between the two plates.
        for (let i = 0; i < STRIPES; i++) {
          tl.fromTo(
            `[data-stripe="${i}"]`,
            { clipPath: `inset(0 ${100 - (i * 100) / STRIPES}% 0 ${(i * 100) / STRIPES}%)` },
            {
              clipPath: `inset(0 ${Math.max(0, 100 - ((i + 1) * 100) / STRIPES - 0.08)}% 0 ${(i * 100) / STRIPES}%)`,
              duration: TILE_DURATION,
              ease: 'power2.inOut',
            },
            i * TILE_STAGGER,
          );
        }
        tl.set([backRef.current, frontWrapRef.current], { autoAlpha: 1 }, TILES_DONE).set(
          [stripesRef.current, frontStripesRef.current],
          { display: 'none' },
          TILES_DONE,
        );
        tl.addLabel('tilesComplete', TILES_DONE);
        tl.call(armScrollReveals, [], TILES_DONE);

        // 2. The drawing — T, then D, then K, each sliding into its slot.
        glyphs.forEach((g, i) => {
          tl.to(g, { xPercent: 0, duration: 0.8, ease: 'power4.out' }, TILES_DONE + i * 0.3);
        });
        tl.to(mobileLines, { xPercent: 0, duration: 0.8, ease: 'power4.out' }, TILES_DONE);

        // Socials accompany the letters.
        tl.to(
          rings,
          { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.12 },
          TILES_DONE + 0.15,
        );
        tl.to(marks, { autoAlpha: 1, duration: 0.4, stagger: 0.12 }, TILES_DONE + 0.4);
      });
    });

    return () => {
      cancelled = true;
      cancelFonts();
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, [phase]);

  // A general projects CTA scrolls to the reel. Project enquiries follow
  // their own link directly to the registration form.
  const onCta = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !ctaHref.endsWith('/projects')) return;
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
      <span data-cta-label data-hero-copy className="block">
        {ctaLabel}
      </span>
    </Link>
  );

  return (
    <section
      data-nav="dark"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: '#0e141c' }}
    >
      {/* ── Frame — plate coordinates ─────────────────────────────────────── */}
      <div className="relative min-h-[100dvh] w-full lg:min-h-0" style={FRAME_STYLE}>
        {/* 1 · back plate, and its temporary tiled entrance. */}
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
              data-stripe={i}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${BACK_SRC})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                clipPath: `inset(0 ${100 - (i * 100) / STRIPES}% 0 ${(i * 100) / STRIPES}%)`,
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

        {/* 3 · the building remains in front of TDK in both entrance and rest. */}
        <div ref={frontWrapRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
          <Image
            src={FRONT_SRC}
            alt="Almond Suites, Strovolos — the current TDK project"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div ref={frontStripesRef} className="absolute inset-0" aria-hidden="true">
          {Array.from({ length: STRIPES }, (_, i) => (
            <div
              key={i}
              data-stripe={i}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${FRONT_SRC})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                clipPath: `inset(0 ${100 - (i * 100) / STRIPES}% 0 ${(i * 100) / STRIPES}%)`,
              }}
            />
          ))}
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
              own padded frame, with a rising mask for each letter. */}
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
              data-sub-line
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
