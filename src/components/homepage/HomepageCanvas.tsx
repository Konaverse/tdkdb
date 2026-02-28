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
      end: `+=${window.innerHeight * 1.5}px`, // 150vh in px — approach fully plays 0→150vh
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
          end: `+=${window.innerHeight * 1.5}px`, // matches approach range — vignette fully dark at threshold
          scrub: 1.5,
        },
      },
    );

    const thresholdST = ScrollTrigger.create({
      trigger: '#scroll-container',
      start: `top+=${window.innerHeight * 1.5}px top`, // 150vh in px — avoids % ambiguity (% in trigger pos = trigger height, not viewport)
      end: `+=${window.innerHeight * 0.2}`, // 20vh past start
      scrub: 1,
      onUpdate: (self) => {
        if (self.progress > 0) {
          setPhase((prev) => (prev === 'approach' ? 'threshold' : prev));
        }
      },
      onLeave: () => {
        // AUDIO_CUE: threshold_bloom — soft ambient chime
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Fade canvas out
        canvas.style.transition = 'opacity 0.3s';
        canvas.style.opacity = '0';
        setTimeout(() => {
          canvas.style.display = 'none'; // frees GPU memory
          assemblyFrames.current = []; // frees ~16 MB RAM
          approachFrames.current = []; // frees ~26 MB RAM
        }, 300);

        // Kill all overlay ScrollTriggers so they don't fire into subsequent sections.
        // The glow ST fires at ~234vh (before anatomy at 260vh) and would show a teal
        // gradient overlay; the vignette ST is done but its opacity is stuck at 0.8.
        mainST.kill();
        vignetteTween.scrollTrigger?.kill();
        // Fade vignette to 0 smoothly so it doesn't bleed over the anatomy section
        if (vignetteRef.current) {
          vignetteRef.current.style.transition = 'opacity 0.6s';
          vignetteRef.current.style.opacity = '0';
        }

        setPhase('complete');
      },
    });

    return () => {
      mainST.kill();
      vignetteTween.scrollTrigger?.kill();
      thresholdST.kill();
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
      <SceneHero
        isVisible={phase === 'hero' || phase === 'approach'}
        scrollProgress={scrollProgress}
      />
      {/* 260vh: approach runs 0→150vh, threshold teardown 150→170vh, 90vh buffer before next section */}
      <div id="scroll-container" style={{ position: 'relative', height: '260vh' }} />
      {children}
    </HomepagePhaseContext.Provider>
  );
}
