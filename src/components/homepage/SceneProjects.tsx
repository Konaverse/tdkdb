'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import type { Project } from '@/lib/sanity/types';

// ─── Component ────────────────────────────────────────────────────────────────

interface SceneProjectsProps {
  projects: Project[];
}

// Each "phase" (drift or transition) consumes this much scroll travel.
const PHASE_VH = 120;

export default function SceneProjects({ projects }: SceneProjectsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const infoPanelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterSlotRef = useRef<HTMLDivElement>(null);

  const count = projects.length;
  // Per-card cycle: drift → transition → drift → transition → … → drift.
  // For N cards: N drifts + (N-1) transitions = 2N-1 phases.
  const numPhases = Math.max(1, 2 * count - 1);
  const containerHeight = `${100 + numPhases * PHASE_VH}vh`;

  useLayoutEffect(() => {
    if (!count) return;
    gsapInit();

    const container = containerRef.current;
    const section = sectionRef.current;
    const strip = stripRef.current;
    if (!container || !section || !strip) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      infoPanelRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Info panels for non-first cards start hidden.
      for (let i = 1; i < count; i++) {
        if (infoPanelRefs.current[i]) {
          gsap.set(infoPanelRefs.current[i], { y: 40, opacity: 0 });
        }
      }

      const phaseLen = 1 / numPhases;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          pin: section,
          pinSpacing: false,
          invalidateOnRefresh: true,
        },
      });

      // ── "THE WORK" heading fades out early ───────────────────────────────
      tl.to(headingRef.current, { opacity: 0, y: -14, ease: 'none', duration: phaseLen * 0.3 }, 0);

      // ── Each card's drift phase: image drifts right 0 → +15vw ────────────
      // Phase 2i in the timeline (in [2i·phaseLen, (2i+1)·phaseLen]).
      for (let i = 0; i < count; i++) {
        const img = imageRefs.current[i];
        if (!img) continue;
        const driftStart = 2 * i * phaseLen;
        tl.fromTo(
          img,
          { x: 0 },
          {
            x: () => window.innerWidth * 0.15,
            ease: 'none',
            duration: phaseLen,
            immediateRender: false,
          },
          driftStart,
        );
      }

      // ── Transitions between cards (count - 1 of them) ────────────────────
      // Phase 2i+1: strip slides one viewport left, next card image
      // parallaxes in from -15vw to 0.
      for (let i = 0; i < count - 1; i++) {
        const transitionStart = (2 * i + 1) * phaseLen;

        // Strip slide
        tl.to(
          strip,
          { x: () => -(i + 1) * window.innerWidth, ease: 'none', duration: phaseLen },
          transitionStart,
        );

        // Incoming card image: parallax entry from -15vw → 0
        const nextImg = imageRefs.current[i + 1];
        if (nextImg) {
          tl.fromTo(
            nextImg,
            { x: () => -window.innerWidth * 0.15 },
            { x: 0, ease: 'none', duration: phaseLen },
            transitionStart,
          );
        }

        // Counter slot advances one item
        tl.to(
          counterSlotRef.current,
          {
            yPercent: -((i + 1) / count) * 100,
            ease: 'none',
            duration: phaseLen,
          },
          transitionStart,
        );

        // Outgoing card info fades out (first 40 % of transition)
        const outInfo = infoPanelRefs.current[i];
        if (outInfo) {
          tl.to(
            outInfo,
            { opacity: 0, y: 24, ease: 'none', duration: phaseLen * 0.4 },
            transitionStart,
          );
        }

        // Incoming card info fades in (last ~45 % of transition)
        const inInfo = infoPanelRefs.current[i + 1];
        if (inInfo) {
          tl.to(
            inInfo,
            { opacity: 1, y: 0, ease: 'none', duration: phaseLen * 0.45 },
            transitionStart + phaseLen * 0.55,
          );
        }
      }
    }, container);

    return () => ctx.revert();
  }, [count, numPhases]);

  if (!count) return null;

  return (
    <div ref={containerRef} style={{ height: containerHeight }}>
      <section ref={sectionRef} className="h-screen w-full overflow-hidden bg-void">
        {/* ── Section label ── */}
        <div
          ref={headingRef}
          className="pointer-events-none absolute left-12 top-10 z-20 select-none"
        >
          <p className="text-label tracking-[0.3em] text-stone">THE WORK</p>
        </div>

        {/* ── Slot-machine counter ── */}
        <div className="absolute right-12 top-10 z-20 flex items-baseline gap-2">
          <div className="overflow-hidden" style={{ height: '13px', lineHeight: '13px' }}>
            <div ref={counterSlotRef}>
              {projects.map((_, i) => (
                <div
                  key={i}
                  className="font-mono text-mono leading-none text-paper"
                  style={{ height: '13px' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
          <span className="font-mono text-mono text-stone">
            &thinsp;/&thinsp;{String(count).padStart(2, '0')}
          </span>
        </div>

        {/* ── Carousel strip ── */}
        <div
          ref={stripRef}
          className="flex h-full"
          style={{ width: `${count * 100}vw`, willChange: 'transform' }}
        >
          {projects.map((project, i) => (
            <div
              key={project._id}
              className="relative h-full w-screen flex-shrink-0 overflow-hidden"
            >
              {/* Full-bleed image — 130 % wide so parallax never exposes edges */}
              <img
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                src={cloudinaryUrl(project.heroImageId, { width: 1920 })}
                alt=""
                aria-hidden="true"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                width={1920}
                height={1280}
                className="absolute top-0 h-full object-cover"
                style={{ width: '130%', left: '-15%', willChange: 'transform' }}
              />

              {/* Gradient scrim */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)',
                }}
              />

              {/* Info panel */}
              <div
                ref={(el) => {
                  infoPanelRefs.current[i] = el;
                }}
                className="absolute bottom-14 left-12 z-10"
              >
                <p
                  className="mb-4 text-label tracking-[0.3em]"
                  style={{
                    color:
                      project.status === 'completed'
                        ? 'var(--color-threshold)'
                        : 'var(--color-stone)',
                  }}
                >
                  {project.status === 'completed' ? 'COMPLETED' : 'IN DEVELOPMENT'}
                </p>

                <h2
                  className="font-sans font-[300] text-paper"
                  style={{
                    fontSize: 'clamp(48px, 6vw, 96px)',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                  }}
                >
                  {project.title}
                </h2>

                <p className="mt-3 text-label tracking-[0.25em] text-stone">
                  {project.type}&ensp;—&ensp;{project.location}
                </p>

                <div className="mt-8">
                  <Link
                    href={`/en/projects/${project.slug.current}`}
                    data-cursor="view"
                    className="inline-flex items-center gap-4 border px-8 py-4 text-label tracking-[0.25em] text-paper transition-colors duration-300"
                    style={{ borderColor: 'rgba(255,255,255,0.18)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        'rgba(255,255,255,0.55)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor =
                        'rgba(255,255,255,0.18)';
                    }}
                  >
                    VIEW PROJECT
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
