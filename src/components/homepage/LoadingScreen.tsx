'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingScreenProps {
  progress: number;
  onComplete: () => void;
}

export default function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const isCompleting = useRef(false);

  // Progress animation
  useEffect(() => {
    if (lineRef.current) {
      gsap.to(lineRef.current, {
        scaleX: progress,
        duration: 1.5,
        ease: 'power2.out',
      });
    }
  }, [progress]);

  // Completion animation
  useEffect(() => {
    if (progress >= 1 && !isCompleting.current) {
      isCompleting.current = true;

      const tl = gsap.timeline({
        delay: 0.2,
        onComplete: onComplete,
      });

      if (textRef.current && containerRef.current) {
        tl.to(textRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.inOut',
        }).to(containerRef.current, {
          opacity: 0,
          duration: 0.5,
          ease: 'power2.inOut',
        });
      }
    }
  }, [progress, onComplete]);

  useEffect(() => {
    // Prevent scroll during loading
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore on exit
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--color-void, #0D0D0D)' }}
    >
      <div className="flex flex-col items-center gap-6">
        <h1
          ref={textRef}
          className="text-display-md uppercase tracking-[0.3em]"
          style={{ color: 'var(--color-paper, #F5F0E8)' }}
        >
          TDK
        </h1>

        {/* The line container */}
        <div
          className="h-px w-[200px] overflow-hidden"
          style={{ backgroundColor: 'rgba(245, 240, 232, 0.2)' }}
        >
          {/* The fill line */}
          <span
            ref={lineRef}
            className="block h-full w-full origin-left scale-x-0"
            style={{ backgroundColor: 'var(--color-paper, #F5F0E8)' }}
          />
        </div>
      </div>
    </div>
  );
}
