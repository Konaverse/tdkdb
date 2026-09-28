'use client';

import { useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { stripReveal, STRIP_REVEAL } from '@/lib/animations/stripReveal';

/**
 * A picture frame that enters with the site's image entrance. Size it with
 * className; put the image — and any scroll motion, on its own node — inside.
 *
 * Two entrances, one component:
 *   · "strips" (default) — stripReveal: strips wiping left to right, top to
 *     bottom, while the contents settle out of 1.1.
 *   · "quiet" — for pages where the strips are too much (the projects hub,
 *     at the client's request): the picture fades up over ~1.2s with a barely
 *     visible settle from 1.03. Nothing wipes, nothing is covered.
 */
export default function RevealFrame({
  className = '',
  style,
  cover = '#ffffff',
  entrance = 'strips',
  nav,
  frameAttrs,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  cover?: string;
  entrance?: 'strips' | 'quiet';
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

    if (entrance === 'strips') {
      return stripReveal(frame, { cover, settle }).revert;
    }

    const tween = gsap.fromTo(
      settle,
      { autoAlpha: 0, scale: 1.03 },
      {
        autoAlpha: 1,
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: frame, start: STRIP_REVEAL.start, once: true },
      },
    );
    return () => {
      (tween.scrollTrigger as ScrollTrigger | undefined)?.kill();
      tween.kill();
      gsap.set(settle, { clearProps: 'transform,opacity,visibility' });
    };
  }, [cover, entrance]);

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
