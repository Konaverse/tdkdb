'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';

/* ───────────────────────────────────────────────────────────────────────────
   SceneAbout — "The Plates"

   A 600vh pinned sequence that lives BEHIND the fixed hero TDKDB title.
   Five editorial "beats" (plates) are stacked absolutely in the same pinned
   viewport. Each beat is pre-composed in place; a clip-path WIPE uncovers it
   over the previous one, then a gentle COUNTER-PARALLAX (image drifts one way,
   text the opposite) gives it breathing room before the next wipe fires.

   The giant `TDKDB` (fixed z-50, mix-blend-difference, owned by HeroMinimal)
   stays pinned on top through the whole sequence — these beats sit at z-10,
   above the hero background (lamp / paragraph / CTA at z-0), so the first wipe
   simply covers the hero. All backgrounds are white; the title reads black over
   them via mix-blend, and inverts over imagery.
   ─────────────────────────────────────────────────────────────────────────── */

export const IMAGES = [
  'https://res.cloudinary.com/konaverse/image/upload/v1779212436/clients/tdkdb/general/about/first-origin.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212437/clients/tdkdb/general/about/second-design-philosophy.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212434/clients/tdkdb/general/about/third-construction.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212432/clients/tdkdb/general/about/fourth-people.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212428/clients/tdkdb/general/about/fifth-vision.png',
];

// Last About frame — reused by SceneProjectsHorizontal as the handoff backdrop
// so the Projects pin engages invisibly (no vertical reveal of the section).
export const ABOUT_HANDOFF_IMAGE = IMAGES[IMAGES.length - 1];

export interface Beat {
  index: string;
  name: string;
  text: string;
  /** clip-path hidden state — the wipe animates this → inset(0 0 0 0) */
  hidden: string;
  /** +1 = image drifts up / text down; -1 = image down / text up */
  sign: 1 | -1;
  /** layout class for the image container (mobile-first; lg = desktop) */
  imgWrap: string;
  /** layout class for the text block */
  txtWrap: string;
  /** text colour classes (may be responsive, e.g. dark on mobile / light on lg) */
  textClass: string;
  /** scrim treatment behind the text */
  scrim: 'mobile-top' | 'full' | 'desktop-bottom' | 'none';
}

const DARK = 'text-void';
const LIGHT = 'text-paper';

export const BEATS: Beat[] = [
  // ── 01 — Origin · image 2/3 RIGHT, text top-left · wipe rises from bottom ──
  {
    index: '01',
    name: 'Origin',
    text: 'We approach each project as a unique architectural challenge. Our methodology is rooted in an unwavering commitment to design excellence and material authenticity.',
    hidden: 'inset(100% 0% 0% 0%)',
    sign: 1,
    imgWrap: 'absolute inset-0 overflow-hidden lg:left-[33.333%]',
    txtWrap:
      'absolute inset-x-0 top-0 px-6 pt-24 sm:px-8 lg:inset-x-auto lg:left-12 lg:top-32 lg:max-w-[34%] lg:px-0 lg:pt-0',
    textClass: DARK,
    scrim: 'mobile-top',
  },

  // ── 02 — Design Philosophy · image 2/3 LEFT, text top-right · wipe L→R ─────
  {
    index: '02',
    name: 'Design Philosophy',
    text: 'From the initial sketch to the final construction details, every decision is guided by a deep understanding of spatial dynamics and human experience.',
    hidden: 'inset(0% 100% 0% 0%)',
    sign: -1,
    imgWrap: 'absolute inset-0 overflow-hidden lg:right-[33.333%]',
    txtWrap:
      'absolute inset-x-0 top-0 px-6 pt-24 sm:px-8 lg:inset-x-auto lg:right-12 lg:top-32 lg:max-w-[34%] lg:px-0 lg:pt-0 lg:text-right',
    textClass: DARK,
    scrim: 'mobile-top',
  },

  // ── 03 — Construction · FULL-BLEED image, light text lower-left · wipe T→D ─
  {
    index: '03',
    name: 'Construction',
    text: 'We believe that true luxury lies in simplicity. By stripping away the unnecessary, we reveal the essence of structure and light.',
    hidden: 'inset(0% 0% 100% 0%)',
    sign: 1,
    imgWrap: 'absolute inset-0 overflow-hidden',
    txtWrap:
      'absolute inset-x-0 top-0 px-6 pt-24 sm:px-8 lg:inset-x-auto lg:left-12 lg:top-32 lg:max-w-[34%] lg:px-0 lg:pt-0',
    textClass: LIGHT,
    scrim: 'full',
  },

  // ── 04 — People · image TOP band, text below on white · wipe R→L ──────────
  {
    index: '04',
    name: 'People',
    text: "Our collaborative process ensures that every client's vision is meticulously translated into a timeless and functional reality.",
    hidden: 'inset(0% 0% 0% 100%)',
    sign: -1,
    imgWrap:
      'absolute inset-x-0 bottom-0 h-[55%] overflow-hidden lg:bottom-auto lg:top-0 lg:h-[62%]',
    txtWrap:
      'absolute inset-x-0 top-0 flex h-[45%] items-end px-6 pt-24 sm:px-8 lg:top-[62%] lg:h-auto lg:items-center lg:justify-end lg:bottom-0 lg:px-12 lg:pt-0 lg:text-right',
    textClass: DARK,
    scrim: 'none',
  },

  // ── 05 — Vision · centered framed PLATE, text centered · wipe center-out ───
  {
    index: '05',
    name: 'Vision',
    text: 'The result is not just a building, but a crafted environment that resonates with its surroundings and stands the test of time.',
    hidden: 'inset(0% 50% 0% 50%)',
    sign: 1,
    imgWrap: 'absolute inset-x-[8%] top-[26%] bottom-[10%] overflow-hidden lg:inset-0',
    txtWrap:
      'absolute inset-x-0 top-[12%] px-8 text-center lg:top-[62%] lg:bottom-0 lg:flex lg:h-auto lg:items-center lg:justify-end lg:px-12 lg:pt-0 lg:text-right',
    // dark-on-white for the mobile plate, light over the desktop full-bleed
    textClass: 'text-void lg:text-paper',
    scrim: 'desktop-bottom',
  },
];

