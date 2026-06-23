'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   SceneMateriality — "The Materials"

   A scroll-through editorial sequence (deliberately NOT pinned — it gives the
   eye a breather after the big About→Projects reel). Five material plates land
   one after another in an alternating layout. Each plate:

     · reveals behind a clip-path WIPE as it enters (the site's house language),
     · its image breathes with a slow Ken-Burns scale + drift (scrub parallax),
     · its name uncovers on a horizontal clip-wipe, index + caption fade up.

   This replaces the lucide-icon "Our Craft" marquee in SceneBento — icons read
   as SaaS; macro photography of stone / timber / brass / concrete / light is
   what actually signals luxury (tactility, permanence).

   ⚠️ IMAGES: `image` currently points at the existing About renders as a
   TEMPORARY stand-in so the section renders today. Swap each one for real macro
   photography uploaded to the IDs noted in `targetId` (Cloudinary, cloud
   `konaverse`), then render via `cloudinaryUrl(targetId, { width: 1600 })`.
   ─────────────────────────────────────────────────────────────────────────── */

interface Material {
  index: string;
  name: string;
  origin: string;
  caption: string;
  /** Intended Cloudinary public ID for the real macro shot (upload, then swap). */
  targetId: string;
  /** TEMPORARY stand-in URL (existing asset) so the layout renders now. */
  image: string;
}

const MATERIALS: Material[] = [
  {
    index: '01',
    name: 'Stone',
    origin: 'Cyprus limestone',
    caption:
      'Quarried on the island and hand-finished, it carries the local light into every wall it builds.',
    targetId: 'clients/tdkdb/general/materiality/stone',
    image:
      'https://res.cloudinary.com/konaverse/image/upload/v1779212436/clients/tdkdb/general/about/first-origin.png',
  },
  {
    index: '02',
    name: 'Timber',
    origin: 'European oak',
    caption:
      'Warm underfoot and overhead — oiled by hand so the grain only deepens with the years.',
    targetId: 'clients/tdkdb/general/materiality/timber',
    image:
      'https://res.cloudinary.com/konaverse/image/upload/v1779212437/clients/tdkdb/general/about/second-design-philosophy.png',
  },
  {
    index: '03',
    name: 'Brass',
    origin: 'Brushed bronze & brass',
    caption:
      'Fixtures chosen to patina rather than tarnish — the kind of detail you notice with your fingertips.',
    targetId: 'clients/tdkdb/general/materiality/brass',
    image:
      'https://res.cloudinary.com/konaverse/image/upload/v1779212434/clients/tdkdb/general/about/third-construction.png',
  },
  {
    index: '04',
    name: 'Concrete',
    origin: 'Board-formed concrete',
    caption:
      'Cast against timber so the grain stays printed in the surface — structure made tactile.',
    targetId: 'clients/tdkdb/general/materiality/concrete',
    image:
      'https://res.cloudinary.com/konaverse/image/upload/v1779212432/clients/tdkdb/general/about/fourth-people.png',
  },
  {
    index: '05',
    name: 'Light',
    origin: 'Natural light',
    caption:
      'The first material we design around — shaped by aperture, depth and orientation long before any finish.',
    targetId: 'clients/tdkdb/general/materiality/light',
    image:
      'https://res.cloudinary.com/konaverse/image/upload/v1779212428/clients/tdkdb/general/about/fifth-vision.png',
  },
];

export default function SceneMateriality() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const metaRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    // Reduced motion — reveal everything in place, no wipes / parallax.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(
        [
          headingRef.current,
          ...frameRefs.current,
          ...metaRefs.current.flatMap((m) => (m ? Array.from(m.children) : [])),
        ].filter(Boolean),
        { clipPath: 'none', opacity: 1, y: 0 },
      );
      frameRefs.current.forEach((f) => f && (f.style.clipPath = 'none'));
      return;
    }

    const ctx = gsap.context(() => {
      // ── Intro heading — clip-wipe per word (brand connective language) ──────
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current.querySelectorAll('.mat-word'),
          { clipPath: 'inset(0 100% 0 0)', y: '0.25em' },
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

      // ── Per-material plate ──────────────────────────────────────────────────
      MATERIALS.forEach((_, i) => {
        const frame = frameRefs.current[i];
        const img = imgRefs.current[i];
        const meta = metaRefs.current[i];
        const fromTop = i % 2 === 0; // alternate wipe direction for rhythm

        // Frame clip-wipe reveal on enter.
        if (frame) {
          gsap.fromTo(
            frame,
            { clipPath: fromTop ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)' },
            {
              clipPath: 'inset(0% 0 0% 0)',
              duration: 1.15,
              ease: 'power3.out',
              scrollTrigger: { trigger: frame, start: 'top 82%' },
            },
          );
        }

        // Image Ken-Burns + drift across the whole scroll span (scale ≥ 1.02 and
        // a 115%-tall image keep it covering through the ±drift — no edge gaps).
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.12, yPercent: -4 },
            {
              scale: 1.02,
              yPercent: 4,
              ease: 'none',
              scrollTrigger: {
                trigger: frame,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
        }

        // Meta: name uncovers on a clip-wipe, index + caption fade up.
        if (meta) {
          const name = meta.querySelector('.mat-name');
          const fades = meta.querySelectorAll('.mat-fade');
          if (name) {
            gsap.fromTo(
              name,
              { clipPath: 'inset(0 100% 0 0)' },
              {
                clipPath: 'inset(0 0% 0 0)',
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: meta, start: 'top 80%' },
              },
            );
          }
          gsap.fromTo(
            fades,
            { opacity: 0, y: 18 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: { trigger: meta, start: 'top 80%' },
            },
          );
        }
      });

      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-void text-paper">
      <div className="mx-auto max-w-[1600px] px-4 py-24 sm:px-6 sm:py-28 md:px-10 md:py-36 lg:px-14 lg:py-44">
        {/* ── Intro ──────────────────────────────────────────────────────── */}
        <div className="mb-20 max-w-4xl md:mb-28 lg:mb-36">
          <p className="mb-6 font-mono text-mono uppercase tracking-[0.3em] text-stone">
            Materiality
          </p>
          <h2
            ref={headingRef}
            className="font-sans text-display-md font-[300] leading-[1.05] text-paper"
          >
            {'Luxury is what your hand remembers.'.split(' ').map((word, i) => (
              <span key={i} className="mat-word mr-[0.25em] inline-block">
                {word}
              </span>
            ))}
          </h2>
          <p className="mt-8 max-w-2xl text-body text-white/60">
            We build in materials chosen to age with grace — quarried, milled and finished by hand.
            What follows is the palette behind every TDK residence.
          </p>
        </div>

        {/* ── Material plates ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-24 md:gap-32 lg:gap-44">
          {MATERIALS.map((m, i) => {
            const imageLeft = i % 2 === 0;
            return (
              <article
                key={m.targetId}
                className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14"
              >
                {/* Image plate */}
                <div
                  ref={(el) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`relative aspect-[4/5] overflow-hidden rounded-sm will-change-[clip-path] sm:aspect-[3/2] lg:col-span-7 lg:aspect-[4/3] ${
                    imageLeft ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <img
                    ref={(el) => {
                      imgRefs.current[i] = el;
                    }}
                    src={m.image}
                    alt={`${m.name} — ${m.origin}`}
                    loading="lazy"
                    className="absolute left-0 top-[-7.5%] h-[115%] w-full object-cover will-change-transform"
                  />
                </div>

                {/* Meta */}
                <div
                  ref={(el) => {
                    metaRefs.current[i] = el;
                  }}
                  className={`lg:col-span-5 ${
                    imageLeft ? 'lg:order-2 lg:pl-4' : 'lg:order-1 lg:pr-4 lg:text-right'
                  }`}
                >
                  <span className="mat-fade block font-mono text-mono text-stone">
                    {m.index}&thinsp;/&thinsp;{String(MATERIALS.length).padStart(2, '0')}
                  </span>
                  <h3 className="mat-name mt-4 inline-block font-sans text-display-lg font-[300] leading-[0.95] text-paper">
                    {m.name}
                  </h3>
                  <p
                    className="mat-fade mt-4 font-mono text-mono uppercase tracking-[0.25em]"
                    style={{ color: 'var(--color-threshold)' }}
                  >
                    {m.origin}
                  </p>
                  <p
                    className={`mat-fade mt-6 max-w-[42ch] text-body-lg text-white/65 ${
                      imageLeft ? '' : 'lg:ml-auto'
                    }`}
                  >
                    {m.caption}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Close ──────────────────────────────────────────────────────── */}
        <div className="mt-28 border-t border-white/10 pt-12 md:mt-36 lg:mt-44">
          <Link
            href="/en/services"
            data-cursor="view"
            className="inline-flex items-center gap-4 text-label uppercase tracking-[0.25em] text-paper transition-colors duration-300 hover:text-white/60"
          >
            Explore our craft
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
