'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import ProjectModal from '@/components/project-modal/ProjectModal';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectsPinned — the projects, one per screen

   One project fills the screen: its render in the middle, its name set large
   at the left crossing the render's edge, a paragraph and its status at the
   right, and the NEXT project's render sitting small beneath as a preview.
   Two hairline rings sit behind, centred on the render, with a teal marker on
   the inner one — a dial that turns as the projects change.

   The section pins for (N − 1) viewports. Each viewport of scroll is one
   transition, scrubbed, and the renders SCROLL: the current one travels up
   and off the top, the preview travels up into the main slot and grows to
   fill it, the project after next rises from below into the preview slot.
   Every piece of text changes by ROLLING: letter by letter, left to right,
   the old letter rolls up and out of its line while the new one rolls in
   from below. The rings turn 360/N degrees per transition.

   Entrance, once, as the section arrives: the rings sweep round, the name
   and the paragraph's lines slide in through side masks (the hero's move),
   the renders wipe on, the status and the arrow follow.

   The arrow is a hairline ring; on hover the → tilts to point up and to the
   right, and tilts back on leave. Clicking it scrolls to the next
   transition. Clicking a render opens the brochure modal.

   Positions are board fractions (3024 × 1964, one MacBook viewport): x and
   widths in cqw, y in cqh, the two renders sized by HEIGHT so they keep the
   board's share of the screen on wider viewports. The renders live in one
   zero-width column at the board's centre so their offsets are a single
   unit and can be tweened.

   Layering discipline (see gsap-transform-pitfalls): the scrub and the
   entrance never share a node and a property. Lines slide (entrance),
   letters roll (scrub), and each has its own element.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsPinnedProps {
  projects: Project[];
}

/** Renders: the main slot and the preview slot, in the shared centre column. */
const MAIN_RECT = { left: '-38.8cqh', top: '20.2cqh', width: '77.6cqh', height: '43.9cqh' };
const PREVIEW_RECT = { left: '-22cqh', top: '67.4cqh', width: '44cqh', height: '25.4cqh' };
/** Where a render waits below the stage, and where it ends above it. */
const BELOW = '106cqh';
const ABOVE = '-48cqh';

/** Rings, centred on the main render. */
const RING_CX = '49.4cqw';
const RING_CY = '42.2cqh';
const RINGS = [
  { r: '47cqh', marker: true },
  { r: '61cqh', marker: false },
];

const STAGE: CSSProperties = { containerType: 'size' };

const INK = '#111111';
const TEAL = '#66979f';

/** Homepage display names where the CMS title is shorter than the one the
    board carries. Rename the title in Sanity to retire an entry. */
const DISPLAY_TITLES: Record<string, string> = {
  armonia: 'Armonia Apartments',
};

function displayTitle(p: Project): string {
  return DISPLAY_TITLES[p.slug.current] ?? p.title;
}

function statusLabel(p: Project): string {
  if (p.status === 'completed') return 'Completed';
  if (p.status === 'in-progress') return 'In progress';
  return 'Upcoming';
}

