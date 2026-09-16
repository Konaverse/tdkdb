'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { stripReveal } from '@/lib/animations/stripReveal';
import { imageUrl } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   AboutGrid — the architectural plate

   A ~130vh section, not a viewport. Two bands:

     · A header band whose headline is indented to column 4 of a 12-column
       grid, leaving column 1–3 empty except for a sticky eyebrow that rides
       the full height of the section. That empty column is half the
       composition — it is held open on purpose.

     · A 4 × 2 cell grid below it, occupied in a checkerboard: six of eight
       cells carry something, two stay empty. The empties are the design.

   LIGHT THEME (Sept 2026 board, "about section.png"). White ground, ink
   type, and the checkerboard carried by colour: the three stat cells are
   solid teal with white type, the two photographs stay, and the empty cells
   are paper. The structure is still DRAWN — ink hairlines at every column
   and row boundary — so the empty cells read as deliberately empty and the
   whole thing reads as a plan drawing rather than a row of cards.

   No pin, no scroll-hijack. Entrance once, hover, and a scrubbed exit where
   the columns shear apart at different rates as the section leaves. The old
   dark version also faded the whole section to 30% on exit; on white that
   turns the plate grey over the dark page behind it, so it is gone.

   Note on layering — this is the trap that cost an hour on the hero. GSAP
   writes the whole `transform` string from a per-element cache, so no node
   here carries more than one animated property. Each tile nests:
     exit-y wrapper → clip wrapper → enter-scale wrapper → img (hover scale).
   And every start offset is established by `gsap.set()`, never by a CSS class:
   a Tailwind `translate-y-[110%]` computes to a pixel matrix that GSAP reads
   back as `y: 111px / yPercent: 0`, and the yPercent tween silently no-ops.
   ─────────────────────────────────────────────────────────────────────────── */

const EYEBROW = '01 — ABOUT';

// Three lines, long-long-short. The short last line is what leaves the stepped
// rag and the pocket of space the paragraph then sits under — it is the
// composition, not just a line break. Each line must fit its column without
// wrapping; a wrapped line reveals as one masked block and reads as a mistake.
const HEADLINE = [
  'WE BUILD FEW HOMES AT A TIME',
  'SO EVERY ONE OF THEM IS DETAILED',
  'LIKE THE ONLY ONE',
];

const PARAGRAPH =
  "We're a young practice with an old-fashioned position: the people who draw the building are the people who hand you the keys. That means fewer residences a year across Cyprus, and a standard we can actually stand behind.";

interface Stat {
  /** Numeric target the counter tweens to. */
  value: number;
  /** Rendered immediately after the number — never counted. */
  suffix: string;
  label: string;
}

// Hardcoded rather than derived from Sanity: the project count in the dataset
// is "projects on the site", which is not the same claim as "delivered".
const STATS: Stat[] = [
  { value: 3, suffix: '+', label: 'YEARS OPERATING' },
  { value: 2, suffix: '', label: 'APARTMENT BUILDINGS DELIVERED' },
  { value: 100, suffix: '%', label: 'CLIENT SATISFACTION' },
];

/* Light palette. Inline values rather than Tailwind alpha tokens: `bg-void/90`
   style classes compile to a transparent colour in this project. */
const PAPER = '#ffffff';
const INK = '#111111';
const INK_SOFT = 'rgba(17, 17, 17, 0.62)';
const LINE = 'rgba(17, 17, 17, 0.14)';
/** Stat cells are the board's solid teal; hover deepens it. */
const CELL_BG = '#66979f';
const CELL_BG_HOVER = '#58868d';
const ON_TEAL = '#ffffff';
const ON_TEAL_SOFT = 'rgba(255, 255, 255, 0.78)';

