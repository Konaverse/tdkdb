'use client';

import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { gsapInit } from '@/lib/animations/gsap';
import { stripReveal } from '@/lib/animations/stripReveal';

/**
 * A picture frame that enters with the site's one image entrance (see
 * stripReveal): strips wiping left to right, top to bottom, while the
 * contents settle. Size it with className; put the image — and any scroll
 * motion, on its own node — inside.
 */
export default function RevealFrame({
  className = '',
  style,
  cover = '#ffffff',
  nav,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  cover?: string;
  /** data-nav for the navbar's colour switch. */
  nav?: 'light' | 'dark';
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const frame = frameRef.current;
    if (!frame) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return stripReveal(frame, { cover, settle: settleRef.current }).revert;
  }, [cover]);

  return (
    <div
      ref={frameRef}
      data-nav={nav}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <div ref={settleRef} className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
