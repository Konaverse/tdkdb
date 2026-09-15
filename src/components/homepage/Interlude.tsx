'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

/* ───────────────────────────────────────────────────────────────────────────
   Interlude — the kitchen, then "We House Your Dream"

   Sept 2026 boards: "interlude first state.png" → "interlude second state.png".

   ONE PINNED, SCRUBBED TIMELINE
   State A: the Armonia kitchen render full bleed, dimmed, with a row of
   three beat titles across the upper third ("Consistent Character", "Luxury
   Lifestyle", "Premium Quality"). The active title is white; the ones waiting
   to its right are half-strength. Each beat carries two right-aligned
   paragraphs. Scrolling slides the title row sideways to the next beat and
   cross-fades the paragraphs.

   State B: when the beats are spent, the render SHRINKS to a centred 16:9
   frame on white, uncovering a giant teal "TDK DESIGN" behind it; "We House
   Your Dream" rises in above the frame and a paragraph fades in below.

   Throughout, the photograph drifts in parallax inside its layer.

   THE LAYERS (one element, one property — see gsap-transform-pitfalls)
     [data-shrink]   scale             (timeline)
       [data-clip]   clip-path inset   (timeline) — trims the scaled layer to
                                                    the frame's aspect
         [data-parallax] yPercent      (its own ScrollTrigger)
         [data-dim]      opacity       (timeline)
   The shrink is scale + clip rather than a pure clip so the frame shows the
   whole composition, as the board does, instead of a crop of the middle.

   GEOMETRY
   The final frame is a real (invisible) element, [data-frame-target], sized
   in CSS from --fw / --fh (16:9 from lg up, near-square on phones, where a
   16:9 slice of a portrait layer is only a strip). Its rect drives the scale and clip as function
   values, so a resize only needs ScrollTrigger's own refresh. The heading and
   the paragraph are positioned from the same variables.

   Percentage transforms pin their pixel twin (yPercent with y: 0) because
   the timeline uses invalidateOnRefresh — pitfall #3.
   ─────────────────────────────────────────────────────────────────────────── */

const IMAGE_ID = 'clients/tdkdb/armonia/interior/3';

const TEAL = 'var(--color-threshold, #66979f)';
const INK = '#111111';

interface Beat {
  title: string;
  lead: string;
  aside: string;
}

const BEATS: Beat[] = [
  {
    title: 'Consistent Character',
    lead: 'Every residence is drawn by the same people who build it. The lines on the plans are the lines you live with, from the façade down to the last joint in the kitchen.',
    aside: 'One language, carried through every room.',
  },
  {
    title: 'Luxury Lifestyle',
    lead: 'Generous light, quiet materials and rooms planned around how a day is actually spent. Luxury, here, is ease rather than ornament.',
    aside: 'Space to live well, without excess.',
  },
  {
    title: 'Premium Quality',
    lead: 'Stone, timber and fittings chosen to age with grace, and every junction resolved on paper long before it reaches the site.',
    aside: 'Built for decades, not for handover day.',
  },
];

const DREAM = ['We House', 'Your Dream'];
const DREAM_COPY =
  'From the first sketch to the handed keys, one team designs and builds your home, so the residence you imagined is the one you move into.';

const WORDMARK = 'TDK DESIGN';

/** Title opacity while waiting to the right of the active beat. */
const WAITING = 0.45;
/** Title opacity once it has passed off to the left. */
const PASSED = 0.15;
/** Dim over the render in state A, and in the finished frame. */
const DIM_A = 0.55;
const DIM_B = 0.28;

