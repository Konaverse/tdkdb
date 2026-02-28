'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

interface Panel {
  imageId: string;
  line1: string;
  line2: string;
  subtitle?: string;
}

const PANELS: Panel[] = [
  {
    imageId: 'clients/tdkdb/philosophy/concrete-textiure',
    line1: "We don't build buildings.",
    line2: 'We build the conditions for life.',
  },
  {
    imageId: 'clients/tdkdb/philosophy/floor-plan-hands',
    line1: 'Architecture is not decoration.',
    line2: 'It is decision-making made visible.',
  },
  {
    imageId: 'clients/tdkdb/philosophy/window-frame',
    line1: 'Every project begins with a question:',
    line2: 'How should this family live?',
  },
  {
    imageId: 'clients/tdkdb/philosophy/light-shafts',
    line1: 'TDK was founded on one belief:',
    line2: 'Good design is non-negotiable.',
  },
  {
    imageId: 'clients/tdkdb/armonia/exterior/1',
    line1: 'This is what we build.',
    line2: 'ARMONIA.',
    subtitle: 'Lakatameia, Nicosia.',
  },
];

// How long (ms) after the last scroll frame before snapping to the nearest panel.
const SNAP_DELAY = 100;

export default function ScenePhilosophy() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();

    const container = containerRef.current;
    const strip = stripRef.current;
    if (!container || !strip) return;

    let snapTimeout: ReturnType<typeof setTimeout> | null = null;
    // Prevents real-time tracking from killing an in-flight snap tween.
    let isSnapping = false;
    // Progress at snap initiation — used to detect genuine user re-scroll.
    let snapProgress = 0;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        onRefresh: (self) => {
          // Fires on every ScrollTrigger.refresh() — window resize and our
          // manual HomepageCanvas-load calls. Resets to the nearest panel at
          // the current (possibly new) viewport width so pixel values stay correct.
          if (snapTimeout) clearTimeout(snapTimeout);
          snapTimeout = null;
          isSnapping = false;
          gsap.killTweensOf(strip);
          const panel = Math.round(self.progress * (PANELS.length - 1));
          gsap.set(strip, { x: -panel * window.innerWidth });
        },

        onUpdate: (self) => {
          if (!self.isActive) return;

          // If a snap is running, only cancel it when the user has genuinely
          // re-scrolled (>1% of total travel). Lenis micro-jitter is ≤0.002.
          if (isSnapping) {
            if (Math.abs(self.progress - snapProgress) < 0.01) return;
            isSnapping = false;
            gsap.killTweensOf(strip);
          }

          // Real-time 1:1 tracking — explicit kill then instant set avoids
          // any ambiguity between competing tweens.
          gsap.killTweensOf(strip);
          gsap.set(strip, {
            x: -self.progress * (PANELS.length - 1) * window.innerWidth,
          });

          // Debounced snap: fires SNAP_DELAY ms after the last scroll frame.
          // `p` captures progress at the moment scrolling went quiet.
          if (snapTimeout) clearTimeout(snapTimeout);
          const p = self.progress;
          snapTimeout = setTimeout(() => {
            snapTimeout = null;
            const target = Math.round(p * (PANELS.length - 1));
            isSnapping = true;
            snapProgress = p;
            gsap.to(strip, {
              x: -target * window.innerWidth,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => {
                isSnapping = false;
              },
            });
          }, SNAP_DELAY);
        },

        onLeaveBack: () => {
          // Instant reset — a tween here would still be running when the
          // section re-enters from below, making panels move before viewport.
          if (snapTimeout) clearTimeout(snapTimeout);
          snapTimeout = null;
          isSnapping = false;
          gsap.killTweensOf(strip);
          gsap.set(strip, { x: 0 });
        },

        onLeave: () => {
          if (snapTimeout) clearTimeout(snapTimeout);
          snapTimeout = null;
          isSnapping = false;
        },
      });
    }, container);

    // ─── Position fix for dynamic HomepageCanvas ──────────────────────────────
    // HomepageCanvas is dynamic({ ssr: false }) — a sibling component that adds
    // 260vh to the document AFTER this effect runs. ScrollTrigger calculated
    // positions from the SSR DOM (without those 260vh), so they are ~260vh too
    // early. We refresh positions as soon as the layout change is detected.

    const initialBodyHeight = document.body.scrollHeight;

    // Case A: HomepageCanvas loads after this effect — ResizeObserver fires once
    // when the 260vh container is inserted and corrects trigger positions.
    const heightObserver = new ResizeObserver(() => {
      if (document.body.scrollHeight !== initialBodyHeight) {
        ScrollTrigger.refresh();
        heightObserver.disconnect();
      }
    });
    heightObserver.observe(document.body);

    // Case B: HomepageCanvas was prefetched and already rendered — rAF refresh
    // picks up the already-correct layout on the next frame.
    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      cancelAnimationFrame(rafId);
      heightObserver.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ height: '500vh' }}>
      <section className="sticky top-0 h-screen overflow-hidden">
        <div ref={stripRef} className="flex h-full" style={{ width: `${PANELS.length * 100}vw` }}>
          {PANELS.map((panel, i) => (
            <div key={i} className="relative h-full w-screen flex-shrink-0 overflow-hidden">
              {/* Full-bleed background image */}
              <img
                src={cloudinaryUrl(panel.imageId, { width: 1920 })}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                aria-hidden="true"
              />

              {/* Dark scrim for text legibility */}
              <div className="absolute inset-0 bg-black/45" />

              {/* Statement text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <p className="font-sans text-display-md font-[300] text-paper">{panel.line1}</p>
                <p className="font-sans text-display-md font-[300] text-paper">{panel.line2}</p>
                {panel.subtitle && (
                  <p className="mt-4 font-sans text-label font-[300] uppercase tracking-[0.3em] text-stone">
                    {panel.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
