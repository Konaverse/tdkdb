'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';

interface LoadingScreenProps {
  progress: number;
  onComplete: () => void;
}

export default function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const completedRef = useRef(false);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Exit sequence when progress reaches 1
  useEffect(() => {
    if (progress < 1 || completedRef.current) return;
    completedRef.current = true;

    gsap.timeline({ delay: 0.2 })
      .to(textRef.current, { opacity: 0, duration: 0.4, ease: 'power2.out' })
      .to(overlayRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' })
      .call(onComplete);
  }, [progress, onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void"
    >
      <div className="flex flex-col items-center gap-6">
        <span
          ref={textRef}
          className="text-display-md text-paper"
          style={{ letterSpacing: '0.3em' }}
        >
          TDK
        </span>
        <div className="relative h-px w-[200px] overflow-hidden bg-paper/20">
          <span
            className="absolute inset-0 origin-left bg-paper"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </div>
  );
}