export default function AboutGrid({
  people,
  material,
}: {
  people?: SanityImage;
  material?: SanityImage;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  // Header — one exit node for the whole band; entrance lives on its children.
  const headerExitRef = useRef<HTMLDivElement>(null);
  const eyebrowRuleRef = useRef<HTMLSpanElement>(null);
  const eyebrowLabelRef = useRef<HTMLSpanElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  // Grid — parallel arrays, indexed in entrance order (row 1 L→R, row 2 L→R).
  const cellExitRefs = useRef<(HTMLDivElement | null)[]>([]); // exit — y
  const cellClipRefs = useRef<(HTMLDivElement | null)[]>([]); // entrance — clipPath
  const microRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const linesLayerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ── Entrance ──────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    const reveals: { revert: () => void }[] = [];
    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const headlineLines = lineRefs.current.filter(Boolean) as HTMLSpanElement[];
      const clips = cellClipRefs.current.filter(Boolean) as HTMLDivElement[];
      const micros = microRefs.current.filter(Boolean) as HTMLSpanElement[];
      const enterScales = gsap.utils.toArray<HTMLElement>('[data-enter-scale]');
      const hairlines = gsap.utils.toArray<HTMLElement>('[data-hairline]');
      const ctaFills = gsap.utils.toArray<HTMLElement>('[data-cta-fill]');
      const captions = gsap.utils.toArray<HTMLElement>('[data-caption]');

      // Every percentage-based start offset is established HERE, never by a
      // class or inline style — a CSS `translateY(100%)` computes to a pixel
      // matrix that GSAP reads back as `y: Npx / yPercent: 0`, and the
      // yPercent tween that is supposed to undo it silently does nothing.
      gsap.set(headlineLines, { yPercent: 110, visibility: 'visible' });
      gsap.set(captions, { yPercent: 100 });
      gsap.set(hairlines, { scaleX: 0 });
      gsap.set(ctaFills, { scaleY: 0 });
      gsap.set(enterScales, { scale: 1.12 });
      gsap.set(paragraphRef.current, { y: 16 });

      if (reduced) {
        gsap.set(headlineLines, { yPercent: 0 });
        gsap.set(eyebrowRuleRef.current, { scaleX: 1 });
        gsap.set([eyebrowLabelRef.current, paragraphRef.current, ...micros], {
          autoAlpha: 1,
          y: 0,
        });
        gsap.set(clips, { clipPath: 'inset(0% 0% 0% 0%)' });
        gsap.set(enterScales, { scale: 1 });
        gsap.set(linesLayerRef.current, { autoAlpha: 1 });
        // Numerals already render their final value in markup — nothing to do.
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: section, start: 'top 85%', once: true },
      });

      // Eyebrow — rule draws, then the label arrives on it.
      tl.to(eyebrowRuleRef.current, { scaleX: 1, duration: 0.6, ease: 'power2.out' }, 0).to(
        eyebrowLabelRef.current,
        { autoAlpha: 1, duration: 0.5 },
        0.1,
      );

      // Headline — masked reveal, three lines cascading.
      tl.to(headlineLines, { yPercent: 0, duration: 0.95, stagger: 0.12 }, 0.15);

      tl.to(paragraphRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.7);

      // The grid draws itself before anything lands in it.
      tl.to(linesLayerRef.current, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, 0.75);

      // Cells wipe in — row 1 downward from its top edge, row 2 upward from its
      // bottom edge, so the two rows read as separate structural courses. The
      // stagger runs in DOM order, which is row 1 left→right then row 2, so the
      // eye traces the checkerboard and lands on the CTA cell last.
      clips.forEach((clip, i) => {
        const at = 0.9 + i * 0.09;

        // Photographs take the site's one image entrance (strips wiping off
        // left to right, top to bottom); the other cells keep their wipe.
        const scaleTarget = enterScales.find((el) => clip.contains(el));
        if (scaleTarget) {
          gsap.set(clip, { clipPath: 'inset(0% 0% 0% 0%)' });
          gsap.set(scaleTarget, { clearProps: 'transform' });
          const reveal = stripReveal(clip, { scroll: false, settle: scaleTarget });
          reveals.push(reveal);
          tl.add(reveal.tl, at);
        } else {
          tl.to(clip, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'sine.inOut' }, at);
        }

        // Counter — starts as its own cell is ~40% through its wipe. Driven off
        // the cell, so the timing can never drift out of sync with the stagger.
        const numeral = clip.querySelector<HTMLElement>('[data-numeral-value]');
        if (numeral) {
          const target = Number(numeral.dataset.numeralValue ?? 0);
          const counter = { v: 0 };
          tl.to(
            counter,
            {
              v: target,
              duration: 1.4,
              ease: 'power2.out',
              snap: { v: 1 },
              onUpdate: () => {
                numeral.textContent = String(Math.round(counter.v));
              },
            },
            at + 0.35,
          );
        }

        const micro = microRefs.current[i];
        if (micro) tl.to(micro, { autoAlpha: 1, duration: 0.5 }, at + 0.55);
      });

      ScrollTrigger.refresh();
    }, section);

    return () => {
      ctx.revert();
      reveals.forEach((r) => r.revert());
    };
  }, []);

  // ── Scroll exit ───────────────────────────────────────────────────────────
  // The header rises fast; the grid columns follow at four different rates, so
  // the checkerboard shears apart on the way out instead of sliding as a slab.
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
        if (isReduced || !isDesktop) return;

        // Per-column exit travel, indexed by the cell's grid column (1-4).
        // Kept modest on purpose: the cells shear away from the drawn grid, and
        // past roughly 60px of spread they stop reading as "the plan coming
        // apart" and start reading as cells that missed their gridlines.
        const BY_COLUMN = [-22, -52, -34, -62];

        const tl = gsap.timeline({
          // `immediateRender: false` throughout — otherwise these stamp their
          // start values at creation and overwrite the entrance mid-flight.
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: section,
            start: 'bottom 85%',
            end: 'bottom top',
            scrub: 1.1,
          },
        });

        tl.to(headerExitRef.current, { y: -120 }, 0);

        cellExitRefs.current.forEach((cell) => {
          if (!cell) return;
          const col = Number(cell.dataset.col ?? 1);
          tl.to(cell, { y: BY_COLUMN[col - 1] ?? -40 }, 0);
        });

        // The drawn grid dissolves as the cells pull off it, so the structure
        // never sits still while its contents drift out of alignment with it.
        tl.to(linesLayerRef.current, { autoAlpha: 0 }, 0);
      },
    );

    return () => mm.revert();
  }, []);

  // ── Hover ─────────────────────────────────────────────────────────────────
  // Nothing changes position. This is a grid; cells hold their ground.
  const hoverStat = (el: HTMLElement | null, entering: boolean) => {
    if (!el) return;

    gsap.to(el.querySelector('[data-fill]'), {
      backgroundColor: entering ? CELL_BG_HOVER : CELL_BG,
      duration: entering ? 0.4 : 0.3,
      ease: 'power2.out',
    });
    // A white rule draws across the teal cell's top edge.
    gsap.to(el.querySelector('[data-hairline]'), {
      scaleX: entering ? 1 : 0,
      duration: entering ? 0.5 : 0.3,
      ease: entering ? 'power3.out' : 'power2.inOut',
    });
    // The label brightens to full white as the teal deepens.
    gsap.to(el.querySelector('[data-micro]'), {
      color: entering ? ON_TEAL : ON_TEAL_SOFT,
      duration: 0.35,
      ease: 'power2.out',
    });
  };

  const hoverImage = (el: HTMLElement | null, entering: boolean) => {
    if (!el) return;
    gsap.to(el.querySelector('[data-hover-scale]'), {
      scale: entering ? 1.05 : 1,
      duration: entering ? 0.8 : 0.6,
      ease: 'power3.out',
    });
    gsap.to(el.querySelector('[data-img-dim]'), {
      opacity: entering ? 0 : 0.25,
      duration: 0.5,
      ease: 'power2.out',
    });
    gsap.to(el.querySelector('[data-caption]'), {
      yPercent: entering ? 0 : 100,
      duration: entering ? 0.45 : 0.35,
      ease: entering ? 'power3.out' : 'power2.in',
    });
  };

  const hoverCta = (el: HTMLElement | null, entering: boolean) => {
    if (!el) return;
    gsap.to(el.querySelector('[data-cta-fill]'), {
      scaleY: entering ? 1 : 0,
      duration: entering ? 0.5 : 0.4,
      ease: entering ? 'power3.out' : 'power3.inOut',
    });
    gsap.to(el.querySelectorAll('[data-cta-text]'), {
      color: entering ? PAPER : INK,
      duration: 0.35,
      ease: 'power2.out',
    });
  };

  // Safety net. A `pointerleave` can be missed when the page scrolls under a
  // stationary cursor, which would strand a cell in its hover state — caption
  // up, image undimmed, accent rule drawn. Leaving the grid as a whole resets
  // every cell unconditionally, so a dropped event can never persist.
  const resetCells = () => {
    const grid = gridRef.current;
    if (!grid) return;
    const q = (sel: string) => grid.querySelectorAll(sel);

    gsap.to(q('[data-fill]'), { backgroundColor: CELL_BG, duration: 0.3, ease: 'power2.out' });
    gsap.to(q('[data-hairline]'), { scaleX: 0, duration: 0.3, ease: 'power2.inOut' });
    gsap.to(q('[data-micro]'), { color: ON_TEAL_SOFT, duration: 0.35 });
    gsap.to(q('[data-hover-scale]'), { scale: 1, duration: 0.6, ease: 'power3.out' });
    gsap.to(q('[data-img-dim]'), { opacity: 0.25, duration: 0.5 });
    gsap.to(q('[data-caption]'), { yPercent: 100, duration: 0.35, ease: 'power2.in' });
    gsap.to(q('[data-cta-fill]'), { scaleY: 0, duration: 0.4, ease: 'power3.inOut' });
    gsap.to(q('[data-cta-text]'), { color: INK, duration: 0.35 });
  };

  /** Registers a cell's outer (exit) node together with the column it sits in. */
  const cellRef = (i: number, col: number) => (el: HTMLDivElement | null) => {
    cellExitRefs.current[i] = el;
    if (el) el.dataset.col = String(col);
  };

  return (
    <section
      ref={sectionRef}
      data-nav="light"
      className="relative w-full"
      style={{ background: PAPER, color: INK }}
    >
      {/* ── Sticky eyebrow rail ──────────────────────────────────────────────
          Absolutely positioned to the full section height so the sticky child
          has real travel — it rides the whole 130vh beside the composition. */}
      <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-[25%] pl-14 lg:block">
        <div className="sticky top-32 flex items-center gap-3">
          <span
            ref={eyebrowRuleRef}
            className="block h-px w-8 origin-left"
            style={{ transform: 'scaleX(0)', background: CELL_BG }}
          />
          <span
            ref={eyebrowLabelRef}
            className="block text-label opacity-0"
            style={{ color: INK_SOFT }}
          >
            {EYEBROW}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-24 sm:px-6 md:px-10 md:pb-28 md:pt-28 lg:px-14 lg:pb-28 lg:pt-32">
        {/* ── Header band ─────────────────────────────────────────────────── */}
        <div ref={headerExitRef} className="will-change-transform">
          {/* Mobile keeps the eyebrow inline — the rail above is desktop-only. */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="block h-px w-8" style={{ background: CELL_BG }} />
            <span className="block text-label" style={{ color: INK_SOFT }}>
              {EYEBROW}
            </span>
          </div>

          <div className="lg:pl-[25%]">
            {/* Sized to fill the 75% column rather than to the display-md token:
                what makes this composition read is the headline block spanning
                from the 25% seam to the right edge, and Josefin is wide enough
                that the token's 64px cap would wrap these lines. */}
            <h2 className="font-sans text-[clamp(26px,3.6vw,56px)] font-[300] uppercase leading-[0.95] tracking-[0.01em] lg:whitespace-nowrap">
              {HEADLINE.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.06em]">
                  <span
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    className="block will-change-transform"
                    style={{ visibility: 'hidden' }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            <p
              ref={paragraphRef}
              className="mt-10 max-w-[40ch] text-body opacity-0 md:mt-12"
              style={{ color: INK_SOFT }}
            >
              {PARAGRAPH}
            </p>
          </div>
        </div>

        {/* ── Cell grid ───────────────────────────────────────────────────── */}
        <div className="relative mt-24 md:mt-28 lg:mt-28">
          {/* Drawn structure. Desktop only — below `lg` the cells carry their
              own borders instead, because the column count changes. */}
          <div
            ref={linesLayerRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 hidden opacity-0 lg:block"
          >
            {[0, 25, 50, 75, 100].map((pct) => (
              <span
                key={`v${pct}`}
                className="absolute top-0 h-full w-px"
                style={{
                  left: `${pct}%`,
                  background: LINE,
                  transform: pct === 100 ? 'translateX(-1px)' : undefined,
                }}
              />
            ))}
            {[0, 50, 100].map((pct) => (
              <span
                key={`h${pct}`}
                className="absolute left-0 h-px w-full"
                style={{
                  top: `${pct}%`,
                  background: LINE,
                  transform: pct === 100 ? 'translateY(-1px)' : undefined,
                }}
              />
            ))}
          </div>

          <div
            ref={gridRef}
            onPointerLeave={resetCells}
            className="grid grid-cols-2 gap-px lg:grid-cols-4 lg:grid-rows-2 lg:gap-0"
          >
            {/* ── 01 · years · c1r1 ── */}
            <StatCell
              stat={STATS[0]}
              row={1}
              className="lg:col-start-1 lg:row-start-1"
              cellRef={cellRef(0, 1)}
              clipRef={(el) => {
                cellClipRefs.current[0] = el;
              }}
              microRef={(el) => {
                microRefs.current[0] = el;
              }}
              onHover={hoverStat}
            />

            {/* ── 02 · delivered · c3r1 ── */}
            <StatCell
              stat={STATS[1]}
              row={1}
              className="lg:col-start-3 lg:row-start-1"
              cellRef={cellRef(1, 3)}
              clipRef={(el) => {
                cellClipRefs.current[1] = el;
              }}
              microRef={(el) => {
                microRefs.current[1] = el;
              }}
              onHover={hoverStat}
            />

            {/* ── 03 · image A · c4r1 ── */}
            <ImageCell
              image={people}
              caption="THE TEAM"
              row={1}
              className="lg:col-start-4 lg:row-start-1"
              cellRef={cellRef(2, 4)}
              clipRef={(el) => {
                cellClipRefs.current[2] = el;
              }}
              onHover={hoverImage}
            />

            {/* ── 04 · image B · c2r2 ── */}
            <ImageCell
              image={material}
              caption="MATERIAL STUDY"
              row={2}
              className="lg:col-start-2 lg:row-start-2"
              cellRef={cellRef(3, 2)}
              clipRef={(el) => {
                cellClipRefs.current[3] = el;
              }}
              onHover={hoverImage}
            />

            {/* ── 05 · satisfaction · c4r2 ── */}
            <StatCell
              stat={STATS[2]}
              row={2}
              className="lg:col-start-4 lg:row-start-2"
              cellRef={cellRef(4, 4)}
              clipRef={(el) => {
                cellClipRefs.current[4] = el;
              }}
              microRef={(el) => {
                microRefs.current[4] = el;
              }}
              onHover={hoverStat}
            />

            {/* ── 06 · CTA · c1r2 — the terminus of the checkerboard ── */}
            <CtaCell
              row={2}
              className="lg:col-start-1 lg:row-start-2"
              cellRef={cellRef(5, 1)}
              clipRef={(el) => {
                cellClipRefs.current[5] = el;
              }}
              microRef={(el) => {
                microRefs.current[5] = el;
              }}
              onHover={hoverCta}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Cell primitives ──────────────────────────────────────────────────────
   Every cell is the same three-layer sandwich:
     outer  — scroll-exit `y`, one column's worth
     clip   — entrance clip-path wipe
     inner  — content (and, for images, its own scale wrappers)
   ───────────────────────────────────────────────────────────────────────── */

/** Row 1 wipes down from its top edge; row 2 wipes up from its bottom edge. */
const hiddenClip = (row: number) => (row === 1 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)');

const CELL_BOX =
  'relative aspect-square w-full border border-black/[0.14] lg:aspect-auto lg:h-[28vh] lg:min-h-[225px] lg:border-0';

interface CellChrome {
  row: number;
  className: string;
  cellRef: (el: HTMLDivElement | null) => void;
  clipRef: (el: HTMLDivElement | null) => void;
  microRef?: (el: HTMLSpanElement | null) => void;
}

function StatCell({
  stat,
  row,
  className,
  cellRef,
  clipRef,
  microRef,
  onHover,
}: CellChrome & {
  stat: Stat;
  onHover: (el: HTMLElement | null, entering: boolean) => void;
}) {
  const self = useRef<HTMLDivElement>(null);

  return (
    <div ref={cellRef} className={`${CELL_BOX} ${className} will-change-transform`}>
      <div
        ref={clipRef}
        className="absolute inset-0 will-change-[clip-path]"
        style={{ clipPath: hiddenClip(row) }}
      >
        <div
          ref={self}
          onPointerEnter={() => onHover(self.current, true)}
          onPointerLeave={() => onHover(self.current, false)}
          className="absolute inset-0"
        >
          <div data-fill className="absolute inset-0" style={{ backgroundColor: CELL_BG }} />
          <span
            data-hairline
            className="absolute left-0 top-0 h-px w-full origin-left"
            style={{ background: ON_TEAL }}
          />

          <div className="relative flex h-full flex-col justify-between p-5 md:p-7 lg:p-8">
            <span
              className="block font-sans text-[clamp(44px,7vw,88px)] font-[200] tabular-nums leading-none"
              style={{ color: ON_TEAL }}
            >
              {/* Rendered at its final value so a no-JS or reduced-motion pass
                  is never blank; the counter tween repaints it from 0 on
                  entrance, keyed off `data-numeral-value`. */}
              <span data-numeral-value={stat.value}>{stat.value}</span>
              {stat.suffix}
            </span>

            <span
              ref={microRef}
              data-micro
              className="block self-end text-right text-label leading-[1.5] opacity-0"
              style={{ color: ON_TEAL_SOFT }}
            >
              {stat.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCell({
  image,
  caption,
  row,
  className,
  cellRef,
  clipRef,
  onHover,
}: CellChrome & {
  image?: SanityImage;
  caption: string;
  onHover: (el: HTMLElement | null, entering: boolean) => void;
}) {
  const self = useRef<HTMLDivElement>(null);

  return (
    <div ref={cellRef} className={`${CELL_BOX} ${className} will-change-transform`}>
      <div
        ref={clipRef}
        className="absolute inset-0 overflow-hidden will-change-[clip-path]"
        style={{ clipPath: hiddenClip(row) }}
      >
        <div
          ref={self}
          onPointerEnter={() => onHover(self.current, true)}
          onPointerLeave={() => onHover(self.current, false)}
          className="absolute inset-0 overflow-hidden"
        >
          {/* Entrance scale and hover scale get separate nodes — one element,
              one timeline, one property. */}
          <div data-enter-scale className="h-full w-full will-change-transform">
            <div data-hover-scale className="h-full w-full will-change-transform">
              <img
                src={image ? imageUrl(image, { width: 900 }) : ''}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div
            data-img-dim
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: '#0d0d0d' }}
          />

          {/* Floor for the caption. Undimming on hover is exactly when the
              image gets bright enough to swallow paper-white type, so the
              caption needs its own ground rather than the dim layer's. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            style={{
              background:
                'linear-gradient(to top, rgba(13,13,13,0.85), rgba(13,13,13,0.45) 50%, transparent)',
            }}
          />

          {/* Masked caption. The mask hugs the text — padding sits outside it,
              or the offset text would still show in the padding. Its resting
              offset is set by gsap.set(), not by a class. */}
          <div className="pointer-events-none absolute bottom-0 left-0 p-5 md:p-7 lg:p-8">
            <span className="block overflow-hidden">
              <span data-caption className="block text-label text-white will-change-transform">
                {caption}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtaCell({
  row,
  className,
  cellRef,
  clipRef,
  microRef,
  onHover,
}: CellChrome & {
  onHover: (el: HTMLElement | null, entering: boolean) => void;
}) {
  const self = useRef<HTMLAnchorElement>(null);

  return (
    <div ref={cellRef} className={`${CELL_BOX} ${className} will-change-transform`}>
      <div
        ref={clipRef}
        className="absolute inset-0 will-change-[clip-path]"
        style={{ clipPath: hiddenClip(row) }}
      >
        <Link
          ref={self}
          href="/en/about"
          onPointerEnter={() => onHover(self.current, true)}
          onPointerLeave={() => onHover(self.current, false)}
          className="absolute inset-0 block overflow-hidden"
        >
          {/* Fill sweeps up from the bottom edge. Resting scaleY is set by
              GSAP on mount, not by a class. */}
          <span
            data-cta-fill
            className="absolute inset-0 block origin-bottom will-change-transform"
            style={{ background: CELL_BG }}
          />

          <span className="relative flex h-full flex-col justify-between p-5 md:p-7 lg:p-8">
            <span
              data-cta-text
              className="block font-sans text-[clamp(20px,2.2vw,32px)] font-[300] leading-tight"
              style={{ color: INK }}
            >
              Read our
              <br />
              story
            </span>
            <span
              ref={microRef}
              data-cta-text
              className="flex items-center gap-3 self-end text-label opacity-0"
              style={{ color: INK }}
            >
              ABOUT TDK
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                className="h-3.5 w-3.5"
              >
                <path d="M1 8h13M9 3l5 5-5 5" />
              </svg>
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
