'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

interface HorizontalRevealProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  className?: string;
}

export default function HorizontalReveal({
  children,
  direction = 'left',
  className,
}: HorizontalRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const startX = direction === 'left' ? -60 : 60;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, x: startX },
        {
          opacity: 1,
          x: 0,
          duration: 1.0,
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
  }, [direction]);

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
