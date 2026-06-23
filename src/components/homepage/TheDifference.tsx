'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   TheDifference — "Why TDK"

   A breather + trust moment between the Projects reel and the Featured
   Residence. A young firm differentiates on philosophy, not track record, so
   the lead is the real edge: developer AND builder in one. Three editorial
   pillars support it. Deliberately scroll-light — one screen, no pin.

   Motion: headline clip-wipes per word (house language); each pillar's accent
   rule draws in (scaleX), then its copy fades up — staggered on enter.
   ─────────────────────────────────────────────────────────────────────────── */

interface Pillar {
  index: string;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    index: '01',
    title: 'End to End',
    body: 'Design, development and construction under one roof. One team is accountable from the first sketch to the handed keys — no subcontracted vision, no finger-pointing.',
  },
  {
    index: '02',
    title: 'Considered',
    body: 'Nothing is left to the site. Every junction, sightline and finish is resolved on paper long before a wall is poured. Restraint over excess.',
  },
  {
    index: '03',
    title: 'For Decades',
    body: 'We detail and build for how a home lives over thirty years — not for how it photographs on handover day. Materials are chosen to age with grace.',
  },
];

const LEAD = 'Developer and builder, in one.';

export default function TheDifference() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(section.querySelectorAll('.diff-word, .diff-fade'), {
        clipPath: 'none',
        opacity: 1,
        y: 0,
      });
      gsap.set(section.querySelectorAll('.diff-line'), { scaleX: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // Headline — clip-wipe per word.
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('.diff-word'),
          { clipPath: 'inset(0 100% 0 0)', y: '0.2em' },
          {
            clipPath: 'inset(0 0% 0 0)',
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: headingRef.current, start: 'top 80%' },
          },
        );
      }

      // Intro sub-line.
      gsap.fromTo(
        section.querySelectorAll('.diff-intro'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 70%' },
        },
      );

      // Pillars — accent rule draws in, then copy fades up.
      gsap.fromTo(
        section.querySelectorAll('.diff-line'),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: '.diff-grid', start: 'top 82%' },
        },
      );
      gsap.fromTo(
        section.querySelectorAll('.diff-fade'),
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: '.diff-grid', start: 'top 82%' },
        },
      );

      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-paper text-void">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-6 sm:py-28 md:px-10 md:py-32 lg:px-14 lg:py-40">
        {/* ── Lead ───────────────────────────────────────────────────────── */}
        <div className="max-w-4xl">
          <p className="mb-7 font-mono text-mono uppercase tracking-[0.3em] text-stone">
            Why TDK
          </p>
          <h2
            ref={headingRef}
            className="font-sans text-display-md font-[300] leading-[1.04] text-void"
          >
            {LEAD.split(' ').map((word, i) => (
              <span key={i} className="diff-word mr-[0.25em] inline-block">
                {word}
              </span>
            ))}
          </h2>
          <p className="diff-intro mt-8 max-w-2xl text-body-lg text-[rgba(13,13,13,0.66)]">
            Most developments pass through a dozen hands before they reach yours. Ours don&apos;t. We
            design, fund and build every TDK residence ourselves — so the intention you&apos;re shown
            is the home you receive.
          </p>
        </div>

        {/* ── Pillars ────────────────────────────────────────────────────── */}
        <div className="diff-grid mt-20 grid grid-cols-1 gap-x-12 gap-y-14 md:mt-28 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.index}>
              <div
                className="diff-line h-px w-full origin-left"
                style={{ backgroundColor: 'var(--color-threshold)' }}
              />
              <span className="diff-fade mt-6 block font-mono text-mono text-stone">{p.index}</span>
              <h3 className="diff-fade mt-4 font-sans text-heading font-[300] text-void">
                {p.title}
              </h3>
              <p className="diff-fade mt-4 max-w-[40ch] text-body text-[rgba(13,13,13,0.6)]">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
