'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import ProjectModal from '@/components/project-modal/ProjectModal';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectsPinned — "Our Projects"

   One project fills the screen: its render in the middle, its name set large
   at the left crossing the render's edge, a paragraph and its status at the
   right, and the NEXT project's render sitting small beneath as a preview.
   Two hairline circles sit behind everything.

   The section pins for (N − 1) viewports. Each viewport of scroll is one
   transition, scrubbed: the current render fades and eases up, the preview
   climbs into the main slot and grows to fill it, the name slides out of its
   mask and the next name slides in, the paragraph and status cross over, and
   the project after next fades into the preview slot. The arrow scrolls to
   the next transition; clicking a render opens the brochure modal.

   Every position is measured off the board (3024 × 1964, one MacBook
   viewport): x and widths in cqw, y in cqh, and the two renders sized by
   HEIGHT (cqh) so they keep the board's share of the screen on wider
   viewports. The renders live in one zero-width column at the board's
   centre so their left offsets are a single unit and can be tweened.

   Layering discipline (see gsap-transform-pitfalls): the scrubbed timeline
   and the one-shot entrance never share a node and a property. Where they
   would (the name, the status, the bar) the entrance gets its own wrapper.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsPinnedProps {
  projects: Project[];
}

/** Renders: the main slot and the preview slot, in the shared centre column. */
const MAIN_RECT = { left: '-38.8cqh', top: '20.2cqh', width: '77.6cqh', height: '43.9cqh' };
const PREVIEW_RECT = { left: '-22cqh', top: '67.4cqh', width: '44cqh', height: '25.4cqh' };
/** Where the project after next waits before it fades into the preview slot. */
const PREVIEW_BELOW = '73cqh';

const STAGE: CSSProperties = { containerType: 'size' };

const CIRCLES = [
  { cx: '31cqw', cy: '49cqh', r: '28.5cqw' },
  { cx: '35cqw', cy: '38cqh', r: '39cqw' },
];

const INK = '#111111';
const TEAL = '#66979f';

function statusLabel(p: Project): string {
  if (p.status === 'completed') return 'Completed';
  if (p.status === 'in-progress') return 'In progress';
  return 'Upcoming';
}

