'use client';

import { useRef, useLayoutEffect } from 'react';
import { gsap, ScrollTrigger } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

// The 5 philosophy statements (from TDK_HOMEPAGE_EXPERIENCE.md Section 9)
const STATEMENTS = [
  {
    lines: ["We don't build buildings.", 'We build the conditions for life.'],
    sizeClass: 'text-display-md',
    fontWeight: 300,
  },
  {
    lines: ['Architecture is not decoration.', 'It is decision-making made visible.'],
    sizeClass: 'text-display-md',
    fontWeight: 300,
  },
  {
    lines: ['Every project begins with a question:', 'How should this family live?'],
    sizeClass: 'text-display-lg',
    fontWeight: 400,
  },
  {
    lines: ['TDK was founded on one belief:', 'Good design is non-negotiable.'],
    sizeClass: 'text-display-md',
    fontWeight: 300,
  },
];

// Flash images (Cloudinary IDs) — appear between statement transitions
const FLASH_IMAGE_IDS = [
  'clients/tdkdb/armonia/exterior/armonia_front_angle_day', // between 1→2
  'clients/tdkdb/armonia/interior/2', // between 2→3
  'clients/tdkdb/armonia/interior/3', // between 3→4
  'clients/tdkdb/armonia/exterior/1', // between 4→5
];

// Scroll offset (in vh units out of 120) where each statement enters
const STMT_OFFSETS = [0, 24, 48, 72, 96];

export default function ScenePhilosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const statementRefs = useRef<(HTMLDivElement | null)[]>(Array(STATEMENTS.length).fill(null));
  const armoniaRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const flashRefs = useRef<(HTMLDivElement | null)[]>(Array(FLASH_IMAGE_IDS.length).fill(null));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // totalScroll = how many pixels the user scrolls through this section
      // Container is 220vh; sticky section is 100vh → 120vh of effective scroll
      const totalScroll = container.offsetHeight - window.innerHeight;

      // Convert a fraction of the 120vh scroll range to pixel offset
      const px = (vh120frac: number) => Math.round(vh120frac * totalScroll);

      // Pre-create flash timelines (paused) so they can be restarted on scroll
      const flashTimelines = flashRefs.current.map((el) => {
        if (!el) return null;
        return gsap
          .timeline({ paused: true })
          .to(el, { opacity: 0.65, duration: 0.25, ease: 'power2.out' })
          .to(el, { opacity: 0, duration: 0.25, ease: 'power2.in' });
      });

      // --- Statements 1–4: clip-path reveal + opacity exit ---
      statementRefs.current.forEach((el, i) => {
        if (!el) return;

        const enterFrac = STMT_OFFSETS[i] / 120;

        // Clip-path reveal: left → right sweep
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: `top+=${px(enterFrac)} top`,
              end: `top+=${px(enterFrac + 0.1)} top`,
              scrub: 1,
            },
          },
        );

        // Opacity exit (fade out as the next statement approaches)
        const exitFrac = enterFrac + 0.16;
        gsap.fromTo(
          el,
          { opacity: 1 },
          {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: `top+=${px(exitFrac)} top`,
              end: `top+=${px(exitFrac + 0.05)} top`,
              scrub: 1,
            },
          },
        );
      });

      // --- Statement 5 — ARMONIA: clip-path reveal (no exit — lingers) ---
      if (armoniaRef.current) {
        const enterFrac = STMT_OFFSETS[4] / 120;
        gsap.fromTo(
          armoniaRef.current,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)',
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: `top+=${px(enterFrac)} top`,
              end: `top+=${px(enterFrac + 0.1)} top`,
              scrub: 1,
            },
          },
        );
      }

      // "Lakatameia, Nicosia." — delayed opacity reveal after ARMONIA finishes
      if (subtitleRef.current) {
        const enterFrac = (STMT_OFFSETS[4] + 12) / 120;
        gsap.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: `top+=${px(enterFrac)} top`,
              end: `top+=${px(enterFrac + 0.06)} top`,
              scrub: 1,
            },
          },
        );
      }

      // --- Flash images: pulse (0 → 0.65 → 0) at transition zones ---
      flashRefs.current.forEach((el, i) => {
        if (!el) return;
        const tl = flashTimelines[i];
        if (!tl) return;

        // Fire when scroll reaches the exit zone of statement i
        const flashFrac = (STMT_OFFSETS[i] + 18) / 120;

        ScrollTrigger.create({
          trigger: container,
          start: `top+=${px(flashFrac)} top`,
          onEnter: () => tl.restart(),
          onEnterBack: () => tl.restart(),
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Warmth drift keyframe animation */}
      <style>{`
        @keyframes philosophy-warmth {
          from { background-color: #0D0D0D; }
          to   { background-color: #0F0B08; }
        }
      `}</style>

      {/* SVG noise filter for grain overlay */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'visible' }}
      >
        <defs>
          <filter id="philosophy-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/* Outer scroll container: 220vh → 120vh of effective sticky scroll */}
      <div ref={containerRef} style={{ height: '220vh' }} className="relative">
        {/* Sticky viewport section */}
        <section
          className="sticky top-0 h-screen overflow-hidden"
          style={{ animation: 'philosophy-warmth 8s ease-in-out infinite alternate' }}
          aria-label="TDK Philosophy"
        >
          {/* Grain overlay — sits above flash images and text, barely visible */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-[0.04]"
            style={{ filter: 'url(#philosophy-noise)', mixBlendMode: 'overlay' }}
          />

          {/* Flash images — revealed briefly between statement transitions */}
          {FLASH_IMAGE_IDS.map((id, i) => (
            <div
              key={id}
              ref={(el) => {
                flashRefs.current[i] = el;
              }}
              aria-hidden="true"
              className="absolute inset-0 z-[1]"
              style={{ opacity: 0 }}
            >
              <img
                src={cloudinaryUrl(id, { width: 1920 })}
                alt=""
                className="h-full w-full object-cover"
                style={{ filter: 'grayscale(1) contrast(1.1)' }}
              />
            </div>
          ))}

          {/* Statements 1–4 — each occupies the full screen, revealed by clip-path */}
          {STATEMENTS.map((stmt, i) => (
            <div
              key={i}
              ref={(el) => {
                statementRefs.current[i] = el;
              }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center"
              style={{ clipPath: 'inset(0 100% 0 0)' }}
            >
              {stmt.lines.map((line, j) => (
                <p
                  key={j}
                  className={`${stmt.sizeClass} font-sans leading-tight text-paper`}
                  style={{ fontWeight: stmt.fontWeight }}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}

          {/* Statement 5 — ARMONIA (largest text on the page, no exit) */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center">
            {/* The clip-path reveal wraps only the main text, not the subtitle */}
            <div ref={armoniaRef} style={{ clipPath: 'inset(0 100% 0 0)' }}>
              <p className="font-sans text-display-md font-light leading-tight text-paper">
                This is what we build.
              </p>
              <p
                className="font-sans font-light text-paper"
                style={{
                  fontSize: 'clamp(72px, 12vw, 160px)',
                  letterSpacing: '0.1em',
                  lineHeight: 1.05,
                }}
              >
                ARMONIA.
              </p>
            </div>
            {/* Subtitle fades in after ARMONIA finishes revealing */}
            <p ref={subtitleRef} className="mt-4 text-label text-stone" style={{ opacity: 0 }}>
              Lakatameia, Nicosia.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
