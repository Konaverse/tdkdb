'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useLayoutEffect } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

// Dynamic import — Three.js / WebGL must never run server-side
const InfiniteGallery = dynamic(() => import('@/components/ui/InfiniteGallery'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-void" />,
});

// ─── Content ──────────────────────────────────────────────────────────────────

const GALLERY_IMAGES = [
  {
    src: cloudinaryUrl('clients/tdkdb/philosophy/concrete-textiure', { width: 1000, quality: 80 }),
    alt: '',
  },
  {
    src: cloudinaryUrl('clients/tdkdb/philosophy/floor-plan-hands', { width: 1000, quality: 80 }),
    alt: '',
  },
  {
    src: cloudinaryUrl('clients/tdkdb/philosophy/window-frame', { width: 1000, quality: 80 }),
    alt: '',
  },
  {
    src: cloudinaryUrl('clients/tdkdb/philosophy/light-shafts', { width: 1000, quality: 80 }),
    alt: '',
  },
  { src: cloudinaryUrl('clients/tdkdb/armonia/exterior/1', { width: 1000, quality: 80 }), alt: '' },
];

interface Statement {
  line1: string;
  line2: string;
  subtitle?: string;
  isArmonia?: boolean;
}

const STATEMENTS: Statement[] = [
  {
    line1: "We don't build buildings.",
    line2: 'We build the conditions for life.',
  },
  {
    line1: 'Architecture is not decoration.',
    line2: 'It is decision-making made visible.',
  },
  {
    line1: 'Every project begins with a question:',
    line2: 'How should this family live?',
  },
  {
    line1: 'TDK was founded on one belief:',
    line2: 'Good design is non-negotiable.',
  },
  {
    line1: 'This is what we build.',
    line2: 'ARMONIA.',
    subtitle: 'Lakatameia, Nicosia.',
    isArmonia: true,
  },
];

// 1000 vh total → 900 vh of scroll travel
// First 35% (315 vh) is a dead zone anchored on statement 0 to absorb hero pin momentum.
// Remaining 65% (585 vh) cycles through all 5 statements → ~117 vh per statement.
const CONTAINER_HEIGHT = `${STATEMENTS.length * 140}vh`;
const SCROLL_BUFFER = 0.35;

// Fade-in duration for each new statement (ms)
const FADE_DURATION = 450;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScenePhilosophy() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  // Ref mirror to avoid stale closure in ST callback
  const activeIdxRef = useRef(0);

  useLayoutEffect(() => {
    gsapInit();

    const container = containerRef.current;
    if (!container) return;

    // Defer origin mount until section is 2.5 screens away to pre-load textures and shaders safely
    const galleryMountObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMounted(true);
          galleryMountObserver.disconnect();
        }
      },
      { rootMargin: '250% 0px' },
    );
    galleryMountObserver.observe(container);

    // Toggle WebGL render loop (frameloop): pause when completely out of view to save GPU cycles
    // but keep textures loaded in VRAM for instant return.
    const pauseObserver = new IntersectionObserver(
      ([entry]) => {
        setIsPaused(!entry.isIntersecting);
      },
      { rootMargin: '50% 0px' },
    );
    pauseObserver.observe(container);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {
        galleryMountObserver.disconnect();
        pauseObserver.disconnect();
      };
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',

        onUpdate: (self) => {
          // Dead zone: first SCROLL_BUFFER of travel stays on statement 0,
          // absorbing Lenis momentum from the hero pin release.
          // Remaining travel is divided evenly across all statements.
          const adjusted = Math.max(0, (self.progress - SCROLL_BUFFER) / (1 - SCROLL_BUFFER));
          const newIdx = Math.min(Math.floor(adjusted * STATEMENTS.length), STATEMENTS.length - 1);

          if (newIdx === activeIdxRef.current) return;
          activeIdxRef.current = newIdx;
          setActiveIdx(newIdx);
        },

        onLeaveBack: () => {
          if (activeIdxRef.current === 0) return;
          activeIdxRef.current = 0;
          setActiveIdx(0);
        },
      });
    }, container);

    return () => {
      galleryMountObserver.disconnect();
      pauseObserver.disconnect();
      ctx.revert();
    };
  }, []);

  const statement = STATEMENTS[activeIdx];

  return (
    // Tall container gives the page scroll travel; sticky section holds position
    <div ref={containerRef} style={{ height: CONTAINER_HEIGHT }}>
      <section className="sticky top-0 h-screen overflow-hidden bg-void">
        {/* ── 3D depth-tunnel gallery — deferred until section approaches viewport ── */}
        {isMounted && (
          <InfiniteGallery
            images={GALLERY_IMAGES}
            className="absolute inset-0 h-full w-full"
            speed={0.7}
            visibleCount={10}
            isPaused={isPaused}
            fadeSettings={{
              fadeIn: { start: 0.05, end: 0.2 },
              fadeOut: { start: 0.8, end: 0.95 },
            }}
            blurSettings={{
              blurIn: { start: 0.0, end: 0.12 },
              blurOut: { start: 0.88, end: 1.0 },
              maxBlur: 4.0,
            }}
          />
        )}

        {/* ── Dark scrim — text legibility ── */}
        <div className="pointer-events-none absolute inset-0 bg-black/55" />

        {/* ── Philosophy text overlay — fades in on each statement change ── */}
        <div
          key={activeIdx}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          style={{
            animation: `philosophy-fade-in ${FADE_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards`,
          }}
        >
          {statement.isArmonia ? (
            // Statement 5 — ARMONIA oversized treatment
            <>
              <p className="mb-6 text-display-md font-[300] text-paper">{statement.line1}</p>
              <p
                className="font-[300] text-paper"
                style={{ fontSize: 'clamp(72px, 12vw, 160px)', letterSpacing: '0.08em' }}
              >
                {statement.line2}
              </p>
              {statement.subtitle && (
                <p className="mt-6 text-label tracking-[0.3em] text-stone">{statement.subtitle}</p>
              )}
            </>
          ) : (
            // Statements 1–4 — standard manifesto layout
            <>
              <p className="text-display-md font-[300] leading-[1.15] text-paper">
                {statement.line1}
              </p>
              <p className="text-display-md font-[300] leading-[1.15] text-paper">
                {statement.line2}
              </p>
            </>
          )}
        </div>

        {/* ── Progress dots — show scroll position within section ── */}
        <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex justify-center gap-2">
          {STATEMENTS.map((_, i) => (
            <span
              key={i}
              className="block h-px transition-all duration-500"
              style={{
                width: i === activeIdx ? '24px' : '12px',
                background: i === activeIdx ? 'var(--color-threshold)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
