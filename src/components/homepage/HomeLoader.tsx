'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { useIntro } from './IntroProvider';
import HeroTitleContent from './HeroTitleContent';

/**
 * HomeLoader — the first-load intro overlay (homepage only).
 *
 * Sequence:
 *  1. Pure-white (`--color-paper`) screen. TDKDB sits in its hero position
 *     (bottom-left on desktop, centred on mobile). A "X%" counter runs 0→100,
 *     pinned to `window.load`.
 *  2. Once loaded, hold 1s, then the white panel wipes upward (1s). The counter
 *     rides up with the panel and disappears; the TDKDB stays put (desktop) or
 *     slides from centre to its corner (mobile).
 *  3. Hands off to the hero (identical TDKDB underneath) and flips the intro to
 *     `reveal`, which fires the lamp, then the navbar / paragraph / button.
 */
export default function HomeLoader() {
  const { phase, setPhase } = useIntro();
  const [mounted, setMounted] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    // Only the homepage hard-load drives the loader.
    if (phase !== 'loading') return;
    const overlay = overlayRef.current;
    const bg = bgRef.current;
    const num = numRef.current;
    if (!overlay || !bg) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lock interaction until the intro completes.
    document.body.style.overflow = 'hidden';
    getLenis()?.stop();

    let loaded = document.readyState === 'complete';
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener('load', onLoad, { once: true });

    const ctx = gsap.context(() => {
      const counter = { val: 0 };
      const setNum = () => {
        if (num) num.textContent = `${Math.round(counter.val)}%`;
      };

      // Smooth crawl toward 90, holding there until the window finishes loading.
      const crawl = gsap.to(counter, {
        val: 90,
        duration: reduced ? 0.3 : 2.4,
        ease: 'power1.out',
        onUpdate: setNum,
      });

      const runWipe = () => {
        gsap
          .timeline({
            onComplete: () => {
              document.body.style.overflow = '';
              getLenis()?.start();
              setPhase('reveal'); // hero shows its (identical) TDKDB + fires the lamp
              setMounted(false); // unmount the loader on the same commit → seamless swap
            },
          })
          .to(bg, { yPercent: -100, duration: reduced ? 0.4 : 1, ease: 'power3.inOut' }, 0);
      };

      const complete = () => {
        crawl.kill();
        gsap.to(counter, {
          val: 100,
          duration: reduced ? 0.2 : 0.4,
          ease: 'power2.out',
          onUpdate: setNum,
          onComplete: () => {
            gsap.delayedCall(reduced ? 0.1 : 1, runWipe);
          },
        });
      };

      // Poll until the window has loaded, then snap to 100 and continue.
      const waitForLoad = () => {
        if (loaded) complete();
        else gsap.delayedCall(0.15, waitForLoad);
      };
      waitForLoad();
    }, overlayRef);

    return () => {
      ctx.revert();
      window.removeEventListener('load', onLoad);
      document.body.style.overflow = '';
    };
    // Runs once on mount; phase/setPhase captured intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || phase === 'done') return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300]"
      style={{ pointerEvents: 'auto' }}
      aria-hidden
    >
      {/* White panel + counter — this is what wipes up. */}
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--color-paper)', willChange: 'transform' }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center lg:bottom-2 lg:left-auto lg:right-10 lg:top-auto lg:translate-x-0 lg:translate-y-0 lg:text-right"
          style={{ fontFamily: 'var(--font-jetbrains)' }}
        >
          <span
            ref={numRef}
            className="inline-block text-[clamp(2.5rem,9vw,4rem)] tabular-nums"
            style={{ color: 'var(--color-void)', letterSpacing: '0.02em' }}
          >
            0%
          </span>
        </div>
      </div>

      {/* TDKDB — independent of the wiping panel; difference-blended so it reads
          dark on the white panel and flips to light as the panel clears. */}
      <div
        className="pointer-events-none fixed inset-0 h-screen w-full overflow-hidden"
        style={{ mixBlendMode: 'difference' }}
      >
        <HeroTitleContent animate />
      </div>
    </div>
  );
}
