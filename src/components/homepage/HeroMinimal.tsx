'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';
import Button from '@/components/ui/Button';
import { LampContainer } from '@/components/ui/lamp';
import HeroTitleContent from './HeroTitleContent';
import { useIntro } from './IntroProvider';

const PARAGRAPH =
  'TDK Design & Build is a Cyprus-based developer crafting residences and mixed-use buildings — bound not by trend or scale but by a hunger to bring intention, craft, and clarity to every detail.';

/* ─── HeroMinimal ─────────────────────────────────────────────── */

export default function HeroMinimal() {
  const { phase } = useIntro();
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Paragraph + button enter once the intro reveals — on a homepage hard-load
  // that's ~0.9s into the reveal (right before the lamp finishes); on a direct
  // visit / client navigation (`done`) they enter promptly.
  useEffect(() => {
    if (phase === 'loading') return;
    const ctx = gsap.context(() => {
      const delay = phase === 'reveal' ? 0.9 : 0.1;
      gsap.fromTo(
        paragraphRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay, ease: 'expo.out' },
      );
      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: delay + 0.2, ease: 'expo.out' },
      );
    });
    return () => ctx.revert();
  }, [phase]);

  return (
    <section className="h-screen w-full bg-void">
      {/* LAYER 1: Background (Lamp + Paragraph & Button) */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden">
        {/* Lamp mounts only after the intro lifts, so its sweep plays fresh on reveal. */}
        {phase !== 'loading' && (
          <LampContainer
            glowColor="#ffffff"
            glowColorBright="#ffffff"
            className="pointer-events-none absolute inset-0 h-full min-h-full w-full"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-0 sm:px-6 sm:pb-1 md:px-10 md:pb-1">
          <div className="grid grid-cols-12 items-end gap-4">
            {/* Empty column to keep grid layout identical */}
            <div className="col-span-12 lg:col-span-8"></div>

            <div className="col-span-12 flex flex-col gap-5 pb-28 sm:pb-32 lg:col-span-4 lg:pb-3">
              <p
                ref={paragraphRef}
                className="text-xs sm:text-sm md:text-base"
                style={{
                  lineHeight: 1.2,
                  color: 'rgba(245, 240, 232, 0.75)',
                  fontFamily: 'var(--font-primary)',
                  opacity: 0,
                }}
              >
                {PARAGRAPH}
              </p>

              <div ref={ctaRef} className="self-start" style={{ opacity: 0 }}>
                <Button href="/en/projects" variant="primary" size="sm" magnetic>
                  View Our Work
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LAYER 2: Foreground (Title) — static; the loader owns its entrance and
          hands off to this identical block when the wipe completes. */}
      <div
        id="hero-title-layer"
        className="pointer-events-none fixed inset-0 z-50 h-screen w-full overflow-hidden mix-blend-difference"
      >
        <HeroTitleContent animate={false} />
      </div>
    </section>
  );
}
