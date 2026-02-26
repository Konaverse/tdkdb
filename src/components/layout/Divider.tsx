'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

interface DividerProps {
  className?: string;
  delay?: number; // ms
}

export default function Divider({ className, delay = 0 }: DividerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 1.2,
          delay: delay / 1000,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 85%',
            once: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [delay]);

  return (
    <div
      ref={ref}
      role="separator"
      aria-hidden="true"
      className={cn('h-px w-full bg-border will-change-transform', className)}
    />
  );
}
