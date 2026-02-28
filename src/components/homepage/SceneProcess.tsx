'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'VISION',
    description:
      'We begin with a conversation. Not a brief. We need to understand how you want to live before we draw a single line.',
  },
  {
    number: '02',
    title: 'DESIGN',
    description:
      'Architecture that responds to your specific life — your light, your family, your relationship with the city.',
  },
  {
    number: '03',
    title: 'ENGINEERING',
    description:
      'Structure, systems, and compliance fully resolved. Nothing is left to chance on a building site.',
  },
  {
    number: '04',
    title: 'BUILD',
    description:
      "Construction managed to the millimetre. We don't hand off to a contractor — we stay present.",
  },
  {
    number: '05',
    title: 'HANDOVER',
    description:
      'The moment the door opens for the first time. Every detail checked. Every system explained. The beginning of your story.',
  },
];

// SVG viewBox runs 0–100. Ticks at equal quarters.
const TICK_Y = [0, 25, 50, 75, 100] as const;

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")";

// ─── Component ────────────────────────────────────────────────────────────────

export default function SceneProcess() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const hrRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<SVGLineElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[]>([]);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closingRef = useRef<HTMLParagraphElement>(null);

  const [isMobile, setIsMobile] = useState(false);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Mobile: IntersectionObserver reveals ──────────────────────────────────
  useEffect(() => {
    if (!isMobile) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      if (headingRef.current) headingRef.current.style.clipPath = 'inset(0 0% 0 0)';
      stepRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      if (closingRef.current) closingRef.current.style.clipPath = 'inset(0 0% 0 0)';
      return;
    }

    gsapInit();
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(el, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
            obs.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    const closing = closingRef.current;
    if (closing) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(closing, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power4.out' });
            obs.disconnect();
          }
        },
        { threshold: 0.5 },
      );
      obs.observe(closing);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [isMobile]);

  // ── Desktop: GSAP scrub ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (isMobile) return;

    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      if (headingRef.current) headingRef.current.style.clipPath = 'inset(0 0% 0 0)';
      if (hrRef.current) hrRef.current.style.opacity = '1';
      stepRefs.current.forEach((el) => {
        if (!el) return;
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      tickRefs.current.forEach((el) => {
        if (el) el.setAttribute('opacity', '1');
      });
      if (progressLineRef.current) progressLineRef.current.style.strokeDashoffset = '0';
      if (closingRef.current) closingRef.current.style.clipPath = 'inset(0 0% 0 0)';
      return;
    }

    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.fromTo(
        headingRef.current,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.8,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // HR fade — 200ms after heading completes
      gsap.fromTo(
        hrRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          delay: 1.0,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        },
      );

      // Scrubbed timeline — CSS sticky handles pinning, GSAP scrubs only
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });

      // Spine draws top-to-bottom via CSS strokeDashoffset (NOT attr plugin)
      tl.to(progressLineRef.current, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);

      // Tick + step at each quarter of the timeline
      STEPS.forEach((_, i) => {
        const pos = i / (STEPS.length - 1); // 0, 0.25, 0.5, 0.75, 1

        tl.to(tickRefs.current[i], { opacity: 1, duration: 0.05, ease: 'none' }, pos);

        tl.to(
          stepRefs.current[i],
          { opacity: 1, x: 0, duration: 0.12, ease: 'power4.out' },
          pos,
        );
      });

      // Closing line
      tl.to(
        closingRef.current,
        { clipPath: 'inset(0 0% 0 0)', duration: 0.15, ease: 'power4.out' },
        0.92,
      );
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  // ── Shared grain overlay ──────────────────────────────────────────────────
  const grain = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: GRAIN_URL,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        opacity: 0.035,
        zIndex: 0,
      }}
    />
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="relative overflow-hidden"
        style={{ backgroundColor: '#111009' }}
      >
        {grain}
        <div className="relative px-8 py-20" style={{ zIndex: 1 }}>
          <p
            ref={headingRef}
            className="text-label tracking-[0.2em]"
            style={{ color: 'var(--color-stone)', clipPath: 'inset(0 100% 0 0)' }}
          >
            HOW WE BUILD
          </p>

          <div className="mt-12 space-y-12">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                style={{
                  opacity: 0,
                  transform: 'translateX(-16px)',
                  borderLeft: '1px solid var(--color-border)',
                  paddingLeft: '24px',
                }}
              >
                <span className="text-mono" style={{ color: 'var(--color-threshold)' }}>
                  {step.number}
                </span>
                <h3
                  className="text-heading"
                  style={{ color: 'var(--color-paper)', marginTop: '8px' }}
                >
                  {step.title}
                </h3>
                <p className="text-body" style={{ color: 'var(--color-stone)', marginTop: '12px' }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <p
            ref={closingRef}
            className="text-display-md text-center font-[300]"
            style={{
              color: 'var(--color-paper)',
              marginTop: '80px',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            Every project. Every time.
          </p>
        </div>
      </section>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────
  // 200vh outer section → 100vh of scroll travel for the scrub animation.
  // The sticky inner panel stays at full viewport height; all content is
  // in-flow so nothing can overflow or overlap.
  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ height: '200vh', backgroundColor: '#111009' }}
    >
      {grain}

      {/* Sticky panel — flex column, heading in-flow at top, grid fills middle, closing at bottom */}
      <div
        className="sticky top-0 flex h-screen flex-col"
        style={{
          paddingLeft: 'clamp(40px, 8vw, 120px)',
          paddingRight: 'clamp(40px, 8vw, 120px)',
          paddingTop: '64px',
          paddingBottom: '48px',
          zIndex: 1,
        }}
      >
        {/* Heading — in-flow at top */}
        <div className="flex-none">
          <p
            ref={headingRef}
            className="text-label tracking-[0.2em]"
            style={{ color: 'var(--color-stone)', clipPath: 'inset(0 100% 0 0)' }}
          >
            HOW WE BUILD
          </p>
          <div
            ref={hrRef}
            style={{
              width: '48px',
              height: '1px',
              backgroundColor: 'var(--color-border)',
              marginTop: '12px',
              opacity: 0,
            }}
          />
        </div>

        {/* Two-column grid — fills all remaining space between heading and closing */}
        <div className="mt-8 grid min-h-0 flex-1" style={{ gridTemplateColumns: '40% 60%' }}>
          {/* Left: SVG vertical spine — fills full column height */}
          <div className="flex h-full items-center justify-center">
            <svg
              viewBox="0 0 2 100"
              preserveAspectRatio="none"
              style={{ width: '2px', height: '100%', display: 'block', margin: '0 auto' }}
            >
              {/* Ghost line — always visible */}
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="100"
                stroke="var(--color-border)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              {/* Progress line — CSS strokeDashoffset animated by GSAP */}
              <line
                ref={progressLineRef}
                x1="1"
                y1="0"
                x2="1"
                y2="100"
                stroke="var(--color-threshold)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
              />
              {/* Tick marks — revealed as line reaches each position */}
              {TICK_Y.map((y, i) => (
                <line
                  key={y}
                  ref={(el) => {
                    tickRefs.current[i] = el;
                  }}
                  x1="-6"
                  y1={y}
                  x2="8"
                  y2={y}
                  stroke="var(--color-threshold)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  opacity="0"
                />
              ))}
            </svg>
          </div>

          {/* Right: Step content — evenly distributed top-to-bottom to align with ticks */}
          <div className="flex h-full flex-col justify-between">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                style={{ opacity: 0, transform: 'translateX(20px)' }}
              >
                <span className="text-mono" style={{ color: 'var(--color-threshold)' }}>
                  {step.number}
                </span>
                <h3
                  className="text-heading"
                  style={{ color: 'var(--color-paper)', marginTop: '8px' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-body"
                  style={{ color: 'var(--color-stone)', maxWidth: '260px', marginTop: '12px' }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Closing line — pinned to the bottom of the sticky panel */}
        <p
          ref={closingRef}
          className="mt-auto text-center text-display-md font-[300]"
          style={{
            color: 'var(--color-paper)',
            clipPath: 'inset(0 100% 0 0)',
          }}
        >
          Every project. Every time.
        </p>
      </div>
    </section>
  );
}
