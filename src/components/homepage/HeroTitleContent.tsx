'use client';

import { forwardRef, useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';

const TITLE = 'TDKDB';

/* ─── WordsPullUp (GSAP) ─────────────────────────────────────────
   Shared between the loader and the hero so the TDKDB title is
   pixel-identical across the intro handoff. When `animate` is false
   the letters render at rest (the loader owns the entrance). */

function WordsPullUp({ animate }: { animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = TITLE.split(' ');

  useLayoutEffect(() => {
    if (!animate || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelectorAll('.word'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.08 },
      );
    }, ref);
    return () => ctx.revert();
  }, [animate]);

  return (
    <span ref={ref} className="inline-flex flex-wrap">
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <span
            key={i}
            className="word relative inline-block"
            style={{ marginRight: isLast ? 0 : '0.25em', opacity: animate ? 0 : 1 }}
          >
            {word}
            {isLast && (
              <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]">*</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

interface Props {
  /** When true, the letters stagger-in on mount (loader). When false, they render at rest (hero). */
  animate?: boolean;
}

/** The bottom-left TDKDB title block. The forwarded ref points at the title
    column so the loader can re-position it (mobile: centre → corner). */
const HeroTitleContent = forwardRef<HTMLDivElement, Props>(function HeroTitleContent(
  { animate = false },
  ref,
) {
  return (
    <div className="absolute bottom-0 left-0 right-0 px-4 pb-0 sm:px-6 sm:pb-1 md:px-10 md:pb-1">
      <div className="grid grid-cols-12 items-end gap-4">
        <div ref={ref} className="pointer-events-auto col-span-12 lg:col-span-8">
          <h1
            className="translate-y-[0.12em] text-[22vw] font-medium leading-[0.85] tracking-[-0.05em] sm:text-[20vw] md:text-[18vw] lg:text-[17vw] xl:text-[16vw] 2xl:text-[17vw]"
            style={{ color: '#fff', fontFamily: 'var(--font-primary)' }}
          >
            <WordsPullUp animate={animate} />
          </h1>
        </div>
      </div>
    </div>
  );
});

export default HeroTitleContent;
