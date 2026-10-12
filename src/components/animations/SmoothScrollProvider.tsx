'use client';

import { useEffect } from 'react';
import { gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { initLenis, destroyLenis } from '@/lib/animations/lenis';

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)');

    gsapInit();

    const sync = () => {
      if (reduced.matches || touch.matches) destroyLenis();
      else initLenis();
    };
    sync();
    reduced.addEventListener('change', sync);
    touch.addEventListener('change', sync);

    // Dynamic heroes can change document height with the browser controls.
    // Update trigger positions once the touch scroll and resize have settled.
    let width = window.innerWidth;
    let height = window.innerHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending = false;
    const refresh = () => {
      if (!pending || ScrollTrigger.isScrolling()) return;
      if (
        document.querySelector('dialog[open]') ||
        document.activeElement?.matches('input, textarea, select') ||
        (window.visualViewport && window.visualViewport.scale !== 1)
      )
        return;
      pending = false;
      ScrollTrigger.refresh(true);
    };
    const onResize = () => {
      const nextWidth = window.innerWidth;
      const nextHeight = window.innerHeight;
      if (touch.matches && nextWidth === width && nextHeight !== height) {
        pending = true;
        clearTimeout(timer);
        timer = setTimeout(refresh, 250);
      }
      width = nextWidth;
      height = nextHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });
    ScrollTrigger.addEventListener('scrollEnd', refresh);

    return () => {
      clearTimeout(timer);
      reduced.removeEventListener('change', sync);
      touch.removeEventListener('change', sync);
      window.removeEventListener('resize', onResize);
      ScrollTrigger.removeEventListener('scrollEnd', refresh);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
