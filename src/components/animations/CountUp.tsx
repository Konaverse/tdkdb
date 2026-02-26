'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

interface CountUpProps {
  target: number;
  suffix?: string;
  duration?: number; // ms
  className?: string;
}

export default function CountUp({
  target,
  suffix = '',
  duration = 2000,
  className,
}: CountUpProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const counter = useRef({ value: 0 });

  useLayoutEffect(() => {
    gsapInit();

    // Reset to zero on each run (handles remounts)
    counter.current.value = 0;
    if (spanRef.current) spanRef.current.textContent = `0${suffix}`;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (spanRef.current) spanRef.current.textContent = `${target}${suffix}`;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(counter.current, {
        value: target,
        duration: duration / 1000,
        ease: 'power2.out',
        onUpdate() {
          if (spanRef.current) {
            spanRef.current.textContent = `${Math.round(counter.current.value)}${suffix}`;
          }
        },
        scrollTrigger: {
          trigger: spanRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, [target, suffix, duration]);

  return (
    <span ref={spanRef} className={cn(className)}>
      0{suffix}
    </span>
  );
}
