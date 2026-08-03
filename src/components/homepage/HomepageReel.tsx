'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { backdropImage, cloudinaryUrl } from '@/lib/cloudinary/transforms';
import ProjectModal from '@/components/project-modal/ProjectModal';
import type { Project } from '@/lib/sanity/types';
import ProjectMiniMap from './ProjectMiniMap';

/* ───────────────────────────────────────────────────────────────────────────
   HomepageReel — the Projects reel.

   DESKTOP (lg+) — one pinned stage holding two things:

     · A title card. `PROJECTS` set at the bottom-left, tracked out to exactly
       80% of the viewport. It is not a slide the reel covers up — the first
       project's leading edge acts as a blade and BULLDOZES it: the S is pushed
       into the T, then S and T into the C, and so on, until all eight glyphs
       are stacked right-aligned against the blade and shoved off the left
       edge. Each glyph converts from solid to outline as it is pushed, so the
       pile reads as overlapping drawings rather than as mud.

     · One viewport per project, laid out on an 8 × 8 grid — the same A1–H8
       addressing used in the brief, with row 1 at the top:

           A1──C2 heading      D1──E3 description   F1────H4
           A3──C3 button                            secondary
           A4────────D8 main image        (E)       (row 5)
                                                    F6────H8
                                                    site plan

       Columns E below row 3 and the F–H row 5 band are held open. They are the
       composition, not gaps waiting to be filled.

       Projects arrive right-to-left over their predecessor, which keeps
       drifting left at a third of the speed — the parallax that made the old
       three-viewport reel work, kept.

   Arriving, the sheet masks the heading up, brings the description and CTA in
   under it, draws the CTA ring, inks the street plan and drops the marker last.
   Leaving, the typeset material shears: four elements pull up at four different
   rates behind a rising veil.

   The two photographic plates are excluded from all of it — no entrance, no
   exit, no drift. They are simply on the sheet when the sheet arrives, and the
   rest of the composition assembles around them.

   MOBILE/TABLET (<lg) — no pin at all: a plain vertical stack, below.

   Layering discipline (this is the trap that cost an hour on the hero): GSAP
   writes the whole `transform` string from a per-element cache, so no node
   here carries more than one animated transform. Anything with both an
   entrance and an exit gets two nested nodes — outer for the scrubbed exit,
   inner for the entrance. And every percentage start offset is established by
   `gsap.set()` / `fromTo()`, never by a CSS class.
   ─────────────────────────────────────────────────────────────────────────── */

interface HomepageReelProps {
  projects: Project[];
}

// ── Pacing — tune live in `pnpm dev` ───────────────────────────────────────
/** Scroll length of one project beat, as a % of viewport height. */
const PROJECT_BEAT_VH = 240;
/** Dwell on the title card before the blade touches the S. */
const LEAD = 0.3;
/** Share of a beat spent sliding in. The remainder is the hold. */
const ENTER = 0.45;
/** Trailing beats after the last project, so the pin does not just cut. */
const TAIL = 0.25;
const SCRUB = 1.4;

/** How far a leaving beat drifts, as a share of viewport width. */
const EXIT_DRIFT = 0.35;

// ── Sheet geometry ─────────────────────────────────────────────────────────
/** Clears the fixed 80px navbar at every desktop height. */
const PAD_T = 'max(88px, 9vh)';
const PAD_X = '3.2vw';
const PAD_B = 'max(28px, 4vh)';
const GAP_X = '0.9vw';
const GAP_Y = '1.3vh';

/** The word, and the share of the viewport it is tracked out to fill. */
const WORD = 'PROJECTS';
const WORD_WIDTH = 0.8;

const statusLabel = (s: Project['status']) =>
  s === 'completed' ? 'COMPLETED' : s === 'in-progress' ? 'IN DEVELOPMENT' : 'UPCOMING';
const statusColor = (s: Project['status']) =>
  s === 'completed' ? 'var(--color-threshold)' : 'var(--color-stone)';

