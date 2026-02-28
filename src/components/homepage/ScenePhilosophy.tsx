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
  { src: cloudinaryUrl('clients/tdkdb/philosophy/concrete-textiure', { width: 1920 }), alt: '' },
  { src: cloudinaryUrl('clients/tdkdb/philosophy/floor-plan-hands', { width: 1920 }), alt: '' },
  { src: cloudinaryUrl('clients/tdkdb/philosophy/window-frame', { width: 1920 }), alt: '' },
  { src: cloudinaryUrl('clients/tdkdb/philosophy/light-shafts', { width: 1920 }), alt: '' },
  { src: cloudinaryUrl('clients/tdkdb/armonia/exterior/1', { width: 1920 }), alt: '' },
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

// 500 vh total → 400 vh of scroll travel → 80 vh per statement
const CONTAINER_HEIGHT = `${STATEMENTS.length * 100}vh`;

// Text fade duration (ms) — must match CSS transition below
const FADE_DURATION = 500;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScenePhilosophy() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Refs for scroll-driven logic — avoids stale closures inside ST callbacks
  const activeIdxRef = useRef(0);
  const targetIdxRef = useRef(0);
  const fadingRef = useRef(false);

  useLayoutEffect(() => {
    gsapInit();

    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',

        onUpdate: (self) => {
          // Map 0–1 progress to 0–(N-1) statement index in equal bands
          const newIdx = Math.min(
            Math.floor(self.progress * STATEMENTS.length),
            STATEMENTS.length - 1,
          );

          // Always track what the scroll position wants, even mid-fade
          targetIdxRef.current = newIdx;

          if (newIdx === activeIdxRef.current) return;
          if (fadingRef.current) return; // a fade is already in flight; it will land on targetIdx

          fadingRef.current = true;
          setIsVisible(false);

          setTimeout(() => {
            // Use targetIdx, not newIdx — the user may have scrolled further during the fade
            const landing = targetIdxRef.current;
            activeIdxRef.current = landing;
            setActiveIdx(landing);
            setIsVisible(true);
            fadingRef.current = false;
          }, FADE_DURATION);
        },

        onLeaveBack: () => {
          // Scrolled back above the section — reset to statement 0
          targetIdxRef.current = 0;
          if (activeIdxRef.current === 0) return;

          fadingRef.current = true;
          setIsVisible(false);

          setTimeout(() => {
            activeIdxRef.current = 0;
            setActiveIdx(0);
            setIsVisible(true);
            fadingRef.current = false;
          }, FADE_DURATION);
        },
      });
    }, container);

    // ─── Position fix for HomepageCanvas ──────────────────────────────────────
    // HomepageCanvas is dynamic({ ssr: false }) — it adds ~260 vh to the document
    // AFTER this effect runs, which shifts all subsequent ScrollTrigger positions.
    // ResizeObserver fires once when body height changes and corrects them.
    const initialHeight = document.body.scrollHeight;

    const heightObserver = new ResizeObserver(() => {
      if (document.body.scrollHeight !== initialHeight) {
        ScrollTrigger.refresh();
        heightObserver.disconnect();
      }
    });
    heightObserver.observe(document.body);

    // rAF handles the case where HomepageCanvas bundle was already prefetched
    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(rafId);
      heightObserver.disconnect();
      ctx.revert();
    };
  }, []);

  const statement = STATEMENTS[activeIdx];

  return (
    // Tall container gives the page scroll travel; sticky section holds position
    <div ref={containerRef} style={{ height: CONTAINER_HEIGHT }}>
      <section className="sticky top-0 h-screen overflow-hidden bg-void">
        {/* ── 3D depth-tunnel gallery — auto-plays independently of scroll ── */}
        <InfiniteGallery
          images={GALLERY_IMAGES}
          className="absolute inset-0 h-full w-full"
          speed={0.7}
          visibleCount={10}
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

        {/* ── Dark scrim — text legibility ── */}
        <div className="pointer-events-none absolute inset-0 bg-black/55" />

        {/* ── Philosophy text overlay — fades between statements on scroll ── */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.16,1,0.3,1)`,
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
              <p className="text-display-md font-[300] text-paper leading-[1.15]">
                {statement.line1}
              </p>
              <p className="text-display-md font-[300] text-paper leading-[1.15]">
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
                background:
                  i === activeIdx ? 'var(--color-threshold)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
