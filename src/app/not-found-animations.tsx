'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import Link from 'next/link';
import { PrimaryButton } from '@/components/ui/Button';

export default function NotFoundAnimations() {
  const codeRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Everything immediately visible
      [codeRef.current, headingRef.current, bodyRef.current, actionsRef.current].forEach((el) => {
        if (el) {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        codeRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
      );
      gsap.fromTo(
        [headingRef.current, bodyRef.current],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.1, delay: 0.4 },
      );
      gsap.fromTo(
        actionsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.6 },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-start gap-6 px-6" style={{ maxWidth: '480px' }}>
      <p ref={codeRef} className="text-display-xl font-light text-stone" style={{ opacity: 0 }}>
        404
      </p>
      <p ref={headingRef} className="text-label text-stone" style={{ opacity: 0 }}>
        PAGE NOT FOUND
      </p>
      <p ref={bodyRef} className="text-body text-stone" style={{ opacity: 0 }}>
        The page you are looking for does not exist or has been moved. Try navigating back to the
        homepage or explore our projects.
      </p>
      <div ref={actionsRef} className="flex flex-wrap items-center gap-6" style={{ opacity: 0 }}>
        <PrimaryButton href="/">Back to Home</PrimaryButton>
        <Link
          href="/en/projects"
          className="text-label text-stone transition-colors duration-fast ease-smooth hover:text-paper"
        >
          VIEW OUR PROJECTS →
        </Link>
      </div>
    </div>
  );
}
