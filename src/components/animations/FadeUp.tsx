'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number; // ms
  duration?: number; // ms
  distance?: number; // px
  className?: string;
}

export default function FadeUp({
  children,
  delay = 0,
  duration = 800,
  distance = 40,
  className,
}: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: distance },
        {
          opacity: 1,
          y: 0,
          duration: duration / 1000,
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
  }, [delay, duration, distance]);

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
