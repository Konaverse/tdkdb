'use client';

import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/animations/gsap';

interface LoadingScreenProps {
  /** 0–1. Pass 1 to immediately animate fill then exit. */
  progress: number;
  /** Called when the exit animation fully completes. */
  onComplete: () => void;
}

export default function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  // Stable ref so the empty-deps effect always calls the latest onComplete
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!fillRef.current || !textRef.current || !overlayRef.current) return;

    // Capture DOM nodes so cleanup can reference them after unmount
    const fill = fillRef.current;
    const text = textRef.current;
    const overlay = overlayRef.current;

    document.body.style.overflow = 'hidden';

    // Single timeline: fill → hold 200ms → text fade → overlay fade → done
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        onCompleteRef.current();
      },
    });

    tl.fromTo(fill, { scaleX: 0 }, {
      scaleX: progress,
      duration: 1.5,
      ease: 'power2.out',
      transformOrigin: 'left center',
    })
      .to(text, { opacity: 0, duration: 0.4, ease: 'power4.out', delay: 0.2 })
      .to(overlay, { opacity: 0, duration: 0.5, ease: 'power4.out' }, '-=0.1');

    return () => {
      tl.kill();
      document.body.style.overflow = '';
    };
    // Empty deps: run once on mount. progress/onComplete captured via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-void)' }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Brand mark */}
        <div
          ref={textRef}
          style={{
            fontFamily: 'var(--font-primary)',
            fontSize: 'clamp(36px, 4vw, 64px)',
            fontWeight: 400,
            letterSpacing: '0.3em',
            color: 'var(--color-paper)',
          }}
        >
          TDK
        </div>

        {/* Progress bar — 200px track, 1px tall */}
        <div
          style={{
            width: 200,
            height: 1,
            backgroundColor: 'rgba(245, 240, 232, 0.15)',
            position: 'relative',
          }}
        >
          <span
            ref={fillRef}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--color-paper)',
              transformOrigin: 'left center',
              transform: 'scaleX(0)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
