'use client';

import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { gsapInit } from '@/lib/animations/gsap';
import { imageReveal } from '@/lib/animations/imageReveal';

/**
 * A picture frame that enters with the site's image entrance. Size it with
 * className; put the image — and any scroll motion, on its own node — inside.
 *
 * The entrance is imageReveal: one cover lifts away upward, the picture
 * uncovered from its base, while the contents settle out of 1.05.
 */
export default function RevealFrame({
  className = '',
  style,
  cover = '#ffffff',
  nav,
  frameAttrs,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  cover?: string;
  /** data-nav for the navbar's colour switch. */
  nav?: 'light' | 'dark';
  /** Extra attributes on the frame itself, e.g. the `data-frame` the project
      transition opens from. */
  frameAttrs?: Record<string, string>;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const settleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const frame = frameRef.current;
    const settle = settleRef.current;
    if (!frame || !settle) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    return imageReveal(frame, { cover, settle }).revert;
  }, [cover]);

  return (
    <div
      ref={frameRef}
      {...frameAttrs}
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
