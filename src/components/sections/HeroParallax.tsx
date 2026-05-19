'use client';

import { useRef, useLayoutEffect } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/animations/gsap';

import skyImg from '../../../public/hero/sky.webp';
import mountainsImg from '../../../public/hero/mountains.webp';
import caveImg from '../../../public/hero/cave.webp';
import manImg from '../../../public/hero/man.webp';
import groundImg from '../../../public/hero/ground.webp';

export default function HeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLImageElement>(null);
  const mountainsRef = useRef<HTMLImageElement>(null);
  const caveRef = useRef<HTMLImageElement>(null);
  const groundRef = useRef<HTMLImageElement>(null);
  const manRef = useRef<HTMLImageElement>(null);
  const tdkbMarkRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(skyRef.current, { scale: 1.1, xPercent: -5, opacity: 1 });
        gsap.set(mountainsRef.current, { scale: 0.8, opacity: 1 });
        gsap.set(caveRef.current, { scale: 1.0, opacity: 1 });
        gsap.set(groundRef.current, { yPercent: 0, opacity: 1 });
        gsap.set(manRef.current, { yPercent: 0, opacity: 1 });
        gsap.set(tdkbMarkRef.current, { opacity: 0 });
        gsap.set(headlineRef.current, { opacity: 1, y: 0 });
        return;
      }

      // Initial CSS state for intro
      gsap.set(skyRef.current, { scale: 1.6, opacity: 1, xPercent: 0 });
      gsap.set(mountainsRef.current, { scale: 1.4, opacity: 0 });
      gsap.set(caveRef.current, { scale: 2.5, opacity: 1 });
      gsap.set(groundRef.current, { yPercent: 150, scale: 2.5, opacity: 1 });
      gsap.set(manRef.current, { yPercent: 150, scale: 2.5, opacity: 1 });
      gsap.set(tdkbMarkRef.current, { y: 40, scale: 0.9, opacity: 0 });
      gsap.set(headlineRef.current, { y: 30, opacity: 0 });

      // Intro Timeline — total ~1.2s (1.0s base + 0.2s offset on TDKDB)
      gsap
        .timeline({ defaults: { ease: 'power3.out', duration: 1.0 } })
        .to(skyRef.current, { scale: 1.6 }, 0)
        .to(mountainsRef.current, { opacity: 1, scale: 1.4 }, 0)
        .to(tdkbMarkRef.current, { opacity: 1, y: 0, scale: 1 }, 0.05);

      // Master scroll-scrubbed timeline.
      // ONE pin + ONE scrubbed timeline split into 3 windows by position parameter.
      // This is the canonical GSAP pattern for multi-stage pinned animation —
      // separate ScrollTriggers with `+=%` offsets on the same pinned trigger
      // collapse their fire ranges near the end of the pin (the symptom you saw).
      const isMobile = window.innerWidth < 768;
      const xDriftSky1 = isMobile ? -1.5 : -3;
      const xDriftSky2 = isMobile ? -2.5 : -5;
      const xDriftSky3 = isMobile ? -3.5 : -7;

      const masterTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=400%',
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          id: 'hero-parallax-master',
        },
      });

      // Each window is 1 unit of timeline time → maps to 1/3 of the pin (133.333vh).
      masterTl
        // --- Window 1 (0 → 1): assembly ---
        .to(skyRef.current, { scale: 1.1, xPercent: xDriftSky1, duration: 1 }, 0)
        .to(mountainsRef.current, { scale: 1.0, duration: 1 }, 0)
        .fromTo(
          tdkbMarkRef.current,
          { scale: 1, y: 0, opacity: 1 },
          { scale: 1.15, y: -40, opacity: 0, duration: 0.25, immediateRender: false },
          0.001,
        ) // Fixes timeline conflict
        .to(caveRef.current, { scale: 1.3, duration: 1 }, 0)
        .to(groundRef.current, { yPercent: 0, scale: 1.0, duration: 1 }, 0)
        .to(manRef.current, { yPercent: 0, scale: 1.0, duration: 1 }, 0)

        // --- Window 2 (1 → 2): composition holds, headline reveals ---
        .to(skyRef.current, { xPercent: xDriftSky2, duration: 1 }, 1)
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 1 }, 1)

        // --- Window 3 (2 → 3): exit. Layers hold; man slides off-screen ---
        .to(groundRef.current, { scale: 1.1, duration: 1 }, 2)
        .to(manRef.current, { scale: 1.1, duration: 1 }, 2)
        .to(caveRef.current, { scale: 1.3, duration: 1 }, 2)
        .to(skyRef.current, { xPercent: xDriftSky3, scale: 1.5, duration: 1 }, 2);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen w-screen overflow-hidden bg-void">
      {/* Sky (z-1) */}
      <div className="absolute inset-0 z-[1] will-change-transform">
        <Image
          ref={skyRef}
          src={skyImg}
          alt="Sky"
          fill
          priority
          className="object-cover object-center will-change-transform"
        />
      </div>

      {/* Mountains (z-2) */}
      <div className="absolute inset-0 z-[2] will-change-transform">
        <Image
          ref={mountainsRef}
          src={mountainsImg}
          alt="Mountains"
          fill
          priority
          className="object-cover object-center will-change-transform"
        />
      </div>

      {/* Ground (z-3) */}
      <div className="pointer-events-none absolute inset-0 z-[3] will-change-transform">
        <Image
          ref={groundRef}
          src={groundImg}
          alt="Ground"
          fill
          priority
          className="object-cover object-bottom will-change-transform"
        />
      </div>

      {/* Cave (z-4) */}
      <div className="pointer-events-none absolute inset-0 z-[4] will-change-transform">
        <Image
          ref={caveRef}
          src={caveImg}
          alt="Cave frame"
          fill
          priority
          className="object-cover object-center will-change-transform"
        />
      </div>

      {/* Headline (z-5) */}
      <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
        <div className="overflow-hidden">
          <h1
            ref={headlineRef}
            className="px-4 text-center font-sans leading-none tracking-tight text-paper will-change-transform"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', fontWeight: 600 }}
          >
            HOUSE YOUR DREAM
          </h1>
        </div>
      </div>

      {/* Man (z-6) */}
      <div className="pointer-events-none absolute inset-0 z-[6] will-change-transform">
        <Image
          ref={manRef}
          src={manImg}
          alt="Man looking at landscape"
          fill
          priority
          className="object-cover object-bottom will-change-transform"
        />
      </div>

      {/* TDKDB Mark */}
      <div
        ref={tdkbMarkRef}
        className="pointer-events-none absolute bottom-12 left-6 z-[10] font-sans leading-none tracking-widest text-paper will-change-transform md:left-12"
        style={{ fontSize: 'clamp(4rem, 14vw, 12rem)', fontWeight: 300 }}
      >
        TDKDB
      </div>
    </section>
  );
}
