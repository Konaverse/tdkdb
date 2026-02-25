'use client';

import { useEffect } from 'react';
import { gsapInit } from '@/lib/animations/gsap';
import { initLenis, destroyLenis } from '@/lib/animations/lenis';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsapInit();

    if (!prefersReducedMotion) {
      initLenis();
    }

    return () => {
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
