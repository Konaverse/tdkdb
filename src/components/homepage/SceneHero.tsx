'use client';

import { useRef, useEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animations/gsap';

interface SceneHeroProps {
  /** true after the loading screen exits — triggers entrance animations */
  isVisible: boolean;
}

// Parallax depth per fragment (1–5). Higher = more drift.
const DEPTHS = [0.02, 0.025, 0.015, 0.01, 0.03] as const;

type QuickToFn = (value: number) => void;

export default function SceneHero({ isVisible }: SceneHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Outer wrappers — absolutely positioned, driven by scroll-out ScrollTrigger
  const f1 = useRef<HTMLDivElement>(null);
  const f2 = useRef<HTMLDivElement>(null);
  const f3 = useRef<HTMLDivElement>(null);
  const f4 = useRef<HTMLDivElement>(null);
  const f5 = useRef<HTMLDivElement>(null);

  // Inner text elements — clip-path entrance + gsap.quickTo parallax x/y
  // Must be separate from outers so scroll-out and parallax never conflict.
  const t1 = useRef<HTMLHeadingElement>(null);
  const t2 = useRef<HTMLParagraphElement>(null);
  const t3 = useRef<HTMLParagraphElement>(null);
  const t4 = useRef<HTMLParagraphElement>(null);
  const t5 = useRef<HTMLDivElement>(null);

  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // quickTo functions created after mount (need DOM nodes)
  const qx = useRef<QuickToFn[]>([]);
  const qy = useRef<QuickToFn[]>([]);

  // ─── Effect 1: mount-time setup ────────────────────────────────────────
  // Parallax quickTo + scroll indicator listener + scroll-out ScrollTrigger.
  // Kept separate from the entrance so ScrollTrigger init never fights the entrance.
  useEffect(() => {
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;

    const inners = [t1.current!, t2.current!, t3.current!, t4.current!, t5.current!];
    const outers = [f1.current!, f2.current!, f3.current!, f4.current!, f5.current!];

    // Parallax quickTo — desktop only
    if (isPointerFine) {
      qx.current = inners.map(
        (el) => gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }) as unknown as QuickToFn,
      );
      qy.current = inners.map(
        (el) => gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }) as unknown as QuickToFn,
      );
    }

    // Scroll indicator: instant hide when raw scroll exceeds 50px
    const onScroll = () => {
      if (scrollIndicatorRef.current) {
        scrollIndicatorRef.current.style.opacity = window.scrollY > 50 ? '0' : '1';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Scroll-out ScrollTrigger
    // `immediateRender: false` on the fromTo is CRITICAL — without it, GSAP would snap
    // outers to opacity:1 at init time, before the entrance animation has run.
    const heroSection = containerRef.current?.parentElement;
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: '+=40%',
          scrub: 1,
          onUpdate: (self) => {
            // Belt-and-suspenders: also hide scroll indicator via ST progress
            if (scrollIndicatorRef.current) {
              scrollIndicatorRef.current.style.opacity = self.progress > 0.05 ? '0' : '1';
            }
          },
        },
      });

      // Fragments 2 & 3 (top-right) → fade out + move UP
      scrollTl.fromTo(
        [outers[1], outers[2]],
        { y: 0, opacity: 1, immediateRender: false },
        { y: -60, opacity: 0, ease: 'none' },
        0,
      );

      // Fragments 1, 4, 5 (bottom area) → fade out + move DOWN
      scrollTl.fromTo(
        [outers[0], outers[3], outers[4]],
        { y: 0, opacity: 1, immediateRender: false },
        { y: 40, opacity: 0, ease: 'none' },
        0,
      );
    });

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // ─── Effect 2: entrance — fires once when isVisible flips to true ───────
  useEffect(() => {
    if (!isVisible) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;

    const outers = [f1.current!, f2.current!, f3.current!, f4.current!, f5.current!];
    const inners = [t1.current!, t2.current!, t3.current!, t4.current!, t5.current!];

    if (prefersReduced) {
      // Skip all animation — show immediately
      outers.forEach((el) => gsap.set(el, { opacity: 1 }));
      gsap.set([inners[0], inners[1]], { clipPath: 'inset(0 0% 0 0)' });
      return;
    }

    // Pre-set clip-path on fragments that use the clip reveal
    gsap.set(inners[0], { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(inners[1], { clipPath: 'inset(0 100% 0 0)' });

    const tl = gsap.timeline();

    // F1 — "DESIGNED TO LAST." — clip-path reveal, delay 200ms, 700ms
    tl.set(outers[0], { opacity: 1 }, 0.2);
    tl.to(inners[0], { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power4.out' }, 0.2);

    // F2 — "NOT JUST BUILT. CRAFTED." — clip-path reveal, delay 400ms, 700ms
    tl.set(outers[1], { opacity: 1 }, 0.4);
    tl.to(inners[1], { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power4.out' }, 0.4);

    // F3 — "Every line has a reason." — fade + slide up, delay 600ms, 600ms
    tl.fromTo(
      outers[2],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out' },
      0.6,
    );

    // F4 — "TDK DESIGN & BUILD" — simple fade, delay 700ms, 500ms
    tl.to(outers[3], { opacity: 1, duration: 0.5, ease: 'power4.out' }, 0.7);

    // F5 — Scroll indicator — simple fade, delay 900ms, 400ms
    tl.to(outers[4], { opacity: 1, duration: 0.4, ease: 'power4.out' }, 0.9);

    // Mouse parallax — desktop only, active while this scene is visible
    if (!isPointerFine) return;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      DEPTHS.forEach((depth, i) => {
        qx.current[i]?.((e.clientX - cx) * depth);
        qy.current[i]?.((e.clientY - cy) * depth);
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      tl.kill();
    };
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-10"
    >
      <style>{`
        /* Scroll indicator sweep: line grows from top, then shrinks from bottom */
        @keyframes scroll-sweep {
          0%   { transform: scaleY(0); transform-origin: top;    }
          49%  { transform: scaleY(1); transform-origin: top;    }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        /*
         * Mobile repositioning.
         * Uses left:0;right:0 + flex centering — NOT transform:translateX(-50%).
         * This avoids conflict with GSAP's scroll-out y transform on the same element.
         */
        @media (max-width: 767px) {
          .sh-f1 { bottom: 15% !important; left: 0 !important; right: 0 !important;
                   display: flex !important; justify-content: center; text-align: center; }
          .sh-f2 { top: 12% !important; left: 0 !important; right: 0 !important;
                   display: flex !important; justify-content: center; text-align: center; }
          .sh-f3 { top: 28% !important; left: 0 !important; right: 0 !important;
                   display: flex !important; justify-content: center; text-align: center; }
          .sh-f4 { bottom: 8% !important; right: auto !important; left: 0 !important;
                   display: flex !important; justify-content: center; text-align: center; }

          /* One step down in the type scale */
          .sh-f1 h1 { font-size: clamp(36px, 5vw, 64px) !important; }
          .sh-f2 p  { font-size: clamp(18px, 2.5vw, 24px) !important; }
        }
      `}</style>

      {/* ── Fragment 1 — "DESIGNED TO LAST." — bottom-left, large ─────────── */}
      <div
        ref={f1}
        className="sh-f1 absolute"
        style={{ bottom: '8%', left: '6%', opacity: 0 }}
      >
        <h1
          ref={t1}
          className="text-display-lg"
          style={{ fontWeight: 300, letterSpacing: '0.05em', color: 'var(--color-paper)' }}
        >
          DESIGNED TO LAST.
        </h1>
      </div>

      {/* ── Fragment 2 — "NOT JUST BUILT. / CRAFTED." — top-right, below nav */}
      <div
        ref={f2}
        className="sh-f2 absolute"
        style={{ top: '12%', right: '6%', opacity: 0 }}
      >
        <p
          ref={t2}
          className="text-heading"
          aria-label="Not just built. Crafted."
          style={{ fontWeight: 600, color: 'var(--color-paper)', textAlign: 'right' }}
        >
          NOT JUST BUILT.
          <br />
          CRAFTED.
        </p>
      </div>

      {/* ── Fragment 3 — "Every line has a reason." — top-right, below F2 ── */}
      <div
        ref={f3}
        className="sh-f3 absolute"
        style={{ top: '26%', right: '6%', opacity: 0 }}
      >
        <p
          ref={t3}
          className="text-body-lg"
          style={{ fontWeight: 300, fontStyle: 'italic', color: 'var(--color-paper)', textAlign: 'right' }}
        >
          Every line has a reason.
        </p>
      </div>

      {/* ── Fragment 4 — "TDK DESIGN & BUILD" ────────────────────────────── */}
      <div
        ref={f4}
        className="sh-f4 absolute"
        style={{ bottom: '18%', right: '8%', opacity: 0 }}
      >
        <p
          ref={t4}
          className="text-label"
          style={{ color: 'var(--color-stone)' }}
        >
          TDK DESIGN &amp; BUILD
        </p>
      </div>

      {/* ── Fragment 5 — Scroll indicator ────────────────────────────────── */}
      <div
        ref={f5}
        className="absolute"
        style={{ bottom: '6%', left: '50%', transform: 'translateX(-50%)', opacity: 0 }}
        role="presentation"
      >
        {/* Inner ref so we can hide this independently of the outer's scroll-out */}
        <div
          ref={t5}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-label" style={{ color: 'var(--color-stone)' }}>
            SCROLL
          </span>
          {/* 1px vertical line with downward sweep animation */}
          <div
            ref={scrollIndicatorRef}
            style={{
              width: 1,
              height: 32,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: 'rgba(140, 140, 140, 0.25)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent, var(--color-paper), transparent)',
                animation: 'scroll-sweep 2s linear infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
