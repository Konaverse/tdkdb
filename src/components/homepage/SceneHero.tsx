'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { gsap } from '@/lib/animations/gsap';

interface SceneHeroProps {
  isVisible: boolean;
  scrollProgress: number;
}

interface Fragment {
  text: string;
  className: string;
  style: CSSProperties;
  delay: number;
  depth: number;
  exitX: number;
  exitY: number;
}

const FRAGMENTS: Fragment[] = [
  {
    text: 'DESIGNED TO LAST.',
    className: 'text-display-lg font-light tracking-[0.05em] text-paper',
    style: { top: '12%', right: '8%' },
    delay: 0.2,
    depth: 0.02,
    exitX: 60,
    exitY: -30,
  },
  {
    text: 'NOT JUST BUILT.\nCRAFTED.',
    className: 'text-display-md text-paper whitespace-pre-line',
    style: { top: '28%', left: '8%' },
    delay: 0.4,
    depth: 0.015,
    exitX: -60,
    exitY: -20,
  },
  {
    text: 'Every line has a reason.',
    className: 'text-heading font-light italic text-paper/80',
    style: { top: '52%', left: '8%' },
    delay: 0.6,
    depth: 0.01,
    exitX: -40,
    exitY: 0,
  },
  {
    text: 'TDK DESIGN & BUILD',
    className: 'text-label uppercase tracking-[0.2em] text-stone',
    style: { bottom: '12%', right: '8%' },
    delay: 0.7,
    depth: 0.03,
    exitX: 40,
    exitY: 30,
  },
];

export default function SceneHero({ isVisible, scrollProgress }: SceneHeroProps) {
  const outerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // quickTo refs for scroll-out
  const quickToOpacity = useRef<(((v: number) => void) | null)[]>([]);
  const quickToY = useRef<(((v: number) => void) | null)[]>([]);
  const quickToX = useRef<(((v: number) => void) | null)[]>([]);
  const quickToIndicatorOpacity = useRef<((v: number) => void) | null>(null);

  // Effect 1 — Set initial hidden state + create quickTo instances on mount
  useLayoutEffect(() => {
    gsap.set(outerRefs.current, { opacity: 0, y: 20 });
    gsap.set(indicatorRef.current, { opacity: 0 });
    gsap.set(lineRef.current, { yPercent: -100 });

    quickToOpacity.current = outerRefs.current.map((el) =>
      el ? (gsap.quickTo(el, 'opacity', { duration: 0.15 }) as (v: number) => void) : null,
    );
    quickToY.current = outerRefs.current.map((el) =>
      el ? (gsap.quickTo(el, 'y', { duration: 0.15 }) as (v: number) => void) : null,
    );
    quickToX.current = outerRefs.current.map((el) =>
      el ? (gsap.quickTo(el, 'x', { duration: 0.15 }) as (v: number) => void) : null,
    );
    quickToIndicatorOpacity.current = indicatorRef.current
      ? (gsap.quickTo(indicatorRef.current, 'opacity', { duration: 0.05 }) as (v: number) => void)
      : null;
  }, []);

  // Effect 2 — Entrance animation (watches isVisible)
  useLayoutEffect(() => {
    if (!isVisible) return;

    const ctx = gsap.context(() => {
      FRAGMENTS.forEach((f, i) => {
        gsap.to(outerRefs.current[i], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: f.delay,
          ease: 'power3.out',
          overwrite: true,
        });
      });

      gsap.to(indicatorRef.current, {
        opacity: 1,
        duration: 0.4,
        delay: 0.9,
        ease: 'power3.out',
      });

      gsap.fromTo(
        lineRef.current,
        { yPercent: -100 },
        { yPercent: 100, duration: 1.2, ease: 'none', repeat: -1, delay: 1.3 },
      );
    });

    return () => ctx.revert();
  }, [isVisible]);

  // Effect 3 — Mouse parallax (watches isVisible)
  useEffect(() => {
    if (!isVisible) return;

    const setters = innerRefs.current.map((el) =>
      el
        ? {
            x: gsap.quickSetter(el, 'x', 'px') as (v: number) => void,
            y: gsap.quickSetter(el, 'y', 'px') as (v: number) => void,
            depth: parseFloat(el.dataset.depth ?? '0'),
          }
        : null,
    );

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      setters.forEach((s) => {
        if (!s) return;
        s.x(dx * s.depth);
        s.y(dy * s.depth);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  // Effect 4 — Scroll-out (watches scrollProgress)
  useEffect(() => {
    if (!isVisible) return;

    const t = Math.min(scrollProgress / 0.4, 1);
    const opacity = 1 - t;

    FRAGMENTS.forEach((f, i) => {
      quickToOpacity.current[i]?.(opacity);
      quickToX.current[i]?.(f.exitX * t);
      quickToY.current[i]?.(f.exitY * t);
    });

    if (scrollProgress > 0.02) {
      quickToIndicatorOpacity.current?.(0);
    }
  }, [scrollProgress, isVisible]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10">
      {FRAGMENTS.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            outerRefs.current[i] = el;
          }}
          className="absolute"
          style={f.style}
        >
          <div
            ref={(el) => {
              innerRefs.current[i] = el;
            }}
            data-depth={String(f.depth)}
            className={f.className}
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.95)' }}
          >
            {f.text}
          </div>
        </div>
      ))}
      <div
        ref={indicatorRef}
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-paper/60 text-label uppercase tracking-[0.2em]">Scroll</span>
        <div className="overflow-hidden" style={{ width: '1px', height: '40px' }}>
          <div ref={lineRef} className="bg-paper/60 h-full w-px" />
        </div>
      </div>
    </div>
  );
}
