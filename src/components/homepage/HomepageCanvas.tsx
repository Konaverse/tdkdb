'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animations/gsap';
import { SEQUENCE_CONFIG } from '@/lib/homepage/sequenceConfig';
import { drawFrame, preloadSequence } from '@/lib/homepage/imageSequence';
import LoadingScreen from './LoadingScreen';
import SceneHero from './SceneHero';

export type HomepagePhase = 'loading' | 'assembly' | 'hero' | 'approach' | 'threshold' | 'complete';
export const HomepagePhaseContext = createContext<HomepagePhase>('loading');

function playAssembly(
  frames: HTMLImageElement[],
  ctx: CanvasRenderingContext2D,
  onComplete: () => void,
  fps = 24,
): () => void {
  let startTime: number | null = null;
  let rafId = 0;
  const DURATION = (frames.length / fps) * 1000;

  function tick(ts: number) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / DURATION, 1);
    drawFrame(ctx, frames, Math.floor(progress * (frames.length - 1)));
    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onComplete();
    }
  }

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}

export default function HomepageCanvas({ children }: { children?: ReactNode }) {
  const [phase, setPhase] = useState<HomepagePhase>('loading');
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const assemblyFrames = useRef<HTMLImageElement[]>([]);
  const approachFrames = useRef<HTMLImageElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafCleanupRef = useRef<(() => void) | null>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }, []);

  const handleLoadingComplete = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || assemblyFrames.current.length === 0) return;
    setPhase('assembly');
    rafCleanupRef.current = playAssembly(
      assemblyFrames.current,
      ctx,
      () => {
        setPhase('hero');
      },
      SEQUENCE_CONFIG.assembly.fps,
    );
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleScroll = () => {
      const range = window.innerHeight * 1.5;
      const progress = Math.min(window.scrollY / range, 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let aLoaded = 0;
    let bLoaded = 0;
    const total = SEQUENCE_CONFIG.assembly.frameCount + SEQUENCE_CONFIG.approach.frameCount;

    preloadSequence(SEQUENCE_CONFIG.assembly, (pct) => {
      aLoaded = Math.round(pct * SEQUENCE_CONFIG.assembly.frameCount);
      const overall = (aLoaded + bLoaded) / total;
      setLoadProgress(overall);
    }).then((frames) => {
      assemblyFrames.current = frames;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, frames, 0);
    });

    preloadSequence(SEQUENCE_CONFIG.approach, (pct) => {
      bLoaded = Math.round(pct * SEQUENCE_CONFIG.approach.frameCount);
      const overall = (aLoaded + bLoaded) / total;
      setLoadProgress(overall);
    }).then((frames) => {
      approachFrames.current = frames;
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
      rafCleanupRef.current?.();
    };
  }, [resizeCanvas]);

  const hasAssembled = phase !== 'loading' && phase !== 'assembly';

  useEffect(() => {
    if (!hasAssembled) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const mainST = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: '+=150%',
      scrub: 0.5,
      onUpdate: (self) => {
        const i = Math.round(self.progress * (approachFrames.current.length - 1));
        if (approachFrames.current.length > 0) {
          drawFrame(ctx, approachFrames.current, i);
        }
        if (self.progress > 0) {
          setPhase((prev) => (prev === 'hero' ? 'approach' : prev));
        }
      },
    });

    const vignetteTween = gsap.fromTo(
      vignetteRef.current,
      { opacity: 0.2 },
      {
        opacity: 0.8,
        ease: 'none',
        scrollTrigger: {
          trigger: '#scroll-container',
          start: 'top top',
          end: '+=150%',
          scrub: 1.5,
        },
      },
    );

    const glowTween = gsap.fromTo(
      glowRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#scroll-container',
          start: 'top+=90% top',
          end: '+=60%',
          scrub: 1,
        },
      },
    );

    return () => {
      mainST.kill();
      vignetteTween.scrollTrigger?.kill();
      glowTween.scrollTrigger?.kill();
    };
  }, [hasAssembled]);

  return (
    <HomepagePhaseContext.Provider value={phase}>
      {phase === 'loading' && (
        <LoadingScreen progress={loadProgress} onComplete={handleLoadingComplete} />
      )}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-screen w-screen"
        style={{ display: 'block' }}
      />
      {/* Dark veil — dims the bright building so white text is legible */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/45" />
      {/* Vignette — edges darken as camera approaches entrance */}
      <div
        ref={vignetteRef}
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          opacity: 0.2,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      {/* Entrance glow — teal warmth bleeds from the door in the final 40% */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed inset-0 z-[6]"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle at 50% 55%, rgba(102,151,159,0.15) 0%, transparent 60%)',
        }}
      />
      <SceneHero
        isVisible={phase === 'hero' || phase === 'approach'}
        scrollProgress={scrollProgress}
      />
      <div id="scroll-container" style={{ position: 'relative', height: '760vh' }} />
      {children}
    </HomepagePhaseContext.Provider>
  );
}
