'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { maskChars, riseIn } from '@/lib/animations/text';
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

    let alive = true;
    let ctx: gsap.Context | null = null;
    document.fonts.ready.then(() => {
      if (!alive || !ref.current) return;
      ctx = gsap.context(() => {
        const { split, chars } = maskChars(ref.current);
        gsap.to(
          chars,
          riseIn(chars, {
            delay: delay / 1000,
            scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
            onComplete: () => split.revert(),
          }),
        );
      }, ref);
    });

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, [delay]);

  const Tag = tag;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn(className)}>
      {children}
    </Tag>
  );
}
