'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import type { Project } from '@/lib/sanity/types';
import { BEATS, IMAGES } from './SceneAbout';

/* ───────────────────────────────────────────────────────────────────────────
   HomepageReel — About → Projects, one continuous pinned reel.

   The whole About→Projects experience lives in ONE pinned stage driven by ONE
   master timeline, so there is NO seam between them:

     · About's five clip-path "plate" wipes play first (ported verbatim).
     · With zero gap, in the same pin, the Projects beats slide in from the
       right over About's last frame — which drifts left (slower) for parallax.
     · The fixed `TDKDB` title (z-50) fades out exactly at the boundary, so the
       whole reel can share one stacking context (the title can't be both below
       About and above Projects, so we retire it as Projects takes over).

   DESKTOP (lg+): horizontal 300vw-per-project reel inside the pin.
   MOBILE/TABLET (<lg): About wipes pin, then a vertical Projects stack flows
   after (no horizontal scroll); md gets a 2-column layout.
   ─────────────────────────────────────────────────────────────────────────── */

interface HomepageReelProps {
  projects: Project[];
}

const BEAT_BG = 'var(--color-void)';

// ── Pacing — tune live in `pnpm dev` ───────────────────────────────────────
const ABOUT_END_VH = 820; // About's scroll budget (preserves its original feel)
const PROJECT_BEAT_VH = 460; // scroll per project beat — larger = gentler
const SCRUB = 1.6; // ScrollTrigger smoothing (higher = softer)
const ABOUT_DRIFT = 0.4; // how far About's last frame drifts left during handoff

// About wipe cadence (ported from SceneAbout, unchanged).
const REVEAL = 1.15;
const DWELL = 0.35;
const STEP = REVEAL + DWELL;
const DRIFT = STEP + REVEAL;

const statusLabel = (s: Project['status']) =>
  s === 'completed' ? 'COMPLETED' : s === 'in-progress' ? 'IN DEVELOPMENT' : 'UPCOMING';
const statusColor = (s: Project['status']) =>
  s === 'completed' ? 'var(--color-threshold)' : 'var(--color-stone)';

