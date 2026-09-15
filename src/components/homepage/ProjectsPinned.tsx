'use client';

import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { stripReveal } from '@/lib/animations/stripReveal';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import { displayTitle, projectHref, STATUS_LABEL } from '@/lib/projects/display';
import { useProjectTransition } from '@/components/transition/ProjectTransition';
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
   index states and the index marker — all from the pinned scrub's one
   number. render(p) does arithmetic only; it never reads layout.

   TDK ADAPTATIONS
   · Josefin, light, for the names; the site's label style for the index.
   · No wordmark and no menu circle — the site's navbar holds the corners.
   · Each name carries its particulars: a counter above, location and status
     below. They focus-pull with the name as one block.
   · A hairline track beside the index with a teal marker that travels with
     the scroll — the section's one touch of the accent.
   · Clicking a frame or a name opens the project's page through
     ProjectTransition: the photograph lifts out of its frame and becomes the
     page's hero. Both are real links, so modified clicks open a tab.
   · Lenis carries the scroll, so the snap goes THROUGH Lenis (see "snap"
     below), never through ScrollTrigger's own snap.

   PERFORMANCE — why it is built this way
   · scrub: true. Lenis already smooths the scroll; a numeric scrub on top
     made the strip trail the pin, still catching up as the pin engaged and
     released — the lag on entering and leaving.
   · ScrollTrigger's snap tweens the window scroll while Lenis rewrites the
     scroll position every frame; the two fought at both ends of the pin.
     The snap now waits for input to stop and retargets Lenis instead, and
     never acts outside the pin, so nothing pulls a leaving reader back.
   · No anticipatePin: with Lenis it pins early and jumps.
   · The frames enter with the site's one image entrance (stripReveal):
     white strips wiping off left to right, top to bottom, while each render
     settles on its own [data-settle] node. The strips are composited
     transforms and are removed when they finish.
   · No ScrollTrigger.refresh() on image load: the frames are aspect-ratio
     boxes, so a decode cannot move layout, and a refresh mid-scroll is a
     jump in itself. All renders load eagerly so none decodes mid-travel.

   RULES (from the source's contract)
   · render(p) is the single writer of the strip translate, the pans, the
     name focus states, the index states and the marker. Never add a CSS
     transition or a tween to any of them.
   · The strip's paddingTop calc(50svh − var(--col-w) / 3) IS the no-JS
     centring; it derives from the locked 3:2 ratio.
   · Names change by opacity + blur ONLY. No transforms, no slides.
   · The pan is written on [data-pan] (inner), the travel on [data-strip]
     (outer); the entrance writes scale on [data-settle] (between them) and
     adds its strips inside [data-frame]. Never merge them.
   · The images carry 16% vertical overscan that the pan spends.
   · Snap is to whole projects.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsPinnedProps {
  projects: Project[];
}

const PAPER = '#ffffff';
const INK = '#111111';
const ACCENT = 'var(--color-threshold, #66979f)';

/** Frame column width. Height, centring and step all derive from it. */
const COLUMN_WIDTH = 'clamp(300px, 44vw, 900px)';
/** Vertical gap between frames, in svh. */
const GAP = 10;
/** Viewport-heights of scroll per project. */
const STEP = 1.1;
/** The slow pan inside each frame, yPercent across the whole travel. */
const PAN = 7;
/** How long input must be still before the snap takes over, ms. */
const SNAP_IDLE = 140;
/** How far past a project, in steps, the scroll must travel before the snap
    carries on to the next one instead of settling back. */
const SNAP_COMMIT = 0.12;

/** One line per word: "Almond Suites" → ["Almond", "Suites"]. */
function titleLines(p: Project): string[] {
  return displayTitle(p).split(' ');
}

/** The index label: the first word. */
function shortName(p: Project): string {
  return displayTitle(p).split(' ')[0];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Lenis 1.0.x keeps the scroll target on the instance but leaves it out of
    its type declarations. The target moves only on input. */
const scrollTargetOf = (lenis: object): number => (lenis as { targetScroll: number }).targetScroll;

export default function ProjectsPinned({ projects }: ProjectsPinnedProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const transition = useProjectTransition();

  const N = projects.length;

  /** Plain clicks go through the transition; modified ones stay links. */
  const openProject = (e: ReactMouseEvent<HTMLAnchorElement>, j: number) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const p = projects[j];
    const href = projectHref(locale, p.slug.current);
    const frame = rootRef.current?.querySelectorAll<HTMLElement>('[data-frame]')[j];
    const image = frame?.querySelector<HTMLImageElement>('[data-pan] img');
    const handled =
      !!frame &&
      !!image &&
      transition.start({ href, slug: p.slug.current, imageId: p.heroImageId, frame, image });
    if (!handled) router.push(href);
  };

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    const pinEl = pinRef.current;
    const strip = stripRef.current;
    const marker = markerRef.current;
    if (!scope || !pinEl || !strip || N < 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frames = gsap.utils.toArray<HTMLElement>('[data-frame]', scope);
    const pans = gsap.utils.toArray<HTMLElement>('[data-pan]', scope);
    const names = gsap.utils.toArray<HTMLElement>('[data-name]', scope);
    const indexBtns = gsap.utils.toArray<HTMLElement>('[data-index]', scope);

    // Every layout read lives here, never in render().
    let stepPx = 1;
    let vh = window.innerHeight;
    let indexPitch = 0;
    const measure = () => {
      vh = window.innerHeight;
      const h = frames[0]?.offsetHeight ?? 1;
      stepPx = h + (vh * GAP) / 100;
      indexPitch = indexBtns.length > 1 ? indexBtns[1].offsetTop - indexBtns[0].offsetTop : 0;
      if (marker && indexBtns[0]) marker.style.height = `${indexBtns[0].offsetHeight}px`;
    };
    measure();

    /* ──────────────────────────────────────────────────── the one writer */

    let lastP = 0;
    let lastActive = -1;
    const render = (p: number) => {
      lastP = p;
      strip.style.transform = `translate3d(0, ${(-p * stepPx).toFixed(2)}px, 0)`;

      if (!reduced) {
        // Slow pan: the picture drifts against the travel while its frame
        // crosses the viewport. While pinned, frame j's centre sits (j − p)
        // steps from the viewport centre — arithmetic, not a rect read.
        for (let j = 0; j < pans.length; j++) {
          const rel = Math.max(-1, Math.min(1, ((j - p) * stepPx) / vh));
          pans[j].style.transform = `translate3d(0, ${(rel * PAN).toFixed(3)}%, 0)`;
        }
      }

      if (marker) {
        marker.style.transform = `translate3d(0, ${(p * indexPitch).toFixed(2)}px, 0)`;
      }

      const active = Math.round(Math.min(N - 1, Math.max(0, p)));
      names.forEach((t, j) => {
        if (reduced) {
          t.style.opacity = j === active ? '1' : '0';
          t.style.visibility = j === active ? 'visible' : 'hidden';
          return;
        }
        const a = Math.abs(p - j);
        const FADE = 0.42;
        const vis = a >= FADE ? 0 : 1 - a / FADE;
        t.style.opacity = String(vis);
        t.style.visibility = vis > 0.02 ? 'visible' : 'hidden';
        // The focus pull: out of focus is blurred, in focus is sharp. Hidden
        // or settled names carry no filter at all.
        t.style.filter = vis >= 0.999 || vis <= 0.02 ? '' : `blur(${((1 - vis) * 7).toFixed(2)}px)`;
      });

      if (active !== lastActive) {
        lastActive = active;
        indexBtns.forEach((b, j) => {
          b.style.opacity = j === active ? '1' : '0.38';
        });
      }
    };

    /* ──────────────────────────────────────────────────────── behaviours */

    let trigger: ScrollTrigger | null = null;
    const reveals: { revert: () => void }[] = [];

    const scrollFor = (j: number) =>
      trigger ? trigger.start + (j / (N - 1)) * (trigger.end - trigger.start) : 0;

    const scrollToProject = (j: number) => {
      if (!trigger) return;
      const t = scrollFor(j);
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

    /* snap — through Lenis. Lenis is read lazily: the provider creates it in
       a parent effect, which runs after this child's layout effect. The
       scroll TARGET only changes on input, so "target unchanged for
       SNAP_IDLE ms" means the reader has let go, even while Lenis is still
       gliding; retargeting that glide keeps the motion continuous. */

    let lastTarget = NaN;
    let lastDir = 1;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      const lenis = getLenis();
      if (!lenis || !trigger || lenis.isStopped || lenis.isLocked) return;
      const { start, end } = trigger;
      const t = scrollTargetOf(lenis);
      // Outside the pin, or on its ends, the page scrolls freely.
      if (t <= start + 1 || t >= end - 1) return;
      const p = ((t - start) / (end - start)) * (N - 1);
      const idx =
        lastDir > 0
          ? Math.min(N - 1, Math.ceil(p - SNAP_COMMIT))
          : Math.max(0, Math.floor(p + SNAP_COMMIT));
      const dest = scrollFor(idx);
      if (Math.abs(dest - t) < 2) return;
      lenis.scrollTo(dest, { duration: 0.9, easing: easeOutCubic });
    };
    const armSnap = () => {
      if (reduced) return;
      const lenis = getLenis();
      if (!lenis) return;
      const t = scrollTargetOf(lenis);
      if (t === lastTarget) return;
      if (!Number.isNaN(lastTarget)) lastDir = Math.sign(t - lastTarget) || lastDir;
      lastTarget = t;
      clearTimeout(snapTimer);
      snapTimer = setTimeout(settle, SNAP_IDLE);
    };

    // Decode every render up front. Otherwise Chrome decodes a 1600px image
    // on the frame it first comes into view — mid-travel, as a dropped frame.
    scope.querySelectorAll<HTMLImageElement>('[data-pan] img').forEach((img) => {
      img.decode?.().catch(() => {});
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
        scrub: true,
        invalidateOnRefresh: true,
        onRefresh: () => {
          measure();
          render(lastP);
        },
        onUpdate: (self) => {
          render(self.progress * (N - 1));
          armSnap();
        },
      });
      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __projectsSt?: ScrollTrigger }).__projectsSt = trigger;
      }

      if (reduced) {
        render(0);
        return;
      }

      // The frames: the site's image entrance, one after the other. The
      // name block is small enough to take a real blur, cleared when it lands.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: scope, start: 'top 85%', once: true },
      });
      frames.forEach((frame, i) => {
        const reveal = stripReveal(frame, {
          scroll: false,
          settle: frame.querySelector('[data-settle]'),
        });
        reveals.push(reveal);
        tl.add(reveal.tl, i * 0.18);
      });
      tl.from(
        '[data-name-wrap]',
        {
          autoAlpha: 0,
          filter: 'blur(7px)',
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'filter',
        },
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
      reveals.forEach((r) => r.revert());
      ro.disconnect();
      clearTimeout(resizeTimer);
      clearTimeout(snapTimer);
      indexBtns.forEach((b) => b.removeEventListener('click', onIndexClick));
      nextBtn?.removeEventListener('click', onNext);
    };
  }, [N, projects]);

  if (N === 0) return null;

  return (
    <>
      <section
        data-nav="light"
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
                <Link
                  key={p._id}
                  href={projectHref(locale, p.slug.current)}
                  data-frame
                  onClick={(e) => openProject(e, j)}
                  aria-label={`Open ${displayTitle(p)}`}
                  className="block w-full cursor-pointer overflow-hidden"
                  style={{ aspectRatio: '3 / 2' }}
                >
                  <div data-settle className="h-full w-full">
                    <div data-pan className="relative h-full w-full will-change-transform">
                      <img
                        src={cloudinaryUrl(p.heroImageId, { width: 1600 })}
                        alt={displayTitle(p)}
                        loading="eager"
                        decoding="async"
                        className="h-[116%] w-full -translate-y-[7%] object-cover"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* The names and their particulars, standing over the film. Focus
              pull only. */}
          <div
            data-name-wrap
            className="pointer-events-none absolute left-[5.5vw] top-1/2 z-10 -translate-y-1/2"
          >
            {projects.map((p, j) => (
              <div
                key={p._id}
                data-name
                className={j === 0 ? 'relative' : 'absolute left-0 top-0'}
                style={{ opacity: j === 0 ? 1 : 0, visibility: j === 0 ? 'visible' : 'hidden' }}
              >
                <p
                  className="mb-5 font-mono text-[12px] tracking-[0.08em]"
                  style={{ color: 'rgba(17, 17, 17, 0.5)' }}
                >
                  <span style={{ color: INK }}>{pad2(j + 1)}</span>
                  <span className="mx-2">/</span>
                  {pad2(N)}
                </p>

                <h3 className="text-[clamp(1.9rem,3.4vw,4.2rem)] font-[300] leading-[1.14] tracking-[0.01em]">
                  <Link
                    href={projectHref(locale, p.slug.current)}
                    onClick={(e) => openProject(e, j)}
                    className="pointer-events-auto block cursor-pointer text-left"
                  >
                    {titleLines(p).map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </Link>
                </h3>

                <div className="mt-6 flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45em] block h-px w-8 shrink-0"
                    style={{ background: ACCENT }}
                  />
                  <div className="text-label uppercase" style={{ letterSpacing: '0.24em' }}>
                    <p>{STATUS_LABEL[p.status]}</p>
                    {p.location && (
                      <p className="mt-1.5" style={{ color: 'rgba(17, 17, 17, 0.5)' }}>
                        {p.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chrome: the index with its marker, and next. */}
          <nav
            data-quiet
            aria-label="Projects"
            className="absolute bottom-10 left-[5.5vw] z-10 flex items-stretch gap-4"
          >
            <span
              aria-hidden="true"
              className="relative block w-px"
              style={{ background: 'rgba(17, 17, 17, 0.14)' }}
            >
              <span
                ref={markerRef}
                data-marker
                className="absolute left-0 top-0 block w-px"
                style={{ background: ACCENT, height: '1.4em' }}
              />
            </span>
            <div className="flex flex-col items-start gap-2.5">
              {projects.map((p, j) => (
                <button
                  key={p._id}
                  type="button"
                  data-index={j}
                  className="cursor-pointer text-label"
                  style={{ opacity: j === 0 ? 1 : 0.38, letterSpacing: '0.3em' }}
                >
                  {shortName(p)}
                </button>
              ))}
            </div>
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
    </>
  );
}
