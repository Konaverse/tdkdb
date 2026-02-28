'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import Button from '@/components/ui/Button';

const WORDS = ["LET'S", 'BUILD', 'SOMETHING', 'TOGETHER.'];

export default function SceneContact() {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const buttonWrapRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // SVG background drift — no ScrollTrigger, always plays
      if (svgRef.current) {
        gsap.to(svgRef.current, { y: -20, duration: 20, ease: 'none', repeat: -1, yoyo: true });
      }

      // Word clip-path reveals
      gsap.fromTo(
        wordRefs.current.filter(Boolean),
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          stagger: 0.06,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Button entrance
      gsap.fromTo(
        buttonWrapRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.5,
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Info line entrance
      gsap.fromTo(
        infoRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          delay: 0.8,
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-void">
      {/* SVG background — floor plan suggestion */}
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Outer perimeter */}
        <rect x="100" y="80" width="1000" height="640" stroke="white" strokeWidth="2" />
        {/* Interior walls */}
        <line x1="100" y1="300" x2="580" y2="300" stroke="white" strokeWidth="1.5" />
        <line x1="580" y1="80" x2="580" y2="480" stroke="white" strokeWidth="1.5" />
        <line x1="580" y1="480" x2="1100" y2="480" stroke="white" strokeWidth="1.5" />
        <line x1="760" y1="80" x2="760" y2="300" stroke="white" strokeWidth="1.5" />
        <line x1="760" y1="300" x2="1100" y2="300" stroke="white" strokeWidth="1.5" />
        {/* Room details */}
        <line x1="100" y1="480" x2="380" y2="480" stroke="white" strokeWidth="1" />
        <line x1="380" y1="300" x2="380" y2="720" stroke="white" strokeWidth="1" />
        <line x1="760" y1="480" x2="760" y2="720" stroke="white" strokeWidth="1" />
        {/* Door arcs */}
        <path d="M 380 480 Q 420 480 420 440" stroke="white" strokeWidth="1" fill="none" />
        <path d="M 580 300 Q 580 340 620 340" stroke="white" strokeWidth="1" fill="none" />
        {/* Window marks */}
        <line x1="280" y1="80" x2="360" y2="80" stroke="white" strokeWidth="3" />
        <line x1="650" y1="80" x2="730" y2="80" stroke="white" strokeWidth="3" />
        <line x1="900" y1="80" x2="1000" y2="80" stroke="white" strokeWidth="3" />
        <line x1="100" y1="180" x2="100" y2="260" stroke="white" strokeWidth="3" />
        <line x1="1100" y1="380" x2="1100" y2="460" stroke="white" strokeWidth="3" />
      </svg>

      {/* Centered content */}
      <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
        {/* Headline */}
        <h2 className="mb-12 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2 text-display-xl font-[300] text-paper">
          {WORDS.map((word, i) => (
            <span key={word} className="overflow-hidden">
              <span
                ref={(el) => {
                  wordRefs.current[i] = el;
                }}
                className="inline-block"
              >
                {word}
              </span>
            </span>
          ))}
        </h2>

        {/* CTA Button */}
        <div ref={buttonWrapRef} style={{ opacity: 0 }}>
          <Button href="/en/contact" variant="primary" size="lg" magnetic>
            START A CONVERSATION
          </Button>
        </div>

        {/* Secondary info */}
        <p
          ref={infoRef}
          className="mt-10 text-label tracking-[0.2em] text-stone"
          style={{ opacity: 0 }}
        >
          info@tdkdb.com&ensp;—&ensp;+357 22 000 000
        </p>
      </div>
    </section>
  );
}