export default function Interlude() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    const pinEl = pinRef.current;
    if (!scope || !pinEl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(scope);
      const shrink = q('[data-shrink]')[0] as HTMLElement;
      const clip = q('[data-clip]')[0] as HTMLElement;
      const parallax = q('[data-parallax]')[0] as HTMLElement;
      const dim = q('[data-dim]')[0] as HTMLElement;
      const row = q('[data-row]')[0] as HTMLElement;
      const titles = q('[data-title]') as HTMLElement[];
      const copies = q('[data-copy]') as HTMLElement[];
      const beatsLayer = q('[data-beats]')[0] as HTMLElement;
      const target = q('[data-frame-target]')[0] as HTMLElement;
      const dreamLines = q('[data-dream-line]') as HTMLElement[];
      const dreamCopy = q('[data-dream-copy]')[0] as HTMLElement;

      /* ── geometry, read only inside function values ── */
      const titleShift = (i: number) => titles[i].offsetLeft - titles[0].offsetLeft;
      const fit = () => {
        const vw = pinEl.clientWidth;
        const vh = pinEl.clientHeight;
        const fw = target.offsetWidth;
        const fh = target.offsetHeight;
        const s = Math.max(fw / vw, fh / vh);
        return {
          s,
          insetX: ((1 - fw / (s * vw)) / 2) * 100,
          insetY: ((1 - fh / (s * vh)) / 2) * 100,
        };
      };

      /* ── rest state ── */
      gsap.set(titles, { opacity: (i: number) => (i === 0 ? 1 : WAITING) });
      gsap.set(copies, { autoAlpha: (i: number) => (i === 0 ? 1 : 0) });
      gsap.set(dim, { opacity: DIM_A });
      gsap.set(dreamLines, { yPercent: 105, y: 0 });
      gsap.set(dreamCopy, { autoAlpha: 0 });

      /* ── the pinned timeline ── */
      const tl = gsap.timeline({
        // Chained fromTo tweens on the same nodes: none may stamp its start
        // value at creation, or it overwrites the rest state set above.
        defaults: { ease: 'none', immediateRender: false },
        scrollTrigger: {
          trigger: scope,
          start: 'top top',
          end: () => `+=${window.innerHeight * 4.6}`,
          pin: pinEl,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      // Positions are in "viewport heights of scroll" — the timeline's
      // duration maps 1:1 onto the pin length above.
      let at = 0.35; // hold on the first beat
      for (let k = 0; k < BEATS.length - 1; k++) {
        const T = 0.8;
        tl.fromTo(
          row,
          { x: () => -titleShift(k), xPercent: 0 },
          { x: () => -titleShift(k + 1), xPercent: 0, duration: T, ease: 'power2.inOut' },
          at,
        );
        tl.fromTo(
          titles[k],
          { opacity: 1 },
          { opacity: PASSED, duration: T, ease: 'power1.inOut' },
          at,
        );
        tl.fromTo(
          titles[k + 1],
          { opacity: WAITING },
          { opacity: 1, duration: T, ease: 'power1.inOut' },
          at,
        );
        tl.fromTo(
          copies[k],
          { autoAlpha: 1 },
          { autoAlpha: 0, duration: T * 0.4, ease: 'power1.in' },
          at,
        );
        tl.fromTo(
          copies[k + 1],
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: T * 0.45, ease: 'power1.out' },
          at + T * 0.55,
        );
        at += T + 0.35; // transition, then hold
      }

      // The beats clear.
      tl.to(beatsLayer, { autoAlpha: 0, duration: 0.35, ease: 'power1.in' }, at);
      at += 0.3;

      // The render shrinks to the frame, uncovering the wordmark.
      const SHRINK = 1.2;
      tl.fromTo(
        shrink,
        { scale: 1 },
        { scale: () => fit().s, duration: SHRINK, ease: 'power2.inOut' },
        at,
      );
      tl.fromTo(
        clip,
        { clipPath: 'inset(0% 0% 0% 0%)' },
        {
          clipPath: () => {
            const { insetX, insetY } = fit();
            return `inset(${insetY.toFixed(3)}% ${insetX.toFixed(3)}% ${insetY.toFixed(3)}% ${insetX.toFixed(3)}%)`;
          },
          duration: SHRINK,
          ease: 'power2.inOut',
        },
        at,
      );
      tl.fromTo(
        dim,
        { opacity: DIM_A },
        { opacity: DIM_B, duration: SHRINK, ease: 'power1.inOut' },
        at,
      );
      at += SHRINK * 0.6;

      // "We House / Your Dream" rises out of its masks; the copy follows.
      tl.fromTo(
        dreamLines,
        { yPercent: 105, y: 0 },
        { yPercent: 0, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' },
        at,
      );
      tl.fromTo(
        dreamCopy,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: 'power1.out' },
        at + 0.35,
      );
      at += 0.9;

      // Hold on the finished composition before the pin releases.
      tl.to({}, { duration: Math.max(0, 4.6 - at) }, at);

      /* ── parallax — its own node, its own trigger ── */
      if (!reduced) {
        gsap.fromTo(
          parallax,
          { yPercent: -7, y: 0 },
          {
            yPercent: 7,
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: scope,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      if (process.env.NODE_ENV !== 'production') {
        (window as unknown as { __interludeTl?: gsap.core.Timeline }).__interludeTl = tl;
      }
    }, scope);

    // Titles are measured in px; re-measure once Josefin has landed.
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });

    return () => {
      alive = false;
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="We house your dream"
      className="relative w-full"
      style={
        {
          background: '#ffffff',
          color: INK,
          fontFamily: 'var(--font-josefin)',
        } as React.CSSProperties
      }
    >
      <div
        ref={pinRef}
        className="relative h-svh w-full overflow-hidden [--fh:calc(var(--fw)*1.05)] [--fw:84vw] lg:[--fh:calc(var(--fw)*9/16)] lg:[--fw:39.5vw]"
      >
        {/* ── State B, behind: the wordmark ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 select-none justify-between px-[0.9vw] font-[300] uppercase leading-none"
          style={{ color: TEAL, fontSize: '15.5vw', marginTop: '2.3vw' }}
        >
          {WORDMARK.split('').map((ch, i) => (
            <span key={i} className="block" style={ch === ' ' ? { width: '0.2em' } : undefined}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </div>

        {/* The frame the render shrinks to. Invisible; measured. */}
        <div
          data-frame-target
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 'var(--fw)', height: 'var(--fh)' }}
        />

        {/* ── The render ── */}
        <div data-shrink className="absolute inset-0 will-change-transform">
          <div data-clip className="absolute inset-0 overflow-hidden">
            <div
              data-parallax
              className="absolute inset-x-0 top-[-10%] h-[120%] will-change-transform"
            >
              <img
                src={cloudinaryUrl(IMAGE_ID, { width: 2400 })}
                alt="Armonia apartment kitchen and dining room"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div data-dim className="absolute inset-0" style={{ background: '#000000' }} />
          </div>
        </div>

        {/* ── State A: the beats ── */}
        <div data-beats className="pointer-events-none absolute inset-0 text-white">
          <div className="absolute inset-x-0 top-[22%] lg:top-[23%]">
            <div
              data-row
              className="flex w-max gap-[7vw] whitespace-nowrap pl-[6.25vw] will-change-transform"
            >
              {BEATS.map((b) => (
                <h3
                  key={b.title}
                  data-title
                  className="text-[clamp(38px,4.8vw,96px)] font-[300] leading-none tracking-[0.02em]"
                >
                  {b.title}
                </h3>
              ))}
            </div>
          </div>

          {BEATS.map((b) => (
            <div key={b.title} data-copy className="absolute inset-0">
              <p className="absolute right-[6vw] top-[44%] max-w-[min(84vw,440px)] text-right text-[clamp(15px,1.4vw,24px)] font-[300] leading-[1.2] lg:right-[21vw] lg:max-w-[23vw]">
                {b.lead}
              </p>
              <p className="absolute right-[6vw] top-[72%] max-w-[min(70vw,360px)] text-right text-[clamp(15px,1.4vw,24px)] font-[300] leading-[1.2] lg:right-[30vw] lg:top-[67%] lg:max-w-[27vw]">
                {b.aside}
              </p>
            </div>
          ))}
        </div>

        {/* ── State B, in front: heading and copy around the frame ── */}
        <h2
          className="pointer-events-none absolute inset-x-0 text-center text-[clamp(44px,6.6vw,128px)] font-[300] leading-[1.02] tracking-[0.01em]"
          style={{ bottom: 'calc(50% + var(--fh) / 2 - 0.06em)' }}
        >
          {DREAM.map((line) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <span data-dream-line className="block will-change-transform">
                {line}
              </span>
            </span>
          ))}
        </h2>

        <p
          data-dream-copy
          className="pointer-events-none absolute left-1/2 w-[min(86vw,640px)] -translate-x-1/2 text-center text-[clamp(15px,1.4vw,24px)] font-[300] leading-[1.22] lg:w-[34vw]"
          style={{ top: 'calc(50% + var(--fh) / 2 + 2.2vw)', color: INK }}
        >
          {DREAM_COPY}
        </p>
      </div>
    </section>
  );
}