export default function ProjectsPinned({ projects }: ProjectsPinnedProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<Project | null>(null);

  const count = projects.length;
  const last = count - 1;

  // ── Scrubbed transitions + one-shot entrance ──────────────────────────────
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
        const scales = q<HTMLElement>('[data-card-scale]');
        const clips = q<HTMLElement>('[data-card-clip]');
        const names = q<HTMLElement>('[data-name]'); // scrub — xPercent
        const nameEnter = q<HTMLElement>('[data-name-enter]'); // entrance — xPercent
        const paras = q<HTMLElement>('[data-para]');
        const statuses = q<HTMLElement>('[data-status]');
        const statusEnter = q<HTMLElement>('[data-status-enter]');
        const bar = q<HTMLElement>('[data-bar]')[0];
        const barEnter = q<HTMLElement>('[data-bar-enter]')[0];
        const circles = q<HTMLElement>('[data-circle]');
        const heading = q<HTMLElement>('[data-heading]')[0];
        const arrow = q<HTMLElement>('[data-arrow]')[0];

        // ── Resting states for the scrub. Percentages set here, never in
        //    CSS (a class-based translate parses back as px).
        cards.forEach((card, i) => {
          if (i === 0) gsap.set(card, { ...MAIN_RECT, autoAlpha: 1 });
          else if (i === 1) gsap.set(card, { ...PREVIEW_RECT, autoAlpha: 1 });
          else gsap.set(card, { ...PREVIEW_RECT, top: PREVIEW_BELOW, autoAlpha: 0 });
        });
        gsap.set(scales, { scale: 1 });
        names.forEach((n, i) => gsap.set(n, { xPercent: i === 0 ? 0 : -100, x: 0 }));
        paras.forEach((p, i) => gsap.set(p, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 12 }));
        statuses.forEach((s, i) => gsap.set(s, { autoAlpha: i === 0 ? 1 : 0 }));
        gsap.set(bar, { scaleX: 1 });

        // ── Entrance start states (own nodes).
        gsap.set(circles, { '--a': '0deg' });
        gsap.set(heading, { xPercent: -100, x: 0, visibility: 'visible' });
        gsap.set(clips.slice(0, 2), { clipPath: 'inset(0 100% 0 0)' });
        gsap.set(nameEnter, { xPercent: -100, x: 0, visibility: 'visible' });
        gsap.set(statusEnter, { autoAlpha: 0, y: 10 });
        gsap.set(barEnter, { scaleX: 0 });
        gsap.set(arrow, { scale: 0 });

        const finishEntrance = () => {
          gsap.set(circles, { '--a': '360deg' });
          gsap.set([heading, ...nameEnter], { xPercent: 0 });
          gsap.set(clips, { clipPath: 'inset(0 0% 0 0)' });
          gsap.set(statusEnter, { autoAlpha: 1, y: 0 });
          gsap.set(barEnter, { scaleX: 1 });
          gsap.set(arrow, { scale: 1 });
        };

        if (isReduced) {
          finishEntrance();
          gsap.set(paras[0], { visibility: 'visible' });
          return;
        }

        // ── Entrance — once, as the section arrives.
        document.fonts.ready.then(() => {
          context.add(() => {
            const first = paras[0];
            const split = SplitText.create(first, { type: 'lines', linesClass: 'proj-line' });
            splits.push(split);
            gsap.set(split.lines, { clipPath: 'inset(0 100% 0 0)' });
            gsap.set(first, { visibility: 'visible' });

            const tl = gsap.timeline({
              defaults: { ease: 'power3.out' },
              scrollTrigger: { trigger: section, start: 'top 75%', once: true },
            });
            tl.to(
              circles,
              { '--a': '360deg', duration: 1.4, ease: 'power2.inOut', stagger: 0.2 },
              0,
            );
            tl.to(heading, { xPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.2);
            tl.to(
              clips[0],
              { clipPath: 'inset(0 0% 0 0)', duration: 1.0, ease: 'power3.inOut' },
              0.35,
            );
            tl.to(nameEnter[0], { xPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.7);
            tl.to(
              split.lines,
              {
                clipPath: 'inset(0 0% 0 0)',
                duration: 0.7,
                ease: 'power2.inOut',
                stagger: 0.16,
                onComplete: () => split.revert(),
              },
              0.9,
            );
            tl.to(statusEnter[0], { autoAlpha: 1, y: 0, duration: 0.6 }, 1.3);
            tl.to(barEnter, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, 1.4);
            if (clips[1]) {
              tl.to(
                clips[1],
                { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' },
                1.2,
              );
            }
            tl.to(arrow, { scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 1.5);
          });
        });

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
            snap: { snapTo: 1 / last, duration: { min: 0.25, max: 0.6 }, ease: 'power1.inOut' },
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

        for (let t = 0; t < last; t++) {
          const cur = t;
          const nxt = t + 1;
          const after = t + 2;

          // The current render lets go: eases up a touch and fades.
          scrub.to(cards[cur], { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, t);
          scrub.to(scales[cur], { scale: 1.04, duration: 0.6, ease: 'power2.in' }, t);

          // The preview climbs into the main slot and grows to fill it.
          scrub.to(cards[nxt], { ...MAIN_RECT, duration: 0.85, ease: 'power2.inOut' }, t);

          // The project after next fades into the preview slot from below.
          if (after < count) {
            scrub.to(
              cards[after],
              { top: PREVIEW_RECT.top, autoAlpha: 1, duration: 0.3, ease: 'power2.out' },
              t + 0.7,
            );
          }

          // Names: out to the left, then the next in from the left.
          scrub.to(names[cur], { xPercent: -100, duration: 0.4, ease: 'power2.in' }, t + 0.2);
          scrub.to(names[nxt], { xPercent: 0, duration: 0.45, ease: 'power3.out' }, t + 0.45);

          // Paragraph and status cross over.
          scrub.to(paras[cur], { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' }, t + 0.2);
          scrub.to(paras[nxt], { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, t + 0.5);
          scrub.to(statuses[cur], { autoAlpha: 0, duration: 0.25 }, t + 0.3);
          scrub.to(statuses[nxt], { autoAlpha: 1, duration: 0.3 }, t + 0.55);

          // The bar redraws.
          scrub
            .to(bar, { scaleX: 0, duration: 0.25, ease: 'power2.in' }, t + 0.3)
            .to(bar, { scaleX: 1, duration: 0.35, ease: 'power3.out' }, t + 0.55);
        }

        // Cleanup when this media context reverts.
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
          {/* Hairline circles. Each is a bordered disc revealed by a conic
              mask that GSAP sweeps round. */}
          {CIRCLES.map((c, i) => (
            <div
              key={i}
              data-circle
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border"
              style={{
                left: `calc(${c.cx} - ${c.r})`,
                top: `calc(${c.cy} - ${c.r})`,
                width: `calc(${c.r} * 2)`,
                height: `calc(${c.r} * 2)`,
                borderColor: '#c8c8c8',
                ['--a' as string]: '0deg',
                maskImage: 'conic-gradient(from 0deg, #000 var(--a), transparent var(--a))',
                WebkitMaskImage: 'conic-gradient(from 0deg, #000 var(--a), transparent var(--a))',
              }}
            />
          ))}

          {/* Heading — top right, in a mask. */}
          <h2
            className="absolute overflow-hidden"
            style={{
              right: '2cqw',
              top: '3cqh',
              fontSize: '5.5cqw',
              fontWeight: 300,
              lineHeight: 1.15,
            }}
          >
            <span data-heading className="block" style={{ visibility: 'hidden' }}>
              Our Projects
            </span>
          </h2>

          {/* The renders — a zero-width column at the board's centre, so each
              card's offset is one unit and the scrub can tween it. */}
          <div className="absolute top-0 h-full w-0" style={{ left: '49.4cqw' }}>
            {projects.map((p, i) => (
              <button
                key={p._id}
                type="button"
                data-card
                onClick={() => setOpen(p)}
                aria-label={`Open ${p.title}`}
                className="absolute block overflow-hidden"
                style={{ ...(i === 0 ? MAIN_RECT : PREVIEW_RECT), visibility: 'hidden' }}
              >
                <div data-card-scale className="h-full w-full will-change-transform">
                  <div data-card-clip className="h-full w-full">
                    <img
                      src={cloudinaryUrl(p.heroImageId, { width: 1600 })}
                      alt={p.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Name — large, left, crossing the render's edge. One mask; the
              names stack inside it and the scrub slides them through. */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: '0.75cqw',
              top: '38.9cqh',
              width: '48cqw',
              fontSize: '5.2cqw',
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: '0.01em',
            }}
          >
            {/* A sizer keeps the mask as tall as the tallest name. */}
            <span className="invisible block whitespace-nowrap">{projects[0].title}</span>
            {projects.map((p, i) => (
              <span
                key={p._id}
                data-name
                className="absolute left-0 top-0 block whitespace-nowrap will-change-transform"
              >
                <span
                  data-name-enter
                  className="block will-change-transform"
                  style={{ visibility: i === 0 ? 'hidden' : 'visible' }}
                >
                  {p.title}
                </span>
              </span>
            ))}
          </div>

          {/* Arrow — to the next project. */}
          <button
            type="button"
            data-arrow
            onClick={goNext}
            aria-label="Next project"
            disabled={current >= last}
            className="absolute grid place-items-center rounded-full transition-opacity duration-medium ease-smooth disabled:opacity-30"
            style={{
              left: '0.4cqw',
              top: '52.7cqh',
              width: '7.25cqw',
              height: '7.25cqw',
              backgroundColor: '#d9dcdf',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={INK}
              strokeWidth="1.4"
              className="h-[42%] w-[42%]"
            >
              <path d="M3 12h17M13 5l7 7-7 7" />
            </svg>
          </button>

          {/* Paragraph — right column, centred. All stacked; the scrub crosses
              them over. The first one wipes in line by line on entrance. */}
          <div className="absolute" style={{ left: '76.25cqw', width: '22cqw', top: '22cqh' }}>
            {projects.map((p, i) => (
              <p
                key={p._id}
                data-para
                className="absolute left-0 top-0 w-full text-center"
                style={{
                  fontSize: 'clamp(12px, 1.3cqw, 20px)',
                  lineHeight: 1.3,
                  color: '#222',
                  visibility: i === 0 ? 'hidden' : undefined,
                }}
              >
                {p.homepageIntro ?? p.pullQuote ?? ''}
              </p>
            ))}
          </div>

          {/* Status — label and the teal bar. */}
          <div
            data-status-enter
            className="absolute flex items-center will-change-transform"
            style={{ left: '76.25cqw', top: '59.9cqh', width: '23.3cqw', height: '3.8cqh' }}
          >
            <div className="relative h-full flex-1">
              {projects.map((p) => (
                <span
                  key={p._id}
                  data-status
                  className="absolute left-0 top-1/2 block -translate-y-1/2 whitespace-nowrap"
                  style={{ fontSize: '2.1cqw', fontWeight: 300, lineHeight: 1 }}
                >
                  {statusLabel(p)}
                </span>
              ))}
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
          <h2 className="mb-10 text-[11vw] font-[300] leading-none">Our Projects</h2>
          <ul className="flex flex-col gap-14">
            {projects.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="block w-full overflow-hidden"
                  aria-label={`Open ${p.title}`}
                >
                  <img
                    src={cloudinaryUrl(p.heroImageId, { width: 1000 })}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full object-cover"
                  />
                </button>
                <h3 className="mt-5 text-[8vw] font-[300] leading-none">{p.title}</h3>
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