export default function ProjectsPinned({ projects }: ProjectsPinnedProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const hoverTlRef = useRef<gsap.core.Timeline | null>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<Project | null>(null);

  const count = projects.length;
  const last = count - 1;

  // ── Scrub + entrance ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section || count === 0) return;

    const mm = gsap.matchMedia();
    const splits: SplitText[] = [];

    mm.add(
      { isDesktop: '(min-width: 1024px)', isReduced: '(prefers-reduced-motion: reduce)' },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as {
          isDesktop: boolean;
          isReduced: boolean;
        };
        if (!isDesktop) return;

        const q = gsap.utils.selector(section);
        const cards = q<HTMLElement>('[data-card]');
        const clips = q<HTMLElement>('[data-card-clip]');
        const nameEnter = q<HTMLElement>('[data-name-enter]')[0];
        const names = q<HTMLElement>('[data-name]');
        const paras = q<HTMLElement>('[data-para]');
        const statusEnter = q<HTMLElement>('[data-status-enter]')[0];
        const statuses = q<HTMLElement>('[data-status]');
        const bar = q<HTMLElement>('[data-bar]')[0];
        const barEnter = q<HTMLElement>('[data-bar-enter]')[0];
        const rings = q<HTMLElement>('[data-ring]');
        const ringSpins = q<HTMLElement>('[data-ring-spin]');
        const marker = q<HTMLElement>('[data-marker]')[0];
        const arrow = q<HTMLElement>('[data-arrow]')[0];

        // ── Render resting places. Cards beyond the preview wait below.
        cards.forEach((card, i) => {
          if (i === 0) gsap.set(card, MAIN_RECT);
          else if (i === 1) gsap.set(card, PREVIEW_RECT);
          else gsap.set(card, { ...PREVIEW_RECT, top: BELOW });
          gsap.set(card, { visibility: 'visible' });
        });
        gsap.set(bar, { scaleX: 1 });
        gsap.set(ringSpins, { rotation: 0 });

        // ── Entrance start states (own nodes).
        gsap.set(rings, { '--a': '0deg' });
        gsap.set(clips.slice(0, 2), { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(nameEnter, { xPercent: -100, x: 0 });
        gsap.set(statusEnter, { xPercent: -100, x: 0 });
        gsap.set(barEnter, { scaleX: 0 });
        gsap.set(arrow, { scale: 0 });
        gsap.set(marker, { autoAlpha: 0 });

        // Everything textual is split after the font is certain: lines carry
        // the entrance slide and mask the roll; letters carry the roll.
        document.fonts.ready.then(() => {
          context.add(() => {
            const splitAll = (els: HTMLElement[]) =>
              els.map((el) => {
                const s = SplitText.create(el, {
                  type: 'lines,words,chars',
                  mask: 'lines',
                  linesClass: 'proj-line',
                  charsClass: 'proj-char',
                });
                splits.push(s);
                return s;
              });
            const nameSplits = splitAll(names);
            const paraSplits = splitAll(paras);
            const statusSplits = splitAll(statuses);
            const groups = [nameSplits, paraSplits, statusSplits];

            // Letters of every project but the first wait below their line.
            groups.forEach((g) =>
              g.forEach((s, i) => {
                gsap.set(s.chars, { yPercent: i === 0 ? 0 : 100, y: 0 });
              }),
            );
            // The first project's lines start off to the left, inside their masks.
            gsap.set([...nameSplits[0].lines, ...paraSplits[0].lines, ...statusSplits[0].lines], {
              xPercent: -100,
              x: 0,
            });
            gsap.set([...names, ...paras, ...statuses], { visibility: 'visible' });

            const finishEntrance = () => {
              gsap.set(rings, { '--a': '360deg' });
              gsap.set(clips, { clipPath: 'inset(0 0% 0 0)' });
              gsap.set([nameEnter, statusEnter], { xPercent: 0 });
              gsap.set([...nameSplits[0].lines, ...paraSplits[0].lines, ...statusSplits[0].lines], {
                xPercent: 0,
              });
              gsap.set(barEnter, { scaleX: 1 });
              gsap.set(arrow, { scale: 1 });
              gsap.set(marker, { autoAlpha: 1 });
            };

            if (isReduced) {
              finishEntrance();
            } else {
              // ── Entrance — once, as the section arrives.
              const tl = gsap.timeline({
                defaults: { ease: 'power3.out' },
                scrollTrigger: { trigger: section, start: 'top 70%', once: true },
              });
              tl.to(
                rings,
                { '--a': '360deg', duration: 1.4, ease: 'power2.inOut', stagger: 0.2 },
                0,
              );
              tl.to(marker, { autoAlpha: 1, duration: 0.4 }, 1.2);
              tl.to(
                clips[0],
                { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power3.inOut' },
                0.2,
              );
              tl.set(nameEnter, { xPercent: 0 }, 0.5);
              tl.to(nameSplits[0].lines, { xPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.5);
              tl.to(
                paraSplits[0].lines,
                { xPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.08 },
                0.7,
              );
              tl.set(statusEnter, { xPercent: 0 }, 1.1);
              tl.to(statusSplits[0].lines, { xPercent: 0, duration: 0.7, ease: 'power4.out' }, 1.1);
              tl.to(barEnter, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, 1.25);
              if (clips[1]) {
                tl.to(
                  clips[1],
                  { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' },
                  1.0,
                );
              }
              tl.to(arrow, { scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 1.4);
            }

            if (count < 2) return;

            // ── The scrub — one unit of time per transition.
            const scrub = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: `+=${last * 100}%`,
                pin: true,
                scrub: 0.8,
                snap: {
                  snapTo: 1 / last,
                  duration: { min: 0.25, max: 0.6 },
                  ease: 'power1.inOut',
                },
                onUpdate: (self) => {
                  const idx = Math.round(self.progress * last);
                  setCurrent((c) => (c === idx ? c : idx));
                },
              },
            });
            stRef.current = scrub.scrollTrigger ?? null;
            if (process.env.NODE_ENV !== 'production') {
              (window as unknown as { __projectsTl?: gsap.core.Timeline }).__projectsTl = scrub;
            }

            /** Roll one block of text from project `cur` to `nxt`: letter by
                letter, left to right, the old up and out, the new in from
                below. Both run on the same clock so letter i of each moves
                together whatever the two lengths. */
            const roll = (
              g: SplitText[],
              cur: number,
              nxt: number,
              at: number,
              span: number,
              each: number,
            ) => {
              const out = g[cur].chars;
              const inn = g[nxt].chars;
              const n = Math.max(out.length, inn.length, 1);
              const step = span / n;
              out.forEach((ch, i) =>
                scrub.to(ch, { yPercent: -100, duration: each, ease: 'power2.in' }, at + i * step),
              );
              inn.forEach((ch, i) =>
                scrub.to(
                  ch,
                  { yPercent: 0, duration: each, ease: 'power2.out' },
                  at + i * step + each * 0.5,
                ),
              );
            };

            for (let t = 0; t < last; t++) {
              const cur = t;
              const nxt = t + 1;
              const after = t + 2;

              // Renders scroll: the current one off the top, the preview up
              // into the main slot, the one after next up from below.
              scrub.to(cards[cur], { top: ABOVE, duration: 0.85, ease: 'power1.inOut' }, t);
              scrub.to(cards[nxt], { ...MAIN_RECT, duration: 0.85, ease: 'power1.inOut' }, t);
              if (after < count) {
                scrub.to(
                  cards[after],
                  { top: PREVIEW_RECT.top, duration: 0.7, ease: 'power1.inOut' },
                  t + 0.25,
                );
              }

              // Text rolls, letter by letter, left to right.
              roll(nameSplits, cur, nxt, t + 0.1, 0.45, 0.2);
              roll(paraSplits, cur, nxt, t + 0.15, 0.6, 0.14);
              roll(statusSplits, cur, nxt, t + 0.4, 0.25, 0.2);

              // The bar redraws under the new status.
              scrub
                .to(bar, { scaleX: 0, duration: 0.25, ease: 'power2.in' }, t + 0.35)
                .to(bar, { scaleX: 1, duration: 0.35, ease: 'power3.out' }, t + 0.6);

              // The dial turns — absolute angles, so the rest position never
              // depends on when the timeline first rendered.
              const inner = 360 / count;
              const outer = -180 / count;
              scrub.fromTo(
                ringSpins[0],
                { rotation: t * inner },
                { rotation: (t + 1) * inner, duration: 1, immediateRender: false },
                t,
              );
              if (ringSpins[1]) {
                scrub.fromTo(
                  ringSpins[1],
                  { rotation: t * outer },
                  { rotation: (t + 1) * outer, duration: 1, immediateRender: false },
                  t,
                );
              }
            }

            ScrollTrigger.refresh();
          });
        });

        return () => {
          stRef.current = null;
        };
      },
    );

    return () => {
      splits.forEach((s) => s.revert());
      mm.revert();
    };
  }, [count, last]);

  // ── The arrow's hover — it tilts to point up and to the right.
  useLayoutEffect(() => {
    const el = arrowRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const svg = el.querySelector('svg');
      gsap.set(svg, { rotation: 0, transformOrigin: '50% 50%' });
      hoverTlRef.current = gsap
        .timeline({ paused: true })
        .to(svg, { rotation: -45, duration: 0.5, ease: 'power3.out' });
    }, el);
    return () => {
      hoverTlRef.current = null;
      ctx.revert();
    };
  }, []);

  // ── The arrow — scroll to the next transition ─────────────────────────────
  const goNext = () => {
    const st = stRef.current;
    if (!st || current >= last) return;
    const target = st.start + ((current + 1) / last) * (st.end - st.start);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(target, { duration: 1.2 });
    else window.scrollTo({ top: target, behavior: 'smooth' });
  };

  if (count === 0) return null;

  return (
    <>
      <section
        id="projects"
        ref={sectionRef}
        className="relative w-full overflow-hidden bg-white"
        style={{ color: INK }}
      >
        {/* ── Desktop stage — one viewport, board coordinates ────────────── */}
        <div
          className="relative hidden h-[100svh] w-full select-none lg:block"
          style={{ ...STAGE, fontFamily: 'var(--font-josefin)' }}
        >
          {/* Rings — centred on the render. The outer node is revealed by a
              conic sweep on entrance; the inner node turns with the scrub and
              carries the marker. */}
          {RINGS.map((ring, i) => (
            <div
              key={i}
              data-ring
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: `calc(${RING_CX} - ${ring.r})`,
                top: `calc(${RING_CY} - ${ring.r})`,
                width: `calc(${ring.r} * 2)`,
                height: `calc(${ring.r} * 2)`,
                ['--a' as string]: '0deg',
                maskImage: 'conic-gradient(from 0deg, #000 var(--a), transparent var(--a))',
                WebkitMaskImage: 'conic-gradient(from 0deg, #000 var(--a), transparent var(--a))',
              }}
            >
              <div
                data-ring-spin
                className="relative h-full w-full rounded-full border will-change-transform"
                style={{ borderColor: i === 0 ? '#b9b9b9' : '#d4d4d4' }}
              >
                {ring.marker && (
                  <span
                    data-marker
                    className="absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: '1.1cqh', height: '1.1cqh', backgroundColor: TEAL }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* The renders — a zero-width column at the board's centre, so each
              card's offset is one unit and the scrub can tween it. */}
          <div className="absolute top-0 h-full w-0" style={{ left: RING_CX }}>
            {projects.map((p, i) => (
              <button
                key={p._id}
                type="button"
                data-card
                onClick={() => setOpen(p)}
                aria-label={`Open ${displayTitle(p)}`}
                className="absolute block overflow-hidden"
                style={{ ...(i === 0 ? MAIN_RECT : PREVIEW_RECT), visibility: 'hidden' }}
              >
                <div data-card-clip className="h-full w-full">
                  <img
                    src={cloudinaryUrl(p.heroImageId, { width: 1600 })}
                    alt={displayTitle(p)}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Name — large, left, crossing the render's edge. The first project
              sits in flow and sizes the box; the others stack over it. */}
          <div
            className="absolute text-white mix-blend-difference"
            style={{
              left: '0.75cqw',
              top: '38.9cqh',
              padding: '0 0.06em',
              fontSize: '5.2cqw',
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: '0.01em',
            }}
          >
            <div data-name-enter className="will-change-transform">
              {projects.map((p, i) => (
                <h3
                  key={p._id}
                  data-name
                  className={`whitespace-nowrap ${i === 0 ? 'relative' : 'absolute left-0 top-0'}`}
                  style={{ visibility: 'hidden' }}
                >
                  {displayTitle(p)}
                </h3>
              ))}
            </div>
          </div>

          {/* Arrow — a hairline ring; the line inside tilts on hover. */}
          <button
            ref={arrowRef}
            type="button"
            data-arrow
            onClick={goNext}
            onPointerEnter={() => hoverTlRef.current?.play()}
            onPointerLeave={() => hoverTlRef.current?.reverse()}
            aria-label="Next project"
            disabled={current >= last}
            className="absolute grid place-items-center rounded-full border border-solid transition-opacity duration-medium ease-smooth disabled:opacity-30"
            style={{
              left: '0.4cqw',
              top: '52.7cqh',
              width: '7.25cqw',
              height: '7.25cqw',
              borderColor: INK,
            }}
          >
            <svg
              viewBox="0 0 48 48"
              fill="none"
              stroke={INK}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[46%] w-[46%] will-change-transform"
            >
              <path d="M9 24h29M29 15l9 9-9 9" />
            </svg>
          </button>

          {/* Paragraph — right column, centred. The first project sits in flow
              and sizes the box; the others stack over it. */}
          <div
            className="absolute"
            style={{
              left: '76.25cqw',
              width: '22cqw',
              top: '22cqh',
              padding: '0 0.1em',
              fontSize: 'clamp(12px, 1.3cqw, 20px)',
              lineHeight: 1.3,
              color: '#222',
            }}
          >
            {projects.map((p, i) => (
              <p
                key={p._id}
                data-para
                className={`w-full text-center ${i === 0 ? 'relative' : 'absolute left-0 top-0'}`}
                style={{ visibility: 'hidden' }}
              >
                {p.homepageIntro ?? p.pullQuote ?? ''}
              </p>
            ))}
          </div>

          {/* Status — label and the teal bar. */}
          <div
            className="absolute flex items-center"
            style={{ left: '76.25cqw', top: '59.9cqh', width: '23.3cqw', height: '3.8cqh' }}
          >
            <div className="relative flex h-full flex-1 items-center overflow-hidden">
              <div
                data-status-enter
                className="relative will-change-transform"
                style={{
                  padding: '0 0.08em',
                  fontSize: '2.1cqw',
                  fontWeight: 300,
                  lineHeight: 1.15,
                }}
              >
                {projects.map((p, i) => (
                  <span
                    key={p._id}
                    data-status
                    className={`block whitespace-nowrap ${i === 0 ? 'relative' : 'absolute left-0 top-0'}`}
                    style={{ visibility: 'hidden' }}
                  >
                    {statusLabel(p)}
                  </span>
                ))}
              </div>
            </div>
            <div data-bar-enter className="h-full origin-left" style={{ width: '11cqw' }}>
              <div
                data-bar
                className="h-full w-full origin-left"
                style={{ backgroundColor: TEAL }}
              />
            </div>
          </div>
        </div>

        {/* ── Mobile — a plain stack, no pin ──────────────────────────────── */}
        <div className="px-5 py-16 lg:hidden" style={{ fontFamily: 'var(--font-josefin)' }}>
          <ul className="flex flex-col gap-14">
            {projects.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="block w-full overflow-hidden"
                  aria-label={`Open ${displayTitle(p)}`}
                >
                  <img
                    src={cloudinaryUrl(p.heroImageId, { width: 1000 })}
                    alt={displayTitle(p)}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                </button>
                <h3 className="mt-5 text-[8vw] font-[300] leading-none">{displayTitle(p)}</h3>
                {(p.homepageIntro ?? p.pullQuote) && (
                  <p className="mt-4 text-[15px] leading-[1.4]" style={{ color: '#222' }}>
                    {p.homepageIntro ?? p.pullQuote}
                  </p>
                )}
                <div className="mt-5 flex items-center gap-4">
                  <span className="text-[5vw] font-[300] leading-none">{statusLabel(p)}</span>
                  <span className="h-[14px] flex-1" style={{ backgroundColor: TEAL }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </>
  );
}
