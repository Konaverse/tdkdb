'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import type { Project } from '@/lib/sanity/types';
import { ABOUT_HANDOFF_IMAGE } from './SceneAbout';

/* ───────────────────────────────────────────────────────────────────────────
   SceneProjectsHorizontal — "The Work" horizontal reel

   DESKTOP (lg+): a pinned, horizontally-scrolled sequence. One "beat" per
   project, each 300vw wide, stacked absolutely with rising z-index on its own
   shade of black. A beat slides in from the right (covering the previous one),
   traverses its three viewports, then the next beat slides over it while the
   leaving beat keeps drifting left at a SLOWER rate → stacked parallax.

   Per-beat 300vw layout (split into three 100vw viewports):
     0–50vw    intro paragraph (top) + project title (bottom)
     50–150vw  main landscape image (parallax)
     150–200vw mid paragraph (near image bottom-right) + location (top)
     200–250vw 2×2 grid: features (R1C1) · landscape img (R2C1) · portrait (C2)
     250–300vw closing paragraph + CTA → /projects

   TABLET (md–lg) & MOBILE (<md): no horizontal scroll. Each beat collapses to
   a vertical editorial section on its black shade; md gets a 2-column layout,
   base is single-column. Images parallax vertically; text fades up on reveal.
   ─────────────────────────────────────────────────────────────────────────── */

interface SceneProjectsHorizontalProps {
  projects: Project[];
}

// Every beat shares the same black — the section reads as one continuous void.
const BEAT_BG = 'var(--color-void)';

// Timeline units per beat: slides in (ENTER) then traverses 200vw (TRAVERSE).
const ENTER = 1;
const TRAVERSE = 2;
// Scroll travel each beat consumes. Larger = gentler, slower horizontal pace.
const BEAT_VH = 440;
// ScrollTrigger scrub smoothing (seconds of catch-up). Higher = softer.
const SCRUB = 2;

// ── About → Projects handoff (desktop) — tune live in `pnpm dev` ───────────
// Pull the pinned section up over the trailing viewport of SceneAbout's
// pin-spacer (its element height) so Projects pins exactly as About releases —
// killing the dead vertical scroll between the two sections.
const HANDOFF_VH = 100;
// Fraction of the viewport width the About backdrop drifts LEFT during the
// handoff — slower than the incoming beat (which covers a full viewport).
const ABOUT_DRIFT = 0.4;

const statusLabel = (s: Project['status']) =>
  s === 'completed' ? 'COMPLETED' : s === 'in-progress' ? 'IN DEVELOPMENT' : 'UPCOMING';
const statusColor = (s: Project['status']) =>
  s === 'completed' ? 'var(--color-threshold)' : 'var(--color-stone)';

