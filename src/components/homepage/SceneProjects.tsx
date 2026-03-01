'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface ProjectCard {
  id: string;
  title: string;
  type: string;
  status: 'completed' | 'in-progress';
  heroImageId: string;
  href: string;
  location: string;
}

const CARDS: ProjectCard[] = [
  {
    id: 'armonia',
    title: 'Armonia',
    type: 'Residential Development',
    status: 'completed',
    heroImageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day',
    href: '/en/projects/armonia',
    location: 'Lakatameia, Nicosia',
  },
  {
    id: 'almond',
    title: 'Almond',
    type: 'Residential Development',
    status: 'in-progress',
    heroImageId: 'clients/tdkdb/almond/renders/almond_front_angle_day',
    href: '/en/projects/almond',
    location: 'Nicosia',
  },
];

const STATUS_LABEL: Record<ProjectCard['status'], string> = {
  completed: 'Completed',
  'in-progress': 'In Progress',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SceneProjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const infoPanelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterSlotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Card 2 info panel starts opacity:0 via GSAP; reveal it immediately
      if (infoPanelRefs.current[1]) {
        (infoPanelRefs.current[1] as HTMLElement).style.opacity = '1';
        (infoPanelRefs.current[1] as HTMLElement).style.transform = 'none';
      }
      return;
    }

    const ctx = gsap.context(() => {
      // ── Set initial off-screen states before creating the timeline ──────────
      // Card 2 info panel starts hidden and offset downward
      if (infoPanelRefs.current[1]) {
        gsap.set(infoPanelRefs.current[1], { y: 40, opacity: 0 });
      }

      // ── Timeline scrubbed by ScrollTrigger ──────────────────────────────────
      // Duration:1 means all child tween positions are normalised 0–1.
      // The ScrollTrigger scrubs from 0 to 1 over 50 vh of scroll
      // (150 vh container − 100 vh sticky viewport = 50 vh scroll travel).
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      });

      // ── Main carousel: strip slides left ──────────────────────────────────
      tl.to(
        strip,
        {
          x: () => -(CARDS.length - 1) * window.innerWidth,
          ease: 'none',
          duration: 1,
        },
        0,
      );

      // ── "THE WORK" heading fades out quickly as carousel begins ──────────
      tl.to(headingRef.current, { opacity: 0, y: -14, ease: 'none', duration: 0.2 }, 0);

      // ── Parallax: images move at 0.7× the strip speed ────────────────────
      // Images are 130 % wide (left: −15 %) so they always cover their card
      // at the maximum offset of ±15 vw.
      //   Card 1: image drifts +15 vw (lags as card exits left)
      //   Card 2: image starts at −15 vw and returns to 0 (enters slightly slower)
      const parallaxDist = () => window.innerWidth * 0.15;

      const img1 = imageRefs.current[0];
      if (img1) {
        tl.to(img1, { x: parallaxDist, ease: 'none', duration: 1 }, 0);
      }

      const img2 = imageRefs.current[1];
      if (img2) {
        tl.fromTo(
          img2,
          { x: () => -window.innerWidth * 0.15 },
          { x: 0, ease: 'none', duration: 1 },
          0,
        );
      }

      // ── Counter slot: "01" → "02" (translateY flips slot items) ──────────
      // The slot div contains CARDS.length items each 13 px tall.
      // Translating to −50 % (= −13 px) reveals the second item.
      tl.to(counterSlotRef.current, { yPercent: -50, ease: 'none', duration: 0.2 }, 0.4);

      // ── Info panels: card 1 fades out, card 2 slides in ──────────────────
      const info1 = infoPanelRefs.current[0];
      if (info1) {
        tl.to(info1, { opacity: 0, y: 24, ease: 'none', duration: 0.2 }, 0.35);
      }

      const info2 = infoPanelRefs.current[1];
      if (info2) {
        tl.fromTo(
          info2,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, ease: 'none', duration: 0.25 },
          0.65,
        );
      }
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} style={{ height: '150vh' }}>
      <section className="sticky top-0 h-screen overflow-hidden bg-void">
        {/* ── Section label — fades out as carousel starts ── */}
        <div
          ref={headingRef}
          className="pointer-events-none absolute left-12 top-10 z-20 select-none"
        >
          <p className="text-label tracking-[0.3em] text-stone">THE WORK</p>
        </div>

        {/* ── Project counter — slot machine ── */}
        {/* Clipping wrapper shows one number at a time (text-mono = 13px) */}
        <div className="absolute right-12 top-10 z-20 flex items-baseline gap-2">
          <div className="overflow-hidden" style={{ height: '13px', lineHeight: '13px' }}>
            <div ref={counterSlotRef}>
              {CARDS.map((_, i) => (
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
            &thinsp;/&thinsp;{String(CARDS.length).padStart(2, '0')}
          </span>
        </div>

        {/* ── Carousel strip ── */}
        <div
          ref={stripRef}
          className="flex h-full"
          style={{
            width: `${CARDS.length * 100}vw`,
            willChange: 'transform',
          }}
        >
          {CARDS.map((card, i) => (
            <div key={card.id} className="relative h-full w-screen flex-shrink-0 overflow-hidden">
              {/* Full-bleed image — 130 % wide so parallax shift never exposes edges */}
              <img
                ref={(el) => {
                  imageRefs.current[i] = el;
                }}
                src={cloudinaryUrl(card.heroImageId, { width: 1920 })}
                alt=""
                aria-hidden="true"
                loading="lazy"
                fetchPriority="low"
                width={1920}
                height={1280}
                className="absolute top-0 h-full object-cover"
                style={{
                  width: '130%',
                  left: '-15%',
                  willChange: 'transform',
                }}
              />

              {/* Gradient scrim — heavier at bottom for text legibility */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.55) 100%)',
                }}
              />

              {/* Info panel — slides up 40 px on entry (handled by GSAP) */}
              <div
                ref={(el) => {
                  infoPanelRefs.current[i] = el;
                }}
                className="absolute bottom-14 left-12 z-10"
              >
                {/* Status */}
                <p
                  className="mb-4 text-label tracking-[0.3em]"
                  style={{
                    color:
                      card.status === 'completed' ? 'var(--color-threshold)' : 'var(--color-stone)',
                  }}
                >
                  {STATUS_LABEL[card.status]}
                </p>

                {/* Title */}
                <h2
                  className="font-sans font-[300] text-paper"
                  style={{
                    fontSize: 'clamp(48px, 6vw, 96px)',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                  }}
                >
                  {card.title}
                </h2>

                {/* Type & location */}
                <p className="mt-3 text-label tracking-[0.25em] text-stone">
                  {card.type}&ensp;—&ensp;{card.location}
                </p>

                {/* Ghost CTA */}
                <div className="mt-8">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-4 border px-8 py-4 text-label tracking-[0.25em] text-paper transition-colors duration-300"
                    style={{
                      borderColor: 'rgba(255,255,255,0.18)',
                    }}
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
                    <span
                      className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
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