/** A1–H8 → CSS grid placement. `col` and `row` are 1-based, row 1 at the top. */
const cell = (col: number, colSpan: number, row: number, rowSpan: number): CSSProperties => ({
  gridColumn: `${col} / span ${colSpan}`,
  gridRow: `${row} / span ${rowSpan}`,
});

export default function HomepageReel({ projects }: HomepageReelProps) {
  const count = projects.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);

  // The brochure. `View project` opens it in place rather than navigating —
  // the reel is pinned, and leaving for a route would throw away the scroll
  // position the visitor spent six viewports earning. The detail route still
  // exists behind the CTA's `href` for crawlers and modified clicks.
  const [openProject, setOpenProject] = useState<Project | null>(null);

  // ── Title card entrance ───────────────────────────────────────────────────
  // Not scrubbed. It fires as the stage reaches the top of the viewport, which
  // is the first moment the word — which sits at the bottom of the stage — is
  // actually on screen. The push that follows is scrubbed and lives on a
  // different node, so the two can safely overlap.
  useLayoutEffect(() => {
    gsapInit();
    const stage = stageRef.current;
    if (!stage || !count) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const ctx = gsap.context(() => {
        const inners = gsap.utils.toArray<HTMLElement>('[data-letter-in]');

        // Percentage offsets have to be established here — a CSS
        // `translateY(130%)` computes to a pixel matrix that GSAP reads back as
        // `y: Npx / yPercent: 0`, and the tween meant to undo it silently
        // no-ops. The glyphs are `visibility: hidden` in markup until this runs.
        gsap.set(inners, { yPercent: 130, y: 0, visibility: 'visible' });

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: stage, start: 'top 15%', once: true },
        });

        tl.to(inners, { yPercent: 0, y: 0, duration: 1.05, stagger: 0.055 }, 0).to(
          '[data-title-rule]',
          { scaleX: 1, duration: 0.9, ease: 'power2.inOut' },
          0.15,
        );
      }, stage);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [count]);

  // ── Master timeline ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    gsapInit();
    const stage = stageRef.current;
    if (!stage || !count) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    // Reduced motion — no pin, no reel. The vertical stack below becomes the
    // only rendering of Projects at every breakpoint.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const W = () => stage.clientWidth;
      const TOTAL = LEAD + count + TAIL;

      /* ── The bulldozer ────────────────────────────────────────────────────
         Everything below is geometry, not easing. `E` is the x of the first
         project's leading edge in stage coordinates. A glyph whose natural
         right edge sits beyond `E` is displaced by exactly the overlap, which
         parks every displaced glyph's right edge on `E` — so they stack
         perfectly against the blade, in the order they were hit. */
      const letters = gsap.utils.toArray<HTMLElement>('[data-letter]', titleRef.current);
      const setX = letters.map((l) => gsap.quickSetter(l, 'x', 'px'));
      const setSolid = letters.map((l) => {
        const el = l.querySelector<HTMLElement>('[data-letter-solid]');
        return el ? gsap.quickSetter(el, 'opacity') : null;
      });
      const setGhost = letters.map((l) => {
        const el = l.querySelector<HTMLElement>('[data-letter-ghost]');
        return el ? gsap.quickSetter(el, 'opacity') : null;
      });

      const rule = titleRef.current?.querySelector<HTMLElement>('[data-title-rule]') ?? null;
      const setRule = rule ? gsap.quickSetter(rule, 'scaleX') : null;

      let rights: number[] = [];
      let widths: number[] = [];
      let titleLeft = 0;
      let titleWidth = 1;
      // The panel's own background is `void`, same as the stage, so its true
      // left edge is invisible — the first thing the eye sees arriving is the
      // sheet's frame line, one padding in. That line is what the glyphs have
      // to pile against, or they stop short of the only edge that is drawn.
      let bladeInset = 0;

      /** Track the word out to exactly 80% of the stage, then re-measure. */
      const layout = () => {
        const title = titleRef.current;
        const word = wordRef.current;
        if (!title || !word) return;

        gsap.set(letters, { x: 0 });

        const vw = W();
        const padPx = 0.032 * vw;
        bladeInset = padPx;
        const target = WORD_WIDTH * vw - padPx;
        title.style.width = `${target}px`;

        // Tracking, not scaling: the gap between glyphs absorbs the difference
        // so the letterforms themselves are never distorted.
        word.style.gap = '0px';
        const natural = letters.reduce((sum, l) => sum + l.getBoundingClientRect().width, 0);
        const gap = letters.length > 1 ? Math.max(0, (target - natural) / (letters.length - 1)) : 0;
        word.style.gap = `${gap}px`;

        const stageLeft = stage.getBoundingClientRect().left;
        widths = letters.map((l) => l.getBoundingClientRect().width);
        rights = letters.map((l) => l.getBoundingClientRect().right - stageLeft);
        titleLeft = title.getBoundingClientRect().left - stageLeft;
        titleWidth = Math.max(1, title.getBoundingClientRect().width);
      };

      const paint = (E: number) => {
        if (rights.length !== letters.length) return;

        for (let i = 0; i < letters.length; i++) {
          const push = Math.min(0, E - rights[i]);
          setX[i](push);
          // Fully converted to outline by the time a glyph has travelled its
          // own width — i.e. exactly as it disappears under its neighbour.
          const t = widths[i] > 0 ? Math.min(1, -push / widths[i]) : 0;
          setSolid[i]?.(1 - t);
          setGhost[i]?.(t);
        }

        // The rule is erased by the same edge rather than fading on its own —
        // but only once the blade has actually reached it. Until then its state
        // belongs to the title card's entrance timeline, and writing to it here
        // (a refresh can fire before that plays) would stamp it into its
        // finished state and kill the draw-in.
        if (E >= titleLeft + titleWidth + 64) return;
        setRule?.(gsap.utils.clamp(0, 1, (E - titleLeft) / titleWidth));
      };

      layout();

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${TOTAL * PROJECT_BEAT_VH}%`,
          scrub: SCRUB,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Null-safe timeline helpers. Sanity fields are optional, so half of
      // these targets can legitimately not exist on a given project.
      const F = (el: Element | null, a: gsap.TweenVars, b: gsap.TweenVars, at: number) => {
        if (el) tl.fromTo(el, a, b, at);
      };
      const FA = (els: Element[], a: gsap.TweenVars, b: gsap.TweenVars, at: number) => {
        if (els.length) tl.fromTo(els, a, b, at);
      };
      const T = (el: Element | null, vars: gsap.TweenVars, at: number) => {
        if (el) tl.to(el, vars, at);
      };

      // Progress rule along the stage's bottom edge.
      F(progressRef.current, { scaleX: 0 }, { scaleX: 1, duration: TOTAL }, 0);

      // The blade. Shares its window and its (linear) ease with beat 0's own
      // slide, so `E` and the panel's left edge are the same number by
      // construction rather than by tuning.
      const edge = { v: 1 };
      tl.to(
        edge,
        { v: 0, duration: ENTER, onUpdate: () => paint(edge.v * W() + bladeInset) },
        LEAD,
      );

      projects.forEach((_, i) => {
        const beat = beatRefs.current[i];
        if (!beat) return;

        const S = LEAD + i;
        const q = (sel: string) => beat.querySelector(sel);
        const qa = (sel: string) => Array.from(beat.querySelectorAll(sel));

        // ── The panel itself ────────────────────────────────────────────────
        tl.fromTo(beat, { x: () => W() }, { x: 0, duration: ENTER }, S);

        // ── Composing on arrival ────────────────────────────────────────────
        // Every resting state in the markup is the FINISHED state, and it is
        // these `fromTo`s that stamp the hidden start — so mobile, reduced
        // motion and no-JS all render a complete sheet instead of a blank one.

        // The sheet draws its own structure first, then fills it.
        const draw = { duration: 0.3, stagger: 0.018, ease: 'power2.out' };
        FA(qa('[data-rule-v]'), { scaleY: 0 }, { scaleY: 1, ...draw }, S + 0.04);
        FA(qa('[data-rule-h]'), { scaleX: 0 }, { scaleX: 1, ...draw }, S + 0.06);

        // Photography has no entrance of its own. The plates are simply on the
        // sheet when the sheet arrives — no wipe, no over-scale, no drift. The
        // panel's own slide is the only motion they get, and the composition
        // now assembles around two fixed points rather than everything moving
        // at once.

        // `y: 0` is not decoration. `invalidateOnRefresh` makes GSAP re-parse
        // the computed transform, and a matrix cannot carry a percentage — a
        // live `translateY(120%)` comes back as `y: 52px / yPercent: 0`, so the
        // tween to `yPercent: 0` lands on an element still sitting 52px down.
        // Pinning both halves of the pair means the re-parsed px offset is
        // always overwritten. Same for the parallax's `x` below.
        F(
          q('[data-head-in]'),
          { yPercent: 120, y: 0 },
          { yPercent: 0, y: 0, duration: 0.26, ease: 'power3.out' },
          S + 0.2,
        );
        F(
          q('[data-desc-in]'),
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.24, ease: 'power2.out' },
          S + 0.28,
        );
        F(
          q('[data-cta-in]'),
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' },
          S + 0.32,
        );
        F(
          q('[data-cta-ring]'),
          { strokeDashoffset: 170 },
          { strokeDashoffset: 0, duration: 0.28, ease: 'power2.inOut' },
          S + 0.32,
        );

        // The street plan inks itself in, then the marker lands on it last —
        // the one beat of the arrival that finishes after the panel has stopped.
        FA(
          qa('[data-map-road]'),
          { attr: { 'stroke-dashoffset': 1 } },
          { attr: { 'stroke-dashoffset': 0 }, duration: 0.3, stagger: 0.006, ease: 'power1.out' },
          S + 0.22,
        );
        F(
          q('[data-map-pin]'),
          { autoAlpha: 0, y: -24 },
          { autoAlpha: 1, y: 0, duration: 0.22, ease: 'back.out(2.2)' },
          S + 0.44,
        );
        F(q('[data-map-chrome]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, S + 0.5);

        // Guides run back out of the marker. `fromTo` off the marker's own
        // coordinate, so the resting markup can carry the full extent.
        const guide = { duration: 0.26, ease: 'power2.out' };
        const gx = q('[data-map-guide-x]') as SVGLineElement | null;
        const gy = q('[data-map-guide-y]') as SVGLineElement | null;
        if (gx) {
          const to = Number(gx.dataset.gx2);
          F(gx, { attr: { x2: gx.x1.baseVal.value } }, { attr: { x2: to }, ...guide }, S + 0.48);
        }
        if (gy) {
          const to = Number(gy.dataset.gy2);
          F(gy, { attr: { y2: gy.y1.baseVal.value } }, { attr: { y2: to }, ...guide }, S + 0.48);
        }

        // ── Decomposing on departure ────────────────────────────────────────
        // Six rates, so the sheet shears apart instead of sliding as a slab.
        // The last project has no successor to cover it, so it gets the tail
        // instead: it lifts and dims in place while the pin unwinds.
        const isLast = i === count - 1;
        const at = S + 1;
        const dur = isLast ? TAIL : ENTER;

        if (!isLast) {
          tl.to(beat, { x: () => -EXIT_DRIFT * W(), duration: dur }, at);
        } else {
          T(q('[data-sheet]'), { y: -70, duration: dur, ease: 'power2.in' }, at);
        }

        T(
          q('[data-veil]'),
          { opacity: isLast ? 0.55 : 0.72, duration: dur, ease: 'power2.in' },
          at,
        );
        // Photography is deliberately excluded from the shear. The plates hold
        // their place on the sheet and leave with the panel; only the drawn and
        // typeset material pulls apart over them.
        T(q('[data-head-exit]'), { y: -72, duration: dur }, at);
        T(q('[data-cta-exit]'), { y: -60, duration: dur }, at);
        T(q('[data-desc-exit]'), { y: -50, duration: dur }, at);
        T(q('[data-map-exit]'), { y: -32, duration: dur }, at);
      });

      // Re-track the word and re-measure the glyph edges whenever ScrollTrigger
      // recalculates — that covers resize, font swap and pin recalculation.
      const onRefresh = () => {
        layout();
        paint(edge.v * W() + bladeInset);
      };
      ScrollTrigger.addEventListener('refresh', onRefresh);

      // The tracking maths is measured off rendered glyphs, so it is wrong
      // until the real face has swapped in. One refresh once it has.
      let stale = true;
      document.fonts?.ready.then(() => {
        if (stale) ScrollTrigger.refresh();
      });

      return () => {
        stale = false;
        ScrollTrigger.removeEventListener('refresh', onRefresh);
      };
    });

    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // ── Mobile vertical reveals + parallax ────────────────────────────────────
  useLayoutEffect(() => {
    if (!count) return;
    gsapInit();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const mm = gsap.matchMedia();
    mm.add('(max-width: 1023px)', () => {
      const scope = verticalRef.current;
      if (!scope) return;
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 32,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-vparallax]').forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: {
                trigger: el.parentElement,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        });
      }, scope);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [count]);

  const projectHref = (p: Project) => `/en/projects/${p.slug.current}`;
  // Sized to the A1–C2 cell — three of eight columns wide, and now two rows
  // tall, which is the headroom that lets these run this large. Width is the
  // real constraint: long names step down rather than wrap, because the heading
  // is masked as one line and a wrapped second line reveals as a block.
  const titleSize = (title: string) =>
    title.length > 16
      ? 'clamp(28px, 3.1vw, 54px)'
      : title.length > 11
        ? 'clamp(34px, 4.2vw, 74px)'
        : 'clamp(38px, 5vw, 92px)';

  if (!count) return null;

  return (
    <>
      {/* ════════════════════ PINNED STAGE — desktop only ═══════════════════ */}
      <section className={reduced ? 'hidden' : 'relative z-10 hidden w-full lg:block'}>
        <div ref={stageRef} className="relative h-screen w-full overflow-hidden bg-void">
          {/* ── Title card ────────────────────────────────────────────────────
              Sits under every beat. It is never covered, because the blade
              pushes it out of the way first. */}
          {!reduced && (
            <div
              ref={titleRef}
              className="absolute z-20"
              style={{ left: PAD_X, bottom: PAD_B, width: `calc(${WORD_WIDTH * 100}% - ${PAD_X})` }}
            >
              {/* The rule is the whole of the chrome. It draws in above the
                  word, and is erased by the same edge that pushes the glyphs. */}
              <span
                data-title-rule
                className="mb-[1.6vh] block h-px w-full origin-left bg-white/20"
                style={{ transform: 'scaleX(0)' }}
              />

              <h2
                ref={wordRef}
                aria-label={WORD}
                className="flex items-end"
                style={{ fontSize: 'min(15vw, 26vh)' }}
              >
                {WORD.split('').map((ch, i) => (
                  <span
                    key={i}
                    data-letter
                    aria-hidden="true"
                    className="relative block overflow-hidden will-change-transform"
                    style={{ paddingBottom: '0.18em', paddingTop: '0.04em' }}
                  >
                    <span
                      data-letter-in
                      className="relative block font-sans font-[200] leading-[0.86] will-change-transform"
                      style={{ visibility: 'hidden' }}
                    >
                      <span data-letter-solid className="block text-paper">
                        {ch}
                      </span>
                      {/* Outline twin. Crossfaded in as the glyph is displaced,
                          so eight stacked letters read as overlapping drawings
                          rather than as one solid blob. */}
                      <span
                        data-letter-ghost
                        className="absolute inset-0 block"
                        style={{
                          color: 'transparent',
                          WebkitTextStroke: '1.5px rgba(245,240,232,0.5)',
                          opacity: 0,
                        }}
                      >
                        {ch}
                      </span>
                    </span>
                  </span>
                ))}
              </h2>
            </div>
          )}

          {/* ── Project sheets ──────────────────────────────────────────────── */}
          {!reduced &&
            projects.map((p, i) => {
              const main = p.heroImageId;
              const secondary = p.homepagePortraitImageId ?? p.homepageGridImageId;

              return (
                <div
                  key={p._id}
                  ref={(el) => {
                    beatRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 h-screen w-full bg-void will-change-transform"
                  style={{ zIndex: 40 + i }}
                >
                  {/* ── Atmospheric wash ────────────────────────────────────
                      The main image again, full bleed and barely there, so the
                      sheet sits in its own project rather than on a flat black.
                      It is cropped and scaled far past the plate below it, so
                      the two never read as the same photograph twice.

                      The scrim is doing the real work. Its clear point is put on
                      the open column E — the one part of the sheet with nothing
                      in it, and so the one part that can carry the wash — and
                      closes to near-solid everywhere type has to be read: the
                      heading, the description band, and the site plan, whose
                      hairline streets need a flat ground to sit on. */}
                  {main && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                    >
                      <img
                        src={backdropImage(main)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full scale-105 object-cover"
                        style={{ opacity: 0.2 }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: [
                            'linear-gradient(to bottom, rgba(13,13,13,0.6) 0%, rgba(13,13,13,0) 34%)',
                            'radial-gradient(46% 52% at 56% 64%, rgba(13,13,13,0.06) 0%, rgba(13,13,13,0.55) 58%, rgba(13,13,13,0.95) 100%)',
                          ].join(', '),
                        }}
                      />
                    </div>
                  )}

                  <div
                    data-sheet
                    className="absolute inset-0 will-change-transform"
                    style={{
                      paddingTop: PAD_T,
                      paddingBottom: PAD_B,
                      paddingLeft: PAD_X,
                      paddingRight: PAD_X,
                    }}
                  >
                    <div
                      className="relative h-full w-full border border-white/[0.06]"
                      style={{ '--gx': GAP_X, '--gy': GAP_Y } as CSSProperties}
                    >
                      <div
                        className="relative z-10 h-full w-full"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                          gridTemplateRows: 'repeat(8, minmax(0, 1fr))',
                          columnGap: 'var(--gx)',
                          rowGap: 'var(--gy)',
                        }}
                      >
                        {/* ── A1 → C2 · heading ─────────────────────────────── */}
                        <div
                          data-head-exit
                          style={cell(1, 3, 1, 2)}
                          className="flex items-end will-change-transform"
                        >
                          <h3
                            className="block w-full overflow-hidden pb-[0.1em] pr-[1vw]"
                            style={{ fontSize: titleSize(p.title) }}
                          >
                            <span
                              data-head-in
                              className="block whitespace-nowrap font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper will-change-transform"
                            >
                              {p.title}
                            </span>
                          </h3>
                        </div>

                        {/* ── A3 → C3 · button ──────────────────────────────── */}
                        <div
                          data-cta-exit
                          style={cell(1, 3, 3, 1)}
                          className="flex items-start pt-[0.8vh] will-change-transform"
                        >
                          <div data-cta-in className="opacity-0">
                            <ReelCta
                              href={projectHref(p)}
                              label="View project"
                              onActivate={() => setOpenProject(p)}
                            />
                          </div>
                        </div>

                        {/* ── D1 → E3 · description ─────────────────────────── */}
                        <div
                          data-desc-exit
                          style={cell(4, 2, 1, 3)}
                          className="flex items-end will-change-transform"
                        >
                          <p
                            data-desc-in
                            className="pb-[0.6vh] pr-[1vw] text-body text-stone opacity-0"
                          >
                            {p.homepageIntro}
                          </p>
                        </div>

                        {/* ── A4 → D8 · main image ──────────────────────────── */}
                        {/* Both plates are static: no wrapper carries a
                            transform or a clip, because nothing animates them.
                            Column E is left open beside this one on purpose. */}
                        <div style={cell(1, 4, 4, 5)} className="relative overflow-hidden">
                          {main && (
                            <>
                              <img
                                src={cloudinaryUrl(main, { width: 1600 })}
                                alt={p.title}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                              <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                  background:
                                    'linear-gradient(to top, rgba(13,13,13,0.45), rgba(13,13,13,0) 45%)',
                                }}
                              />
                            </>
                          )}
                        </div>

                        {/* ── F1 → H4 · secondary image ─────────────────────── */}
                        <div style={cell(6, 3, 1, 4)} className="relative overflow-hidden">
                          {secondary && (
                            <img
                              src={cloudinaryUrl(secondary, { width: 1100 })}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>

                        {/* ── F6 → H8 · site plan ───────────────────────────── */}
                        <div
                          data-map-exit
                          style={cell(6, 3, 6, 3)}
                          className="relative will-change-transform"
                        >
                          <ProjectMiniMap seed={p.slug.current} label={p.location} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Departure veil — the sheet recedes into the dark rather
                      than simply being covered. */}
                  <div
                    data-veil
                    className="pointer-events-none absolute inset-0 z-50 bg-void"
                    style={{ opacity: 0 }}
                  />
                </div>
              );
            })}

          {/* Progress rule — the one piece of chrome above every sheet. */}
          {!reduced && (
            <span
              ref={progressRef}
              aria-hidden="true"
              className="absolute bottom-0 left-0 z-[100] block h-px w-full origin-left bg-threshold"
              style={{ transform: 'scaleX(0)', opacity: 0.7 }}
            />
          )}
        </div>
      </section>

      {/* ════════════ MOBILE + TABLET — vertical Projects stack ═════════════ */}
      <div
        ref={verticalRef}
        className={
          reduced ? 'relative z-[60] block bg-void' : 'relative z-[60] block bg-void lg:hidden'
        }
      >
        <div className="px-6 pb-12 pt-24 sm:px-8">
          <p className="text-label tracking-[0.3em] text-stone">02 — SELECTED WORK</p>
          <h2
            className="mt-6 font-sans font-[200] uppercase leading-[0.85] text-paper"
            style={{ fontSize: 'clamp(52px, 17vw, 140px)' }}
          >
            {WORD}
          </h2>
          <span className="mt-6 block h-px w-full bg-white/15" />
        </div>

        {projects.map((p, i) => {
          const main = p.heroImageId;
          const secondary = p.homepagePortraitImageId ?? p.homepageGridImageId;

          return (
            <section key={p._id} className="bg-void px-6 py-16 sm:px-8 md:py-24">
              <div data-reveal className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-mono text-stone">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="block h-px w-8 bg-white/20" />
                  <span
                    className="text-label tracking-[0.3em]"
                    style={{ color: statusColor(p.status) }}
                  >
                    {statusLabel(p.status)}
                  </span>
                </div>
                <span className="font-mono text-mono text-stone">{p.year}</span>
              </div>

              <h3
                data-reveal
                className="mt-6 font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
                style={{ fontSize: 'clamp(38px, 10vw, 72px)' }}
              >
                {p.title}
              </h3>

              {p.homepageIntro && (
                <p data-reveal className="mt-5 max-w-[48ch] text-body text-stone">
                  {p.homepageIntro}
                </p>
              )}

              {main && (
                <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden">
                  <img
                    data-vparallax
                    src={cloudinaryUrl(main, { width: 1400 })}
                    alt={p.title}
                    loading="lazy"
                    className="absolute left-0 top-[-15%] h-[130%] w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {secondary && (
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      data-vparallax
                      src={cloudinaryUrl(secondary, { width: 900 })}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute left-0 top-[-15%] h-[130%] w-full object-cover"
                    />
                  </div>
                )}
                <div
                  data-reveal
                  className="relative aspect-[4/3] w-full border border-white/[0.06]"
                >
                  <ProjectMiniMap seed={p.slug.current} label={p.location} />
                </div>
              </div>

              <div data-reveal className="mt-10">
                <ReelCta
                  href={projectHref(p)}
                  label="View project"
                  onActivate={() => setOpenProject(p)}
                />
              </div>
            </section>
          );
        })}
      </div>

      {/* The brochure. Portalled to <body>, so the reel's pin and the navbar
          are both underneath it and neither has to know it exists. */}
      <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
    </>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────────
   The hero's button, kept verbatim in behaviour: the ring draws on entrance,
   the fill scales out of the centre on hover and the arrow is swapped by a
   second arrow entering from the left, both difference-blended so they invert
   as the fill passes under them.

   Its resting transforms are set by GSAP on mount rather than by classes — a
   Tailwind `translate-x-[140%]` resolves to a pixel matrix, which GSAP reads
   back as `x`, and the `xPercent` hover tween could then never undo it.
   ───────────────────────────────────────────────────────────────────────── */

function ReelCta({
  href,
  label,
  onActivate,
}: {
  href: string;
  label: string;
  /** Runs instead of the navigation on a plain left click. */
  onActivate?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    const cta = ref.current;
    if (!cta) return;
    gsapInit();
    const ctx = gsap.context(() => {
      gsap.set(cta.querySelector('[data-arrow-in]'), { xPercent: 140, autoAlpha: 0 });
      gsap.set(cta.querySelector('[data-fill]'), { scale: 0 });
    }, cta);
    return () => ctx.revert();
  }, []);

  const hover = (entering: boolean) => {
    const cta = ref.current;
    if (!cta) return;

    gsap.to(cta.querySelector('[data-fill]'), {
      scale: entering ? 1 : 0,
      duration: entering ? 0.45 : 0.4,
      ease: entering ? 'power3.out' : 'power3.inOut',
    });
    gsap.to(cta.querySelector('[data-arrow-out]'), {
      xPercent: entering ? 140 : 0,
      autoAlpha: entering ? 0 : 1,
      duration: entering ? 0.35 : 0.4,
      delay: entering ? 0 : 0.05,
      ease: entering ? 'power2.in' : 'power2.out',
    });
    gsap.to(cta.querySelector('[data-arrow-in]'), {
      xPercent: entering ? 0 : 140,
      autoAlpha: entering ? 1 : 0,
      duration: entering ? 0.4 : 0.3,
      delay: entering ? 0.08 : 0,
      ease: entering ? 'power2.out' : 'power2.in',
    });
  };

  return (
    <Link
      ref={ref}
      href={href}
      data-cursor="view"
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onClick={(e) => {
        // Let the browser have modified clicks — cmd/ctrl/shift and middle
        // click still open the real detail route in a tab.
        if (!onActivate || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        onActivate();
      }}
      className="pointer-events-auto inline-flex items-center gap-4"
    >
      <span className="relative grid h-14 w-14 shrink-0 place-items-center">
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            data-cta-ring
            cx="28"
            cy="28"
            r="27"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="170"
            strokeDashoffset="170"
            className="text-paper"
          />
        </svg>
        <span data-fill className="absolute inset-0 rounded-full bg-paper will-change-transform" />
        <span className="relative block h-4 w-4 overflow-hidden mix-blend-difference">
          <span data-arrow-out className="absolute inset-0 block text-paper">
            <Arrow />
          </span>
          <span data-arrow-in className="absolute inset-0 block text-paper">
            <Arrow />
          </span>
        </span>
      </span>
      <span className="whitespace-nowrap text-label text-paper">{label}</span>
    </Link>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className="h-4 w-4"
    >
      <path d="M1 8h13M9 3l5 5-5 5" />
    </svg>
  );
}
