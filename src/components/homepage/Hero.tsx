'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import { useIntro } from './IntroProvider';

/* ───────────────────────────────────────────────────────────────────────────
   Hero — asymmetric split

   A full-height photograph occupies the left ~73% of the viewport; a flat void
   column holds the right ~27%. The headline is set in two offset lines that
   cross the seam between them — that crossing is what makes the composition
   read as designed rather than as type dropped onto a photo.

   The navbar (fixed, h-20, mix-blend-difference) floats over this untouched.
   Its own entrance is already gated on `useIntro()`, so this timeline keys off
   the same phase to stay in step rather than racing it.

   On scroll-out the void column widens from 27% to 100%, wiping right-to-left
   across the image and landing as the flat background the next section sits on.
   The seam that defines the hero becomes the transition device.

   Below `lg` the split collapses: the image goes full-bleed and the column's
   contents reflow beneath the paragraph.

   Note on layering: each animated transform property gets its own element.
   GSAP writes the whole `transform` string from a per-element cache, so two
   timelines driving different properties on one node clobber each other.
   ─────────────────────────────────────────────────────────────────────────── */

/** Width of the void column, as a % of the viewport. Desktop only. */
const COLUMN_W = 27;

export interface HeroTicker {
  title: string;
  location: string;
  progressPercent?: number;
}

interface HeroProps {
  /** Cloudinary public ID for the full-height photograph. */
  imageId: string;
  /** Two-part headline. Line 2 is the indented one that crosses the seam. */
  headline: [string, string];
  paragraph: string;
  /** Live "currently building" readout for the column. Hidden when absent. */
  ticker?: HeroTicker | null;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function Hero({
  imageId,
  headline,
  paragraph,
  ticker,
  ctaLabel = 'View the work',
  ctaHref = '/en/projects',
}: HeroProps) {
  const { phase } = useIntro();

  const sectionRef = useRef<HTMLElement>(null);
  const imgEnterRef = useRef<HTMLDivElement>(null); // entrance — scale
  const imgScrollRef = useRef<HTMLDivElement>(null); // exit     — scale/opacity
  const imgWrapRef = useRef<HTMLDivElement>(null); // entrance — clipPath
  const columnRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null); // entrance — yPercent
  const line2Ref = useRef<HTMLSpanElement>(null);
  const line1OuterRef = useRef<HTMLDivElement>(null); // exit — y
  const line2OuterRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  // ── Entrance ──────────────────────────────────────────────────────────────
  // Gated on the intro phase so it cannot collide with the loader's wipe. On a
  // homepage hard-load `reveal` fires as the white panel clears; on client
  // navigation the phase is already `done` and this runs promptly.
  useLayoutEffect(() => {
    if (phase === 'loading') return;

    gsapInit();

    const fill = ticker?.progressPercent ? ticker.progressPercent / 100 : 0;

    const ctx = gsap.context(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const revealed = [paragraphRef.current, ctaRef.current, tickerRef.current];
      const lines = [line1Ref.current, line2Ref.current];

      // The masked start offset MUST be established by GSAP, not by a CSS class.
      // A CSS `translateY(110%)` computes to a pixel matrix, which GSAP parses
      // as `y: 111px / yPercent: 0` — so animating `yPercent` to 0 changes
      // nothing and the offset sticks. Setting it here keeps the percentage in
      // GSAP's own transform cache, where the tween can actually resolve it.
      // The lines are `visibility: hidden` in markup until this runs, so the
      // pre-paint state never flashes.
      gsap.set(lines, { yPercent: 110, visibility: 'visible' });

      if (reduced) {
        gsap.set(imgWrapRef.current, { clipPath: 'inset(0% 0% 0% 0%)' });
        gsap.set(imgEnterRef.current, { scale: 1 });
        gsap.set(lines, { yPercent: 0 });
        gsap.set(revealed, { autoAlpha: 1, y: 0 });
        gsap.set(ringRef.current, { strokeDashoffset: 0 });
        gsap.set(barRef.current, { scaleX: fill });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Image — wipes in left→right, then keeps drifting after the wipe lands so
      // the frame never settles into a dead JPEG.
      tl.to(
        imgWrapRef.current,
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power2.inOut' },
        0,
      ).to(imgEnterRef.current, { scale: 1, duration: 2.4 }, 0);

      // Headline — masked reveal. Line 2 trails line 1 by 150ms; that lag is
      // what pulls the eye diagonally down-and-right across the seam. Plain
      // `.to()` from the inline start state — a `fromTo` here fights the
      // scroll-exit timeline over the same transform cache.
      tl.to(line1Ref.current, { yPercent: 0, duration: 0.95 }, 0.45).to(
        line2Ref.current,
        { yPercent: 0, duration: 0.95 },
        0.6,
      );

      // CTA ring draws clockwise, label and arrow follow it in.
      tl.to(ringRef.current, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 0.9).to(
        ctaRef.current,
        { autoAlpha: 1, duration: 0.6 },
        0.95,
      );

      tl.to(paragraphRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, 1.0).to(
        tickerRef.current,
        { autoAlpha: 1, duration: 0.7 },
        1.15,
      );

      // Progress rule fills to the real percentage.
      tl.to(barRef.current, { scaleX: fill, duration: 1.1, ease: 'power2.inOut' }, 1.3);
    }, sectionRef);

    return () => ctx.revert();
  }, [phase, ticker?.progressPercent]);

