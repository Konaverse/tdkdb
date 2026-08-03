'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   HomepageReel — the Projects reel.

   This used to open with five pinned clip-path "About plates" before handing
   off to Projects inside the same pin. Those plates were replaced by
   `AboutGrid`, a flat, un-pinned section that now sits above this one — so all
   that remains here is the Projects reel itself.

   DESKTOP (lg+): one pinned stage, horizontal 300vw-per-project reel.
   MOBILE/TABLET (<lg): no pin at all — a plain vertical stack (below).
   ─────────────────────────────────────────────────────────────────────────── */

interface HomepageReelProps {
  projects: Project[];
}

const BEAT_BG = 'var(--color-void)';

// ── Pacing — tune live in `pnpm dev` ───────────────────────────────────────
const PROJECT_BEAT_VH = 460; // scroll per project beat — larger = gentler
const SCRUB = 1.6; // ScrollTrigger smoothing (higher = softer)

// Each project beat is one timeline unit: a third to slide in, two thirds to
// traverse its own 300vw of content.
const ENTER = 1 / 3;
const TRAVERSE = 2 / 3;

const statusLabel = (s: Project['status']) =>
  s === 'completed' ? 'COMPLETED' : s === 'in-progress' ? 'IN DEVELOPMENT' : 'UPCOMING';
const statusColor = (s: Project['status']) =>
  s === 'completed' ? 'var(--color-threshold)' : 'var(--color-stone)';

export default function HomepageReel({ projects }: HomepageReelProps) {
  const count = projects.length;

  // Stage refs
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Projects (desktop) refs
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  // Mobile vertical scope
  const verticalRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);

  const totalVh = count * PROJECT_BEAT_VH;

  // ── Master timeline (horizontal Projects reel, desktop only) ──────────────
  useLayoutEffect(() => {
    gsapInit();
    const stage = stageRef.current;
    if (!stage || !count) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    // Reduced motion — no pin, no horizontal reel; the vertical stack below
    // becomes the only rendering of Projects at every breakpoint.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      return;
    }

    const W = () => window.innerWidth;
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${totalVh}%`,
          scrub: SCRUB,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!counterRef.current) return;
            const idx = Math.min(count - 1, Math.max(0, Math.floor(self.progress * count)));
            counterRef.current.textContent = String(idx + 1).padStart(2, '0');
          },
        },
      });

      // The "THE WORK" chrome used to fade in at the About→Projects boundary.
      // With About gone there is no boundary, so it simply arrives with beat 01.
      if (overlayRef.current) tl.to(overlayRef.current, { opacity: 1, duration: ENTER }, 0);

      projects.forEach((_, i) => {
        const beat = beatRefs.current[i];
        const img = mainImgRefs.current[i];
        if (!beat) return;
        const beatStart = i;

        // Slide in from the right (every beat starts off-screen right).
        tl.fromTo(beat, { x: () => W() }, { x: 0, duration: ENTER }, beatStart);

        // Leaving beat keeps drifting left, slower → parallax.
        if (i > 0) {
          tl.to(
            beatRefs.current[i - 1],
            { x: () => -2 * W() - 0.32 * W(), duration: ENTER },
            beatStart,
          );
        }

        // Traverse this beat's middle + last viewports.
        tl.to(beat, { x: () => -2 * W(), duration: TRAVERSE }, beatStart + ENTER);

        if (img) {
          tl.fromTo(img, { xPercent: 6 }, { xPercent: -6, duration: 1 }, beatStart);
        }
      });
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
  const titleSize = (title: string) =>
    title.length > 9 ? 'clamp(40px, 5vw, 84px)' : 'clamp(52px, 7vw, 120px)';

  return (
    <>
      {/* ════════════════════ PINNED STAGE — desktop only ═══════════════════
          Below `lg` (and under reduced motion) this renders nothing at all, so
          it must not occupy a viewport of empty scroll. */}
      <section
        ref={sectionRef}
        className={reduced || !count ? 'hidden' : 'relative z-10 hidden w-full lg:block'}
      >
        <div ref={stageRef} className="relative h-screen w-full overflow-hidden bg-void">
          {/* ── Projects horizontal beats ── */}
          {!reduced &&
            projects.map((p, i) => {
              const main = p.heroImageId;
              const grid = p.homepageGridImageId;
              const portrait = p.homepagePortraitImageId;

              return (
                <div
                  key={p._id}
                  ref={(el) => {
                    beatRefs.current[i] = el;
                  }}
                  className="absolute left-0 top-0 hidden h-screen will-change-transform lg:block"
                  style={{ width: '300vw', zIndex: 40 + i, backgroundColor: BEAT_BG }}
                >
                  {/* Zone 0–50vw — intro (top) + title (bottom) */}
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

                  {/* Zone 50–150vw — main image (parallax) */}
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
                        loading="lazy"
                        className="absolute top-0 h-full max-w-none object-cover will-change-transform"
                        style={{ width: '130%', left: '-15%' }}
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

                  {/* Zone 150–200vw — mid paragraph (bottom) + location (top) */}
                  <div className="absolute top-32" style={{ left: '170vw', width: '28vw' }}>
                    <p className="text-label tracking-[0.25em] text-stone">{p.location}</p>
                  </div>
                  {p.homepageParagraphMid && (
                    <div className="absolute bottom-20" style={{ left: '152vw', width: '40vw' }}>
                      <p className="max-w-[44ch] text-body text-stone">{p.homepageParagraphMid}</p>
                    </div>
                  )}

                  {/* Zone 200–250vw — 2×2 grid */}
                  <div
                    className="absolute"
                    style={{ left: '203vw', width: '44vw', top: '10vh', height: '80vh' }}
                  >
                    <div className="grid h-full grid-cols-2 grid-rows-2 gap-5">
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

                  {/* Zone 250–300vw — closing paragraph + CTA */}
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

          {/* ── Desktop overlays (fade in at the boundary) ── */}
          {count > 0 && !reduced && (
            <div ref={overlayRef} className="hidden lg:block">
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
            </div>
          )}
        </div>
      </section>

      {/* ════════════ MOBILE + TABLET — vertical Projects stack ═════════════ */}
      {count > 0 && (
        <div
          ref={verticalRef}
          className={
            reduced ? 'relative z-[60] block bg-void' : 'relative z-[60] block bg-void lg:hidden'
          }
        >
          <div className="px-6 pb-10 pt-20 sm:px-8">
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

                {p.homepageIntro && (
                  <p data-reveal className="mt-6 max-w-[48ch] text-body text-stone md:mt-8">
                    {p.homepageIntro}
                  </p>
                )}

                {main && (
                  <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden md:mt-14">
                    <img
                      data-vparallax
                      src={cloudinaryUrl(main, { width: 1400 })}
                      alt={p.title}
                      loading="lazy"
                      className="absolute left-0 top-[-15%] h-[130%] w-full object-cover"
                    />
                  </div>
                )}

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
                          className="absolute left-0 top-[-15%] h-[130%] w-full object-cover"
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
                        className="absolute left-0 top-[-15%] h-[130%] w-full object-cover"
                      />
                    </div>
                  )}
                </div>

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
      )}
    </>
  );
}
