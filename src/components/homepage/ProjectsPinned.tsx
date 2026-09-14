'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import ProjectModal from '@/components/project-modal/ProjectModal';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectsPinned — the projects as a passage

   A port of "Passage" (magnificent_sections · work/realestate/passage),
   which is the motion and design the user asked for, verbatim where it can
   be and adapted only where TDK differs.

   THE IDEA
   A white, editorial ledger where the portfolio drifts through the viewport
   as a vertical filmstrip: the current render centred, the previous one's
   lower edge still leaving at the top, the next one's upper edge already
   arriving below. The project's name stands large on the left, overlapping
   the photograph; when the strip moves on, the old name loses focus (blur +
   fade, a lens pull, never a slide) and the new one sharpens in. A stacked
   project index lower left and a circular next button lower right both jump
   the scroll, snapped to whole projects. Inside each frame the photograph
   pans slowly against the travel.

   THE GEOMETRY
   The strip is a normal flex column: frames of --col-w width and 3:2 ratio
   with --gap between, padded top by calc(50svh − frame/2) so the FIRST
   frame rests centred with zero JS. One render(p) is the single writer:
   strip translateY = −p × step, per-frame pan offsets, name focus states,
   index states — all from the pinned scrub's one number.

   TDK ADAPTATIONS
   · Josefin, light, for the names; the site's label style for the index.
   · No wordmark and no menu circle — the site's navbar already holds the
     corners.
   · Clicking a frame or a name opens the brochure modal.
   · Lenis, when present, glides the index and next-button jumps.

   RULES (from the source's contract)
   · render(p) is the single writer of the strip translate, the pans, the
     name focus states and the index states. Never add a CSS transition or a
     tween to any of them.
   · The strip's paddingTop calc(50svh − var(--col-w) / 3) IS the no-JS
     centring; it derives from the locked 3:2 ratio.
   · Names change by opacity + blur ONLY. No transforms, no slides.
   · The pan is written on [data-pan] (inner), the travel on [data-strip]
     (outer). Never merge them.
   · The images carry 16% vertical overscan that the pan spends.
   · Snap is 1/(N − 1) — whole projects.
   · ScrollTrigger.refresh() runs after the last image decodes.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsPinnedProps {
  projects: Project[];
}

const PAPER = '#ffffff';
const INK = '#111111';

/** Frame column width. Height, centring and step all derive from it. */
const COLUMN_WIDTH = 'clamp(300px, 44vw, 900px)';
/** Vertical gap between frames, in svh. */
const GAP = 10;
/** Viewport-heights of scroll per project. */
const STEP = 1.1;
/** The slow pan inside each frame, yPercent across the whole travel. */
const PAN = 7;

/** Homepage display names where the CMS title is shorter than the one the
    board carries. Rename the title in Sanity to retire an entry. */
const DISPLAY_TITLES: Record<string, string> = {
  armonia: 'Armonia Apartments',
};

function displayTitle(p: Project): string {
  return DISPLAY_TITLES[p.slug.current] ?? p.title;
}

/** One line per word: "Almond Suites" → ["Almond", "Suites"]. */
function titleLines(p: Project): string[] {
  return displayTitle(p).split(' ');
}

/** The index label: the first word. */
function shortName(p: Project): string {
  return displayTitle(p).split(' ')[0];
}

export default function ProjectsPinned({ projects }: ProjectsPinnedProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Project | null>(null);

  const N = projects.length;

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    const pinEl = pinRef.current;
    const strip = stripRef.current;
    if (!scope || !pinEl || !strip || N < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frames = gsap.utils.toArray<HTMLElement>('[data-frame]', scope);
    const pans = gsap.utils.toArray<HTMLElement>('[data-pan]', scope);
    const names = gsap.utils.toArray<HTMLElement>('[data-name]', scope);
    const indexBtns = gsap.utils.toArray<HTMLElement>('[data-index]', scope);

    let stepPx = 1;
    const measure = () => {
      const h = frames[0]?.getBoundingClientRect().height ?? 1;
      stepPx = h + (window.innerHeight * GAP) / 100;
    };
    measure();

    /* ──────────────────────────────────────────────────── the one writer */

    let lastP = 0;
    const render = (p: number) => {
      lastP = p;
      strip.style.transform = `translate3d(0, ${(-p * stepPx).toFixed(2)}px, 0)`;

      const vh = window.innerHeight;
      frames.forEach((frame, j) => {
        const panEl = pans[j];
        if (!panEl || reduced) return;
        // Slow pan: the picture drifts against the travel while its frame
        // crosses the viewport.
        const r = frame.getBoundingClientRect();
        const rel = (r.top + r.height / 2 - vh / 2) / vh; // −~1 .. ~1
        panEl.style.transform = `translate3d(0, ${(Math.max(-1, Math.min(1, rel)) * PAN).toFixed(3)}%, 0)`;
      });

      const active = Math.round(Math.min(N - 1, Math.max(0, p)));
      names.forEach((t, j) => {
        if (reduced) {
          t.style.opacity = j === active ? '1' : '0';
          t.style.visibility = j === active ? 'visible' : 'hidden';
          t.style.filter = '';
          return;
        }
        const a = Math.abs(p - j);
        const FADE = 0.42;
        const vis = a >= FADE ? 0 : 1 - a / FADE;
        t.style.opacity = String(vis);
        t.style.visibility = vis > 0.02 ? 'visible' : 'hidden';
        // The focus pull: out of focus is blurred, in focus is sharp.
        t.style.filter = vis >= 0.999 ? '' : `blur(${((1 - vis) * 7).toFixed(2)}px)`;
      });

      indexBtns.forEach((b, j) => {
        b.style.opacity = j === active ? '1' : '0.38';
      });
    };

    /* ──────────────────────────────────────────────────────── behaviours */

    let trigger: ScrollTrigger | null = null;

    const scrollToProject = (j: number) => {
      if (!trigger) return;
      const t = trigger.start + (j / (N - 1)) * (trigger.end - trigger.start);
      const lenis = getLenis();
      if (lenis && !reduced) lenis.scrollTo(t, { duration: 1.1 });
      else window.scrollTo({ top: t, behavior: reduced ? 'auto' : 'smooth' });
    };
    const onIndexClick = (e: Event) => {
      const j = Number((e.currentTarget as HTMLElement).dataset.index);
      if (!Number.isNaN(j)) scrollToProject(j);
    };
    const onNext = () => scrollToProject(Math.min(N - 1, Math.round(lastP) + 1));

    indexBtns.forEach((b) => b.addEventListener('click', onIndexClick));
    const nextBtn = scope.querySelector<HTMLElement>('[data-next]');
    nextBtn?.addEventListener('click', onNext);

    // Late image decodes shift layout; refresh the pin once the last lands.
    const loaders = Array.from(scope.querySelectorAll<HTMLImageElement>('[data-pan] img'));
    let pending = loaders.length;
    loaders.forEach((img) => {
      const done = () => {
        if (--pending === 0) {
          measure();
          ScrollTrigger.refresh();
        }
      };
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        render(lastP);
      }, 150);
    });
    ro.observe(pinEl);

    /* ────────────────────────────────────────────────────────── timeline */

    const ctx = gsap.context(() => {
      trigger = ScrollTrigger.create({
        trigger: scope,
        start: 'top top',
        end: () => `+=${(N - 1) * window.innerHeight * STEP}`,
        pin: pinEl,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: reduced ? true : 0.8,
        snap: reduced
          ? undefined
          : {
              snapTo: 1 / (N - 1),
              duration: { min: 0.25, max: 0.6 },
              ease: 'power2.inOut',
            },
        invalidateOnRefresh: true,
        onRefresh: () => {
          measure();
          render(lastP);
        },
        onUpdate: (self) => render(self.progress * (N - 1)),
      });
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __projectsSt?: ScrollTrigger }).__projectsSt = trigger;
      }

      if (reduced) {
        render(0);
        return;
      }

      // Focus-pull entrance: everything arrives by sharpening, nothing
      // slides. Photographic, and honest to the section's one transition.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope, start: 'top 75%', once: true },
      });
      tl.from('[data-frame]', {
        autoAlpha: 0,
        filter: 'blur(9px)',
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.12,
      });
      tl.from(
        '[data-name-wrap]',
        { autoAlpha: 0, filter: 'blur(7px)', duration: 0.8, ease: 'power2.out' },
        0.35,
      );
      tl.from(
        '[data-quiet]',
        { autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power1.out' },
        0.55,
      );

      render(0);
    }, scope);

    return () => {
      ctx.revert();
      ro.disconnect();
      clearTimeout(resizeTimer);
      indexBtns.forEach((b) => b.removeEventListener('click', onIndexClick));
      nextBtn?.removeEventListener('click', onNext);
    };
  }, [N, projects]);

  if (N === 0) return null;

  return (
    <>
      <section
        id="projects"
        ref={rootRef}
        aria-label="Selected projects"
        className="relative w-full"
        style={{
          background: PAPER,
          color: INK,
          ['--col-w' as string]: COLUMN_WIDTH,
          fontFamily: 'var(--font-josefin)',
        }}
      >
        <div ref={pinRef} className="relative h-svh w-full overflow-hidden">
          {/* The filmstrip. First frame rests centred by construction. */}
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div
              ref={stripRef}
              data-strip
              className="flex flex-col items-center will-change-transform"
              style={{
                width: 'var(--col-w)',
                rowGap: `${GAP}svh`,
                paddingTop: 'calc(50svh - var(--col-w) / 3)',
              }}
            >
              {projects.map((p, j) => (
                <button
                  key={p._id}
                  type="button"
                  data-frame
                  onClick={() => setOpen(p)}
                  aria-label={`Open ${displayTitle(p)}`}
                  className="block w-full cursor-pointer overflow-hidden"
                  style={{ aspectRatio: '3 / 2' }}
                >
                  <div data-pan className="h-full w-full will-change-transform">
                    <img
                      src={cloudinaryUrl(p.heroImageId, { width: 1600 })}
                      alt={displayTitle(p)}
                      loading={j === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="h-[116%] w-full -translate-y-[7%] object-cover"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* The names, standing over the film. Focus pull only. */}
          <div
            data-name-wrap
            className="pointer-events-none absolute left-[5.5vw] top-1/2 z-10 -translate-y-1/2"
          >
            {projects.map((p, j) => (
              <h3
                key={p._id}
                data-name
                className={`text-[clamp(1.9rem,3.4vw,4.2rem)] font-[300] leading-[1.14] tracking-[0.01em] ${
                  j === 0 ? 'relative' : 'absolute left-0 top-0'
                }`}
                style={{ opacity: j === 0 ? 1 : 0, visibility: j === 0 ? 'visible' : 'hidden' }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="pointer-events-auto block cursor-pointer text-left"
                >
                  {titleLines(p).map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </button>
              </h3>
            ))}
          </div>

          {/* Chrome: index, next. */}
          <nav
            data-quiet
            aria-label="Projects"
            className="absolute bottom-10 left-[5.5vw] z-10 flex flex-col items-start gap-2.5"
          >
            {projects.map((p, j) => (
              <button
                key={p._id}
                type="button"
                data-index={j}
                className="cursor-pointer text-label transition-colors duration-200"
                style={{ opacity: j === 0 ? 1 : 0.38, letterSpacing: '0.3em' }}
              >
                {shortName(p)}
              </button>
            ))}
          </nav>

          <button
            data-quiet
            data-next
            type="button"
            aria-label="Next project"
            className="group absolute bottom-10 right-[3.5vw] z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-solid transition-colors duration-300 hover:bg-[#111111]"
            style={{ borderColor: 'rgba(17, 17, 17, 0.7)' }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 10 12"
              className="h-3 w-3 fill-current transition-colors duration-300 group-hover:fill-white"
            >
              <path d="M0 0 L10 6 L0 12 Z" />
            </svg>
          </button>
        </div>
      </section>

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </>
  );
}