  // ── Scroll exit ───────────────────────────────────────────────────────────
  // The two headline lines leave at different rates so the diagonal stretches
  // apart on the way out. The void column then widens to full width, wiping
  // across the image — it becomes the next section's background.
  useLayoutEffect(() => {
    gsapInit();

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isReduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, isReduced } = context.conditions as {
          isDesktop: boolean;
          isReduced: boolean;
        };
        if (isReduced) return;

        const tl = gsap.timeline({
          // `immediateRender: false` throughout — these tweens must not stamp
          // their start values on creation, or they would overwrite whatever
          // the entrance timeline is mid-way through setting.
          defaults: { ease: 'none', immediateRender: false },
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.1,
          },
        });

        tl.to(line1OuterRef.current, { y: -140 }, 0)
          .to(line2OuterRef.current, { y: -80 }, 0)
          .to(imgScrollRef.current, { scale: 1.12, opacity: 0.35 }, 0)
          .to([paragraphRef.current, ctaRef.current], { autoAlpha: 0 }, 0)
          .to(tickerRef.current, { autoAlpha: 0 }, 0.15);

        // Only meaningful on desktop — below `lg` there is no column to widen.
        if (isDesktop) {
          tl.fromTo(
            columnRef.current,
            { width: `${COLUMN_W}%` },
            { width: '100%', ease: 'power2.inOut', immediateRender: false },
            0.25,
          );
        }
      },
    );

    return () => mm.revert();
  }, []);

  // ── CTA resting state ─────────────────────────────────────────────────────
  // Same reason as the headline: a CSS `translateX(140%)` resolves to a pixel
  // matrix that GSAP reads as `x`, not `xPercent`, so the hover tween could
  // never bring the incoming arrow back. GSAP has to own the offset.
  useLayoutEffect(() => {
    const cta = ctaRef.current;
    if (!cta) return;
    const ctx = gsap.context(() => {
      gsap.set(cta.querySelector('[data-arrow-in]'), { xPercent: 140, autoAlpha: 0 });
      gsap.set(cta.querySelector('[data-fill]'), { scale: 0 });
    }, cta);
    return () => ctx.revert();
  }, []);

  // ── CTA hover ─────────────────────────────────────────────────────────────
  const hoverCta = (entering: boolean) => {
    const cta = ctaRef.current;
    if (!cta) return;

    gsap.to(cta.querySelector('[data-fill]'), {
      scale: entering ? 1 : 0,
      duration: entering ? 0.45 : 0.4,
      ease: entering ? 'power3.out' : 'power3.inOut',
    });
    gsap.to(cta.querySelector('[data-arrow-out]'), {
      xPercent: entering ? 140 : 0,
      autoAlpha: entering ? 0 : 1,
      duration: entering ? 0.35 : 0.4,
      delay: entering ? 0 : 0.05,
      ease: entering ? 'power2.in' : 'power2.out',
    });
    gsap.to(cta.querySelector('[data-arrow-in]'), {
      xPercent: entering ? 0 : 140,
      autoAlpha: entering ? 1 : 0,
      duration: entering ? 0.4 : 0.3,
      delay: entering ? 0.08 : 0,
      ease: entering ? 'power2.out' : 'power2.in',
    });
  };

  const progress =
    typeof ticker?.progressPercent === 'number' ? Math.round(ticker.progressPercent) : null;

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden bg-void">
      {/* ── Photograph ─────────────────────────────────────────────────────── */}
      <div
        ref={imgWrapRef}
        className="absolute inset-y-0 left-0 right-0 overflow-hidden lg:right-[27%]"
        style={{ clipPath: 'inset(0% 100% 0% 0%)' }}
      >
        <div ref={imgScrollRef} className="h-full w-full will-change-transform">
          <div ref={imgEnterRef} className="h-full w-full will-change-transform">
            <img
              src={cloudinaryUrl(imageId, { width: 2400 })}
              alt=""
              aria-hidden="true"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Scrim. The navbar is difference-blended and looks after itself, but
            the headline is large light type over a bright daytime exterior — the
            lower half needs a real floor to sit on while the sky stays clean
            above it. Outside the scaling layers so it does not move with them. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(13,13,13,0.94) 0%, rgba(13,13,13,0.78) 22%, rgba(13,13,13,0.42) 48%, rgba(13,13,13,0.10) 72%, rgba(13,13,13,0) 100%)',
          }}
        />
      </div>

      {/* ── Void column ────────────────────────────────────────────────────── */}
      <div
        ref={columnRef}
        className="absolute inset-y-0 right-0 hidden bg-void lg:block"
        style={{ width: `${COLUMN_W}%` }}
      />

      {/* ── Composition ────────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {/* Headline — line 2's indent carries it across the seam. */}
        <div className="absolute bottom-[30%] left-0 w-full px-6 md:px-10 lg:bottom-[34%]">
          <h1 className="text-display-lg uppercase text-paper">
            {/* Outer div carries the scroll-exit `y`; the inner span carries the
                entrance `yPercent`. Separate nodes, separate transform caches. */}
            <div ref={line1OuterRef} className="will-change-transform">
              <span className="block overflow-hidden pb-[0.08em]">
                <span ref={line1Ref} className="block" style={{ visibility: 'hidden' }}>
                  {headline[0]}
                </span>
              </span>
            </div>
            <div ref={line2OuterRef} className="will-change-transform lg:pl-[14vw]">
              <span className="block overflow-hidden pb-[0.08em]">
                <span ref={line2Ref} className="block" style={{ visibility: 'hidden' }}>
                  {headline[1]}
                </span>
              </span>
            </div>
          </h1>
        </div>

        {/* Paragraph. */}
        <p
          ref={paragraphRef}
          className="absolute bottom-28 left-0 max-w-[34ch] px-6 text-body text-stone opacity-0 md:px-10 lg:bottom-14 lg:max-w-[38ch]"
        >
          {paragraph}
        </p>

        {/* ── Column stack — CTA sits directly above the build readout, both
               left-aligned to the column's inner edge. ────────────────────── */}
        <div className="absolute bottom-10 left-0 right-0 px-6 md:px-10 lg:bottom-12 lg:left-auto lg:w-[27%] lg:px-8">
          <Link
            ref={ctaRef}
            href={ctaHref}
            onPointerEnter={() => hoverCta(true)}
            onPointerLeave={() => hoverCta(false)}
            className="pointer-events-auto mb-10 inline-flex items-center gap-4 opacity-0"
          >
            <span className="relative grid h-14 w-14 shrink-0 place-items-center">
              <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  ref={ringRef}
                  cx="28"
                  cy="28"
                  r="27"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="170"
                  strokeDashoffset="170"
                  className="text-paper"
                />
              </svg>
              {/* Fill scales up from the centre on hover. Resting transforms are
                  set by GSAP on mount, not by CSS classes. */}
              <span
                data-fill
                className="absolute inset-0 rounded-full bg-paper will-change-transform"
              />
              {/* Two arrows — one leaves right, one enters from the left. Both
                  difference-blended so they invert as the fill passes beneath. */}
              <span className="relative block h-4 w-4 overflow-hidden mix-blend-difference">
                <span data-arrow-out className="absolute inset-0 block text-paper">
                  <Arrow />
                </span>
                <span data-arrow-in className="absolute inset-0 block text-paper">
                  <Arrow />
                </span>
              </span>
            </span>
            <span className="whitespace-nowrap text-label text-paper">{ctaLabel}</span>
          </Link>

          {/* Build readout — a construction gauge rather than a text block. The
              rule fills to the real `progressPercent` out of Sanity. */}
          {ticker && (
            <div ref={tickerRef} className="hidden opacity-0 lg:block">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <span className="text-label text-stone">CURRENTLY BUILDING</span>
                {progress !== null && (
                  <span className="text-mono tabular-nums text-threshold">{progress}%</span>
                )}
              </div>

              <p className="text-heading leading-none text-paper">{ticker.title}</p>
              <p className="mt-1 text-mono text-stone">{ticker.location}</p>

              {progress !== null && (
                <span className="mt-4 block h-px w-full bg-white/15">
                  <span
                    ref={barRef}
                    className="block h-full w-full origin-left bg-threshold"
                    style={{ transform: 'scaleX(0)' }}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className="h-4 w-4"
    >
      <path d="M1 8h13M9 3l5 5-5 5" />
    </svg>
  );
}
