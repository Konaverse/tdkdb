'use client';

import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { gsapInit } from '@/lib/animations/gsap';
import { imageReveal } from '@/lib/animations/imageReveal';
import { LightboxTrigger } from '@/components/ui/ImageLightbox';

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
  lightbox = false,
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
  /** Editorial photographs share a page gallery; project navigation links opt out. */
  lightbox?: boolean | string;
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

    const reveal = imageReveal(frame, { cover, settle });
    // The cover is now in place; release the server-rendered image only after
    // its entrance owns the frame, avoiding a visible photo followed by a wipe.
    settle.style.visibility = 'visible';
    return () => {
      reveal.revert();
      settle.style.removeProperty('visibility');
    };
  }, [cover]);

  return (
    <div
      ref={frameRef}
      {...frameAttrs}
      data-nav={nav}
      data-lightbox={lightbox ? (typeof lightbox === 'string' ? lightbox : 'page') : undefined}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <div ref={settleRef} data-image-entrance className="absolute inset-0">
        {children}
      </div>
      {lightbox && <LightboxTrigger />}
    </div>
  );
}
