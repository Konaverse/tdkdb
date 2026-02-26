'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

type Tag = 'h1' | 'h2' | 'h3' | 'p';

interface TextRevealProps {
  children: string;
  tag?: Tag;
  delay?: number; // ms
  className?: string;
}

export default function TextReveal({ children, tag = 'p', delay = 0, className }: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.0,
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

  const Tag = tag;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn('will-change-[clip-path]', className)}>
      {children}
    </Tag>
  );
}
