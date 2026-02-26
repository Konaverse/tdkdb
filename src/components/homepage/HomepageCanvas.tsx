'use client';

import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SEQUENCE_CONFIG } from '@/lib/homepage/sequenceConfig';
import { drawFrame, preloadSequence } from '@/lib/homepage/imageSequence';
import LoadingScreen from './LoadingScreen';

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
  const assemblyFrames = useRef<HTMLImageElement[]>([]);
  const approachFrames = useRef<HTMLImageElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafCleanupRef = useRef<(() => void) | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
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
      rafCleanupRef.current?.();
    };
  }, [resizeCanvas]);

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
      <div style={{ position: 'relative', height: '760vh' }} />
      {children}
    </HomepagePhaseContext.Provider>
  );
}
