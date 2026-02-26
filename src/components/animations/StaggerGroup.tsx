'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cn } from '@/lib/utils/cn';

interface StaggerGroupProps {
  children: React.ReactNode;
  stagger?: number;                      // ms between each item, default 80
  trigger?: 'viewport' | 'immediate';
  className?: string;
}

export default function StaggerGroup({
  children,
  stagger = 80,
  trigger = 'viewport',
  className,
}: StaggerGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const items = groupRef.current ? Array.from(groupRef.current.children) : [];
      if (!items.length) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: stagger / 1000,
          ease: 'power3.out',
          scrollTrigger:
            trigger === 'viewport'
              ? { trigger: groupRef.current, start: 'top 85%', once: true }
              : undefined,
        },
      );
    });

    return () => ctx.revert();
  }, [stagger, trigger]);

  return (
    <div ref={groupRef} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