export default function SceneAbout() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const txtRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    gsapInit();
    const trigger = triggerRef.current;
    const section = sectionRef.current;
    if (!trigger || !section) return;

    // iOS toolbar show/hide should not re-trigger pin measurement mid-scroll.
    ScrollTrigger.config({ ignoreMobileResize: true });

    // ── Reduced motion — flow the beats vertically, no pin / wipe / parallax ──
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      trigger.style.height = 'auto';
      const track = trigger.querySelector<HTMLElement>('[data-about-track]');
      if (track) track.style.position = 'static';
      wrapperRefs.current.forEach((w) => {
        if (!w) return;
        w.style.position = 'relative';
        w.style.height = '100svh';
        w.style.clipPath = 'none';
      });
      return;
    }

    // Pull the section up over the hero's 100vh flow so the pin engages at
    // scroll 0 — the first wipe begins the instant you start scrolling, with no
    // dead hero scroll-space in front of it.
    section.style.marginTop = '-100vh';

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger,
          start: 'top top',
          end: '+=820%',
          pin: true,
          scrub: 1.6, // generous smoothing — buttery catch-up to scroll
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Each wipe gets the lion's share of its beat's scroll travel, so it
      // unfurls slowly (~105vh per wipe); the dwell is just enough to breathe.
      const REVEAL = 1.15; // wipe duration (timeline units)
      const DWELL = 0.35; // breathing room with parallax
      const STEP = REVEAL + DWELL; // cadence between beats (slightly tighter)
      // Parallax runs past its own beat and through the NEXT beat's wipe, so a
      // leaving beat keeps drifting while the next one wipes in over it.
      const DRIFT = STEP + REVEAL;
      let t = 0;

      BEATS.forEach((beat, i) => {
        const wrap = wrapperRefs.current[i];
        const img = imgRefs.current[i];
        const txt = txtRefs.current[i];
        const s = beat.sign;

        // Wipe: uncover this beat (already composed) over the previous one.
        if (wrap) {
          tl.fromTo(
            wrap,
            { clipPath: beat.hidden },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'sine.inOut', duration: REVEAL },
            t,
          );
        }

        // Counter-parallax — overlaps into the next wipe so motion never stalls.
        if (img) {
          tl.fromTo(img, { yPercent: 8 * s }, { yPercent: -8 * s, duration: DRIFT }, t);
        }
        if (txt) {
          tl.fromTo(
            txt,
            { y: () => -window.innerHeight * 0.06 * s },
            { y: () => window.innerHeight * 0.06 * s, duration: DRIFT },
            t,
          );
        }

        t += STEP;
      });
    }, trigger);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-10 w-full">
      <div ref={triggerRef} className="relative h-screen w-full overflow-hidden">
        {/* Drift track — SceneProjectsHorizontal translates this left during the
            About → Projects handoff (queried via [data-about-track]). */}
        <div data-about-track className="absolute inset-0">
          {BEATS.map((beat, i) => (
            <div
              key={beat.index}
              ref={(el) => {
                wrapperRefs.current[i] = el;
              }}
              className="absolute inset-0 overflow-hidden bg-white will-change-[clip-path]"
              style={{ zIndex: 10 + i, clipPath: beat.hidden }}
            >
              {/* Image plate */}
              <div className={beat.imgWrap}>
                <img
                  ref={(el) => {
                    imgRefs.current[i] = el;
                  }}
                  src={IMAGES[i]}
                  alt={`TDK — ${beat.name}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  className="absolute left-0 top-[-15%] h-[130%] w-full object-cover will-change-transform"
                />
              </div>

              {/* Scrim for legibility where text sits over imagery */}
              {beat.scrim === 'mobile-top' && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white via-white/85 to-transparent lg:hidden" />
              )}
              {beat.scrim === 'full' && (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55" />
              )}
              {beat.scrim === 'desktop-bottom' && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-[55%] bg-gradient-to-t from-black/60 via-black/15 to-transparent lg:block" />
              )}

              {/* Text block */}
              <div
                ref={(el) => {
                  txtRefs.current[i] = el;
                }}
                className={`${beat.txtWrap} will-change-transform`}
              >
                <div className={beat.textClass}>
                  <p className="max-w-[42ch] text-base font-normal leading-relaxed xl:text-lg 2xl:text-xl">
                    {beat.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