export default function SceneProjectsHorizontal({ projects }: SceneProjectsHorizontalProps) {
  const count = projects.length;

  // Desktop refs
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Vertical (mobile/tablet) scope
  const verticalRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);

  // ── Desktop horizontal timeline ──────────────────────────────────────────
  useLayoutEffect(() => {
    if (!count) return;
    gsapInit();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const container = containerRef.current;
      const section = sectionRef.current;
      if (!container || !section) return;

      const W = () => window.innerWidth;

      // ── About → Projects handoff ───────────────────────────────────────
      // The section pins the instant SceneAbout ends, and its opening frame is
      // a copy of About's last image — so the pin engages invisibly (no vertical
      // reveal). That backdrop then drifts LEFT (slower) while beat 0 slides in
      // from the right over it → the horizontal handoff with parallax.
      if (backdropRef.current) {
        gsap.set(backdropRef.current, { x: 0 });
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB,
          pin: section,
          pinSpacing: false,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!counterRef.current) return;
            const idx = Math.min(count - 1, Math.floor(self.progress * count));
            counterRef.current.textContent = String(idx + 1).padStart(2, '0');
          },
        },
      });

      let t = 0;
      projects.forEach((_, i) => {
        const beat = beatRefs.current[i];
        const img = mainImgRefs.current[i];
        if (!beat) return;

        const beatStart = t;

        // Beat 0 = the handoff: drift the About backdrop left, slower than the
        // incoming beat, as beat 0 covers it.
        if (i === 0 && backdropRef.current) {
          tl.to(backdropRef.current, { x: () => -ABOUT_DRIFT * W(), duration: ENTER }, 0);
        }

        // Slide in from the right, covering the previous beat. Every beat starts
        // off-screen right (immediateRender) so only the backdrop shows at first.
        tl.fromTo(beat, { x: () => W() }, { x: 0, duration: ENTER }, beatStart);

        // The leaving beat keeps drifting left, but slower → parallax.
        if (i > 0) {
          tl.to(
            beatRefs.current[i - 1],
            { x: () => -2 * W() - 0.32 * W(), duration: ENTER },
            beatStart,
          );
        }

        // Traverse this beat's middle + last viewports (0 → -200vw).
        tl.to(beat, { x: () => -2 * W(), duration: TRAVERSE }, beatStart + ENTER);

        // Subtle parallax on the main image across the whole active span.
        if (img) {
          tl.fromTo(img, { xPercent: 6 }, { xPercent: -6, duration: ENTER + TRAVERSE }, beatStart);
        }

        t += ENTER + TRAVERSE;
      });
    });

    return () => mm.revert();
  }, [count, projects]);

  // ── Mobile / tablet reveals + vertical parallax ───────────────────────────
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

  if (!count) return null;

  const projectHref = (p: Project) => `/en/projects/${p.slug.current}`;

  // Long titles drop a size step and are allowed to wrap to two lines.
  const titleSize = (title: string) =>
    title.length > 9 ? 'clamp(40px, 5vw, 84px)' : 'clamp(52px, 7vw, 120px)';

  return (
    <>
      {/* ════════════ MOBILE + TABLET — vertical editorial stack ════════════ */}
      <div ref={verticalRef} className={reduced ? 'block' : 'block lg:hidden'}>
        <div className="bg-void px-6 pb-10 pt-24 sm:px-8">
          <p className="text-label tracking-[0.3em] text-stone">THE WORK</p>
        </div>

        {projects.map((p, i) => {
          const main = p.heroImageId;
          const grid = p.homepageGridImageId;
          const portrait = p.homepagePortraitImageId;

          return (
            <section
              key={p._id}
              className="px-6 py-20 sm:px-8 md:py-28"
              style={{ backgroundColor: BEAT_BG }}
            >
              {/* Status + Title */}
              <div data-reveal>
                <p
                  className="mb-4 text-label tracking-[0.3em]"
                  style={{ color: statusColor(p.status) }}
                >
                  {statusLabel(p.status)}
                </p>
                <h2
                  className="font-sans font-[300] leading-[0.95] text-paper"
                  style={{ fontSize: 'clamp(40px, 11vw, 80px)', letterSpacing: '0.02em' }}
                >
                  {p.title}
                </h2>
              </div>

              {/* Intro */}
              {p.homepageIntro && (
                <p data-reveal className="mt-6 max-w-[48ch] text-body text-stone md:mt-8">
                  {p.homepageIntro}
                </p>
              )}

              {/* Main image */}
              {main && (
                <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden md:mt-14">
                  <img
                    data-vparallax
                    src={cloudinaryUrl(main, { width: 1400 })}
                    alt={p.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="absolute left-0 top-[-7%] h-[114%] w-full object-cover"
                  />
                </div>
              )}

              {/* Mid paragraph + location */}
              <div className="mt-10 md:grid md:grid-cols-2 md:gap-x-10">
                {p.homepageParagraphMid && (
                  <p data-reveal className="max-w-[48ch] text-body text-stone">
                    {p.homepageParagraphMid}
                  </p>
                )}
                <p data-reveal className="mt-6 text-label tracking-[0.25em] text-stone md:mt-0">
                  {p.location}
                </p>
              </div>

              {/* Features + grid/portrait imagery */}
              <div className="mt-12 md:grid md:grid-cols-2 md:gap-8">
                <div>
                  {p.features && p.features.length > 0 && (
                    <ul data-reveal className="space-y-3">
                      {p.features.map((f, fi) => (
                        <li
                          key={fi}
                          className="border-b border-white/10 pb-3 text-body-lg font-[300] text-paper"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {grid && (
                    <div className="relative mt-8 aspect-[4/3] w-full overflow-hidden">
                      <img
                        data-vparallax
                        src={cloudinaryUrl(grid, { width: 900 })}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="absolute left-0 top-[-7%] h-[114%] w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                {portrait && (
                  <div className="relative mt-8 aspect-[3/4] w-full overflow-hidden md:mt-0">
                    <img
                      data-vparallax
                      src={cloudinaryUrl(portrait, { width: 900 })}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute left-0 top-[-7%] h-[114%] w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Closing paragraph + CTA */}
              <div data-reveal className="mt-14">
                {p.homepageParagraphClose && (
                  <p className="max-w-[52ch] text-body text-stone">{p.homepageParagraphClose}</p>
                )}
                <Link
                  href={projectHref(p)}
                  data-cursor="view"
                  className="mt-8 inline-flex items-center gap-4 border border-white/20 px-8 py-4 text-label tracking-[0.25em] text-paper transition-colors duration-300 hover:border-white/55"
                >
                  VIEW PROJECT
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      {/* ════════════════════ DESKTOP — horizontal reel ════════════════════ */}
      <div
        ref={containerRef}
        className={reduced ? 'hidden' : 'hidden lg:block'}
        style={{ height: `${count * BEAT_VH}vh`, marginTop: `-${HANDOFF_VH}vh` }}
      >
        <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-void">
          {/* Handoff backdrop — a copy of SceneAbout's last frame so the pin
              engages invisibly; drifts left as beat 0 slides in over it. */}
          <div ref={backdropRef} className="absolute inset-0 z-[1] will-change-transform">
            <img
              src={ABOUT_HANDOFF_IMAGE}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Beats */}
          {projects.map((p, i) => {
            const main = p.heroImageId;
            const grid = p.homepageGridImageId;
            const portrait = p.homepagePortraitImageId;

            return (
              <div
                key={p._id}
                ref={(el) => {
                  beatRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 h-screen will-change-transform"
                style={{ width: '300vw', zIndex: 10 + i, backgroundColor: BEAT_BG }}
              >
                {/* ── Zone 0–50vw — intro (top) + title (bottom) ── */}
                <div
                  className="absolute left-0 top-32"
                  style={{ width: '50vw', paddingLeft: '3rem', paddingRight: '2rem' }}
                >
                  {p.homepageIntro && (
                    <p className="max-w-[40ch] text-body text-stone">{p.homepageIntro}</p>
                  )}
                </div>
                <div
                  className="absolute bottom-16 left-0"
                  style={{ width: '50vw', paddingLeft: '3rem', paddingRight: '2rem' }}
                >
                  <p
                    className="mb-4 text-label tracking-[0.3em]"
                    style={{ color: statusColor(p.status) }}
                  >
                    {statusLabel(p.status)}
                  </p>
                  <h2
                    className="font-sans font-[300] text-paper"
                    style={{
                      fontSize: titleSize(p.title),
                      letterSpacing: '0.02em',
                      lineHeight: 0.95,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {p.title}
                  </h2>
                </div>

                {/* ── Zone 50–150vw — main image (parallax) ── */}
                {main && (
                  <div
                    className="absolute top-0 h-screen overflow-hidden"
                    style={{ left: '50vw', width: '100vw' }}
                  >
                    <img
                      ref={(el) => {
                        mainImgRefs.current[i] = el;
                      }}
                      src={cloudinaryUrl(main, { width: 1920 })}
                      alt={p.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'low'}
                      className="absolute top-0 h-full object-cover will-change-transform"
                      style={{ width: '114%', left: '-7%' }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(0,0,0,0.35), transparent 25%, transparent 75%, rgba(0,0,0,0.35))',
                      }}
                    />
                  </div>
                )}

                {/* ── Zone 150–200vw — mid paragraph (bottom) + location (top) ── */}
                <div className="absolute top-32" style={{ left: '170vw', width: '28vw' }}>
                  <p className="text-label tracking-[0.25em] text-stone">{p.location}</p>
                </div>
                {p.homepageParagraphMid && (
                  <div className="absolute bottom-20" style={{ left: '152vw', width: '40vw' }}>
                    <p className="max-w-[44ch] text-body text-stone">{p.homepageParagraphMid}</p>
                  </div>
                )}

                {/* ── Zone 200–250vw — 2×2 grid (~80vh) ── */}
                <div
                  className="absolute"
                  style={{ left: '203vw', width: '44vw', top: '10vh', height: '80vh' }}
                >
                  <div className="grid h-full grid-cols-2 grid-rows-2 gap-5">
                    {/* R1C1 — features */}
                    <div className="flex flex-col justify-center">
                      {p.features && p.features.length > 0 && (
                        <ul className="space-y-3">
                          {p.features.slice(0, 5).map((f, fi) => (
                            <li
                              key={fi}
                              className="border-b border-white/10 pb-2 text-body font-[300] text-paper"
                            >
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* C2 (rows 1–2) — portrait */}
                    {portrait && (
                      <div className="relative row-span-2 overflow-hidden">
                        <img
                          src={cloudinaryUrl(portrait, { width: 1000 })}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                    {/* R2C1 — landscape */}
                    {grid && (
                      <div className="relative overflow-hidden">
                        <img
                          src={cloudinaryUrl(grid, { width: 1000 })}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Zone 250–300vw — closing paragraph + CTA ── */}
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: '256vw', width: '40vw' }}
                >
                  {p.homepageParagraphClose && (
                    <p className="max-w-[46ch] text-body-lg text-stone">
                      {p.homepageParagraphClose}
                    </p>
                  )}
                  <Link
                    href={projectHref(p)}
                    data-cursor="view"
                    className="mt-10 inline-flex items-center gap-4 border border-white/20 px-9 py-4 text-label tracking-[0.25em] text-paper transition-colors duration-300 hover:border-white/55"
                  >
                    VIEW PROJECT
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* ── Fixed overlays (stay put while beats translate) ── */}
          <div className="pointer-events-none absolute left-12 top-10 z-[100] select-none">
            <p className="text-label tracking-[0.3em] text-stone">THE WORK</p>
          </div>
          <div className="absolute right-12 top-10 z-[100] flex items-baseline gap-2">
            <span ref={counterRef} className="font-mono text-mono text-paper">
              01
            </span>
            <span className="font-mono text-mono text-stone">
              &thinsp;/&thinsp;{String(count).padStart(2, '0')}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