export default function HomepageReel({ projects }: HomepageReelProps) {
  const count = projects.length;

  // Stage / About refs
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const aboutTrackRef = useRef<HTMLDivElement>(null);
  const aboutWrapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const aboutImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const aboutTxtRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Projects (desktop) refs
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mainImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  // Mobile vertical scope
  const verticalRef = useRef<HTMLDivElement>(null);

  const [reduced, setReduced] = useState(false);

  // Derived pacing — keep About at ABOUT_END_VH, map Projects at the same rate.
  const aboutDur = (BEATS.length - 1) * STEP + DRIFT;
  const unitVh = ABOUT_END_VH / aboutDur;
  const perBeatUnits = count ? PROJECT_BEAT_VH / unitVh : 0;
  const ENTER = perBeatUnits / 3;
  const TRAVERSE = (perBeatUnits * 2) / 3;
  const totalVh = ABOUT_END_VH + count * PROJECT_BEAT_VH;
  const aboutFraction = ABOUT_END_VH / totalVh;

  // ── Master timeline (About wipes → Projects horizontal) ───────────────────
  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    ScrollTrigger.config({ ignoreMobileResize: true });

    // Reduced motion — no pin; About plates flow vertically, Projects stacks.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true);
      stage.style.height = 'auto';
      if (aboutTrackRef.current) aboutTrackRef.current.style.position = 'static';
      aboutWrapRefs.current.forEach((w) => {
        if (!w) return;
        w.style.position = 'relative';
        w.style.height = '100svh';
        w.style.clipPath = 'none';
      });
      return;
    }

    // Pull the stage up over the hero's 100vh so the first wipe starts at once.
    section.style.marginTop = '-100vh';

    const W = () => window.innerWidth;
    const title = document.querySelector<HTMLElement>('#hero-title-layer');

    const mm = gsap.matchMedia();

    // Shared: the About plate wipes (identical on every breakpoint).
    const buildAbout = (tl: gsap.core.Timeline) => {
      let t = 0;
      BEATS.forEach((beat, i) => {
        const wrap = aboutWrapRefs.current[i];
        const img = aboutImgRefs.current[i];
        const txt = aboutTxtRefs.current[i];
        const s = beat.sign;
        if (wrap) {
          tl.fromTo(
            wrap,
            { clipPath: beat.hidden },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'sine.inOut', duration: REVEAL },
            t,
          );
        }
        if (img) tl.fromTo(img, { yPercent: 8 * s }, { yPercent: -8 * s, duration: DRIFT }, t);
        if (txt) {
          tl.fromTo(
            txt,
            { y: () => -window.innerHeight * 0.06 * s },
            { y: () => window.innerHeight * 0.06 * s, duration: DRIFT },
            t,
          );
        }
        t += STEP;
      });
      return t;
    };

    // ── DESKTOP: About + horizontal Projects in one pinned timeline ─────────
    mm.add('(min-width: 1024px)', () => {
      if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 0 });
      if (title) gsap.set(title, { opacity: 1 });

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
            const pp = (self.progress - aboutFraction) / (1 - aboutFraction);
            const idx = Math.min(count - 1, Math.max(0, Math.floor(pp * count)));
            counterRef.current.textContent = String(idx + 1).padStart(2, '0');
          },
        },
      });

      buildAbout(tl);

      // Boundary: the first beat slides in from the right and "wipes" the hero
      // title away in sync — clip the title's right edge leftward exactly as the
      // panel covers (so the panel shows through), while it dissolves (opacity).
      // The title layer is full-viewport, so the clip % tracks the panel edge.
      if (title) {
        tl.fromTo(
          title,
          { clipPath: 'inset(0% 0% 0% 0%)' },
          { clipPath: 'inset(0% 100% 0% 0%)', duration: ENTER },
          aboutDur,
        );
        tl.to(title, { opacity: 0, duration: ENTER }, aboutDur);
      }
      if (overlayRef.current) {
        tl.to(overlayRef.current, { opacity: 1, duration: perBeatUnits * 0.4 }, aboutDur);
      }

      // About's last frame drifts left (slower) as the first beat covers it.
      if (aboutTrackRef.current) {
        tl.to(aboutTrackRef.current, { x: () => -ABOUT_DRIFT * W(), duration: ENTER }, aboutDur);
      }

      projects.forEach((_, i) => {
        const beat = beatRefs.current[i];
        const img = mainImgRefs.current[i];
        if (!beat) return;
        const beatStart = aboutDur + i * perBeatUnits;

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
          tl.fromTo(img, { xPercent: 6 }, { xPercent: -6, duration: perBeatUnits }, beatStart);
        }
      });
    });

    // ── MOBILE / TABLET: About wipes pin only, title fades at the end ───────
    mm.add('(max-width: 1023px)', () => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${ABOUT_END_VH}%`,
          scrub: SCRUB,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      const end = buildAbout(tl);
      if (title) tl.to(title, { opacity: 0, duration: DWELL }, end - REVEAL);
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
      {/* ════════════════════ PINNED STAGE (z-10, below hero title) ═════════ */}
      <section ref={sectionRef} className="relative z-10 w-full">
        <div ref={stageRef} className="relative h-screen w-full overflow-hidden">
          {/* ── About plates (drift track) ── */}
          <div ref={aboutTrackRef} className="absolute inset-0">
            {BEATS.map((beat, i) => (
              <div
                key={beat.index}
                ref={(el) => {
                  aboutWrapRefs.current[i] = el;
                }}
                className="absolute inset-0 overflow-hidden bg-white will-change-[clip-path]"
                style={{ zIndex: 10 + i, clipPath: beat.hidden }}
              >
                <div className={beat.imgWrap}>
                  <img
                    ref={(el) => {
                      aboutImgRefs.current[i] = el;
                    }}
                    src={IMAGES[i]}
                    alt={`TDK — ${beat.name}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    className="absolute left-0 top-[-15%] h-[130%] w-full object-cover will-change-transform"
                  />
                </div>

                {beat.scrim === 'mobile-top' && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white via-white/85 to-transparent lg:hidden" />
                )}
                {beat.scrim === 'full' && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55" />
                )}
                {beat.scrim === 'desktop-bottom' && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[55%] bg-gradient-to-t from-black/60 via-black/15 to-transparent lg:block" />
                )}

                <div
                  ref={(el) => {
                    aboutTxtRefs.current[i] = el;
                  }}
                  className={`${beat.txtWrap} will-change-transform`}
                >
                  <div className={beat.textClass}>
                    <p className="max-w-[42ch] text-base font-normal leading-relaxed xl:text-lg 2xl:text-xl">
                      {beat.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Projects horizontal beats (desktop only) ── */}
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
