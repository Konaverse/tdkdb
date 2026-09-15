'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

/* ───────────────────────────────────────────────────────────────────────────
   Interlude — the kitchen, then "We House Your Dream"

   Sept 2026 boards: "interlude first state.png" → "interlude second state.png".

   THE STORY
   State A: the Armonia kitchen render full bleed, dimmed, with a row of three
   beat titles across the upper third. The active title is white; the ones
   waiting to its right sit back at low strength. Each beat carries two
   right-aligned paragraphs.

   State B: when the beats are spent, the render shrinks to a centred frame on
   white, the camera pulling back as it goes, and uncovers a giant teal
   "TDK DESIGN & BUILD", wider than the screen, drifting from one edge to the
   other and back on its own. "We House / Your Dream"
   slides in over the frame's top edge and its paragraph is written on below.

   THE MOTION, AND WHY
   · Entrance (one-shot, on arrival): every title word slides sideways into
     its own mask, the hero's letter reveal; then the first beat's lines are
     written on left to right, the hero's paragraph reveal. The section
     introduces itself the way the page began.
   · Title to title (scrubbed): a long, soft power3.inOut glide. The incoming
     title trails the row a little and settles into place; the outgoing one
     drifts ahead as it dims. The row feels carried, not dragged.
   · Paragraphs (scrubbed): the outgoing lines are wiped away left to right,
     one after another; the incoming lines are written on in the same
     direction, starting as the last outgoing line clears. One continuous
     sweep of the pen, never a cross-fade of two blocks.
   · Shrink (scrubbed): scale + clip to the frame, a slow zoom-out inside it,
     the dim lifting.
   · Wordmark (time-based, not scroll): at the board's size, reading
     "TDK DESIGN & BUILD", it glides on its own from its first letter on the
     left edge to its last letter on the right edge and back, forever, and
     only runs while the section is on screen.
   · Parallax: the photograph drifts on its own node and trigger throughout.

   THE LAYERS (one node, one writer per property — gsap-transform-pitfalls)
     [data-shrink]  scale, y           timeline
       [data-clip]  clip-path          timeline
         [data-zoom]      scale        timeline
           [data-parallax] yPercent    parallax trigger
         [data-dim]       opacity      timeline
     [data-title]        opacity, x    timeline
       [data-word]       xPercent      entrance
     line mask (SplitText) clip-path   entrance (first beat only)
       line              clip-path     timeline
     [data-wordmark]     x             its own endless tween (the wrapper owns the
                                       vertical centring translate)
     [data-dream-line]   xPercent      timeline

   GEOMETRY
   The final frame is a real, invisible element, [data-frame-target], sized
   and placed in CSS from --fw / --fh / --fy. Its box drives the shrink as
   function values. The heading, the paragraph and the wordmark are placed
   from the same variables, so the composition cannot drift apart.

   Everything is built after the fonts land (SplitText needs final line
   breaks) and rebuilt when the width changes. Pixel twins are pinned on
   every percentage transform because of invalidateOnRefresh (pitfall #3).
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

const WORDMARK = 'TDK DESIGN & BUILD';

/* Title strengths. */
const WAITING = 0.38;
const PASSED = 0.1;
/* Dim over the render in state A, and in the finished frame. */
const DIM_A = 0.55;
const DIM_B = 0.24;

/* Pacing, in viewport heights of scroll. The pin is exactly as long as the
   timeline, so these ARE the scroll distances. */
const HOLD_FIRST = 0.45;
const GLIDE = 1.3;
const HOLD = 0.5;
const SHRINK = 1.6;
const HOLD_LAST = 0.55;
/** Seconds for one edge-to-edge pass of the wordmark. */
const WORDMARK_GLIDE = 18;

/* Line clip states. */
const LINE_ON = 'inset(0% 0% 0% 0%)';
const LINE_BEFORE = 'inset(0% 100% 0% 0%)';
const LINE_AFTER = 'inset(0% 0% 0% 100%)';

export default function Interlude() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    const pinEl = pinRef.current;
    if (!scope || !pinEl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ctx: gsap.Context | null = null;
    let entered = false;
    let alive = true;

    const build = () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(scope);
        const one = (sel: string) => q(sel)[0] as HTMLElement;
        const shrink = one('[data-shrink]');
        const clip = one('[data-clip]');
        const zoom = one('[data-zoom]');
        const parallax = one('[data-parallax]');
        const dim = one('[data-dim]');
        const row = one('[data-row]');
        const target = one('[data-frame-target]');
        const titles = q('[data-title]') as HTMLElement[];
        const words = q('[data-word]') as HTMLElement[];
        const wordmark = one('[data-wordmark]');
        const dreamLines = q('[data-dream-line]') as HTMLElement[];

        /* ── split the copy into lines, each in its own mask ── */
        const splitCopy = (p: HTMLElement, align: 'right' | 'center') => {
          const s = SplitText.create(p, { type: 'lines', mask: 'lines' });
          gsap.set(s.masks, {
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: align === 'center' ? 'auto' : 0,
          });
          return s;
        };
        const beatCopy = BEATS.map((_, i) => {
          const lead = splitCopy(one(`[data-lead="${i}"]`), 'right');
          const aside = splitCopy(one(`[data-aside="${i}"]`), 'right');
          return {
            lines: [...lead.lines, ...aside.lines] as HTMLElement[],
            masks: [...lead.masks, ...aside.masks] as HTMLElement[],
          };
        });
        const dreamSplit = splitCopy(one('[data-dream-copy]'), 'center');
        const dreamCopyLines = dreamSplit.lines as HTMLElement[];

        /* ── geometry, read inside function values only ── */
        const vw = () => pinEl.clientWidth;
        const titleShift = (i: number) => titles[i].offsetLeft - titles[0].offsetLeft;
        const fit = () => {
          const w = pinEl.clientWidth;
          const h = pinEl.clientHeight;
          const fw = target.offsetWidth;
          const fh = target.offsetHeight;
          const s = Math.max(fw / w, fh / h);
          return {
            s,
            // The target is centred on its offsetTop by a −50% translate.
            y: target.offsetTop - h / 2,
            insetX: ((1 - fw / (s * w)) / 2) * 100,
            insetY: ((1 - fh / (s * h)) / 2) * 100,
          };
        };

        /* ── rest state ── */
        gsap.set(titles, { opacity: (i: number) => (i === 0 ? 1 : WAITING), x: 0 });
        beatCopy.forEach((b, i) =>
          gsap.set(b.lines, { clipPath: i === 0 ? LINE_ON : LINE_BEFORE }),
        );
        gsap.set(dreamCopyLines, { clipPath: LINE_BEFORE });
        gsap.set(dreamLines, { xPercent: -101, x: 0 });
        gsap.set(dim, { opacity: DIM_A });
        gsap.set(zoom, { scale: 1.1 });

        /* ── entrance: once, on arrival ── */
        if (!reduced && !entered) {
          gsap.set(words, { xPercent: -104, x: 0 });
          gsap.set(beatCopy[0].masks, { clipPath: LINE_BEFORE });
          gsap
            .timeline({
              scrollTrigger: {
                trigger: scope,
                start: 'top 55%',
                once: true,
                onEnter: () => {
                  entered = true;
                },
              },
            })
            .to(words, {
              xPercent: 0,
              x: 0,
              duration: 1.45,
              ease: 'power4.out',
              stagger: 0.11,
            })
            .to(
              beatCopy[0].masks,
              { clipPath: LINE_ON, duration: 0.9, ease: 'power2.inOut', stagger: 0.14 },
              0.6,
            );
        }

        /* ── the pinned, scrubbed timeline ── */
        const tl = gsap.timeline({
          // Chained fromTo tweens share nodes: none may stamp its start value
          // at creation, or it overwrites the rest state above.
          defaults: { ease: 'none', immediateRender: false },
        });

        let at = HOLD_FIRST;
        for (let k = 0; k < BEATS.length - 1; k++) {
          const out = titles[k];
          const inn = titles[k + 1];

          // The row glides; the incoming title trails it and settles.
          tl.fromTo(
            row,
            { x: () => -titleShift(k), xPercent: 0 },
            { x: () => -titleShift(k + 1), xPercent: 0, duration: GLIDE, ease: 'power3.inOut' },
            at,
          );
          tl.fromTo(
            inn,
            { x: 0 },
            { x: () => vw() * 0.035, duration: GLIDE * 0.5, ease: 'sine.in' },
            at,
          );
          tl.fromTo(
            inn,
            { x: () => vw() * 0.035 },
            { x: 0, duration: GLIDE * 0.5, ease: 'power2.out' },
            at + GLIDE * 0.5,
          );
          tl.fromTo(
            out,
            { x: 0 },
            { x: () => -vw() * 0.04, duration: GLIDE, ease: 'sine.inOut' },
            at,
          );
          tl.fromTo(
            out,
            { opacity: 1 },
            { opacity: PASSED, duration: GLIDE * 0.75, ease: 'sine.inOut' },
            at,
          );
          tl.fromTo(
            inn,
            { opacity: WAITING },
            { opacity: 1, duration: GLIDE * 0.7, ease: 'sine.inOut' },
            at + GLIDE * 0.3,
          );

          // The pen: outgoing lines wiped away, incoming lines written on.
          const outLines = beatCopy[k].lines;
          const inLines = beatCopy[k + 1].lines;
          const wipeOut = 0.42;
          const outStagger = 0.07;
          tl.fromTo(
            outLines,
            { clipPath: LINE_ON },
            { clipPath: LINE_AFTER, duration: wipeOut, ease: 'power1.in', stagger: outStagger },
            at + 0.05,
          );
          const outEnd = at + 0.05 + wipeOut + outStagger * (outLines.length - 1);
          tl.fromTo(
            inLines,
            { clipPath: LINE_BEFORE },
            { clipPath: LINE_ON, duration: 0.5, ease: 'power2.out', stagger: 0.085 },
            Math.min(outEnd - 0.08, at + GLIDE * 0.62),
          );

          at += GLIDE + HOLD;
        }

        // The beats leave: the last lines wiped away, the row dims and drifts on.
        const last = BEATS.length - 1;
        tl.fromTo(
          beatCopy[last].lines,
          { clipPath: LINE_ON },
          { clipPath: LINE_AFTER, duration: 0.42, ease: 'power1.in', stagger: 0.07 },
          at,
        );
        tl.fromTo(
          row,
          { x: () => -titleShift(last), xPercent: 0 },
          {
            x: () => -titleShift(last) - vw() * 0.06,
            xPercent: 0,
            duration: 0.9,
            ease: 'power1.in',
          },
          at,
        );
        titles.forEach((t, i) => {
          tl.fromTo(
            t,
            { opacity: i === last ? 1 : PASSED },
            { opacity: 0, duration: 0.6, ease: 'sine.in' },
            at + 0.1,
          );
        });
        at += 0.5;

        // The shrink.
        const shrinkAt = at;
        tl.fromTo(
          shrink,
          { scale: 1, y: 0 },
          {
            scale: () => fit().s,
            y: () => fit().y,
            duration: SHRINK,
            ease: 'power3.inOut',
          },
          shrinkAt,
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
            ease: 'power3.inOut',
          },
          shrinkAt,
        );
        tl.fromTo(
          zoom,
          { scale: 1.1 },
          { scale: 1, duration: SHRINK, ease: 'power2.inOut' },
          shrinkAt,
        );
        tl.fromTo(
          dim,
          { opacity: DIM_A },
          { opacity: DIM_B, duration: SHRINK, ease: 'sine.inOut' },
          shrinkAt,
        );

        // "We House / Your Dream" slides in; its paragraph is written on.
        const dreamAt = shrinkAt + SHRINK * 0.62;
        tl.fromTo(
          dreamLines,
          { xPercent: -101, x: 0 },
          { xPercent: 0, x: 0, duration: 0.9, ease: 'power3.out', stagger: 0.16 },
          dreamAt,
        );
        tl.fromTo(
          dreamCopyLines,
          { clipPath: LINE_BEFORE },
          { clipPath: LINE_ON, duration: 0.55, ease: 'power2.inOut', stagger: 0.1 },
          dreamAt + 0.45,
        );

        tl.to({}, { duration: HOLD_LAST });

        ScrollTrigger.create({
          animation: tl,
          trigger: scope,
          start: 'top top',
          end: () => `+=${tl.duration() * window.innerHeight}`,
          pin: pinEl,
          scrub: true,
          invalidateOnRefresh: true,
        });

        /* ── parallax: its own node, its own trigger ── */
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

        /* ── the wordmark: its own clock, not the scroll ──
           A slow glide from the first letter on the left edge to the last
           letter on the right edge, and back, forever. It runs only while the
           section is on screen. */
        if (!reduced) {
          // The last letter carries trailing tracking; it is not ink.
          const travel = () => {
            const trailing = parseFloat(getComputedStyle(wordmark).fontSize) * 0.04;
            return Math.max(0, wordmark.scrollWidth - trailing - vw() * (1 - 2 * 0.009));
          };
          const drift = gsap.fromTo(
            wordmark,
            { x: 0, xPercent: 0 },
            {
              x: () => -travel(),
              xPercent: 0,
              duration: WORDMARK_GLIDE,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
              paused: true,
            },
          );
          ScrollTrigger.create({
            trigger: scope,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => (self.isActive ? drift.play() : drift.pause()),
          });
        }

        if (process.env.NODE_ENV !== 'production') {
          (window as unknown as { __interludeTl?: gsap.core.Timeline }).__interludeTl = tl;
        }
      }, scope);

      // This pin can be created after the triggers below it; put them back in
      // page order before measuring.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (alive) build();
    });

    // Line breaks depend on width: rebuild when it changes.
    let lastW = window.innerWidth;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (alive) build();
      }, 300);
    };
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      ctx?.revert();
    };
  }, []);

  const copyText = 'text-[clamp(15px,1.35vw,23px)] font-[300] leading-[1.28]';

  return (
    <section
      ref={rootRef}
      aria-label="We house your dream"
      className="relative w-full"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      <div
        ref={pinRef}
        className="relative h-svh w-full overflow-hidden [--fh:calc(var(--fw)*1.05)] [--fw:84vw] [--fy:2svh] lg:[--fh:calc(var(--fw)*9/16)] lg:[--fw:39.5vw] lg:[--fy:4svh]"
      >
        {/* ── State B, behind: the wordmark ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -translate-y-1/2 select-none px-[0.9vw] font-[300] uppercase leading-none"
          style={{
            color: TEAL,
            fontSize: '15.5vw',
            top: 'calc(50% + var(--fy))',
            marginTop: '2.3vw',
          }}
        >
          <div
            data-wordmark
            className="w-max whitespace-nowrap tracking-[0.04em] will-change-transform"
          >
            {WORDMARK}
          </div>
        </div>

        {/* The frame the render shrinks to. Invisible; measured. */}
        <div
          data-frame-target
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 'var(--fw)', height: 'var(--fh)', top: 'calc(50% + var(--fy))' }}
        />

        {/* ── The render ── */}
        <div data-shrink className="absolute inset-0 will-change-transform">
          <div data-clip className="absolute inset-0 overflow-hidden">
            <div data-zoom className="absolute inset-0 will-change-transform">
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
            </div>
            <div data-dim className="absolute inset-0" style={{ background: '#000000' }} />
          </div>
        </div>

        {/* ── State A: the beats ── */}
        <div className="pointer-events-none absolute inset-0 text-white">
          <div className="absolute inset-x-0 top-[22%] lg:top-[23%]">
            <div
              data-row
              className="flex w-max gap-[7vw] whitespace-nowrap pl-[6.25vw] will-change-transform"
            >
              {BEATS.map((b) => (
                <h3
                  key={b.title}
                  data-title
                  className="text-[clamp(38px,4.8vw,96px)] font-[300] leading-[1.1] tracking-[0.02em]"
                >
                  {b.title.split(' ').map((w, i) => (
                    <span key={i}>
                      {i > 0 && ' '}
                      <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-top">
                        <span data-word className="inline-block will-change-transform">
                          {w}
                        </span>
                      </span>
                    </span>
                  ))}
                </h3>
              ))}
            </div>
          </div>

          {BEATS.map((b, i) => (
            <div key={b.title} className="absolute inset-0">
              <p
                data-lead={i}
                className={`absolute right-[6vw] top-[44%] w-[min(84vw,440px)] text-right lg:right-[21vw] lg:w-[23vw] ${copyText}`}
              >
                {b.lead}
              </p>
              <p
                data-aside={i}
                className={`absolute right-[6vw] top-[72%] w-[min(70vw,360px)] text-right lg:right-[30vw] lg:top-[67%] lg:w-[27vw] ${copyText}`}
              >
                {b.aside}
              </p>
            </div>
          ))}
        </div>

        {/* ── State B, in front: heading over the frame's top edge, copy below ── */}
        <h2
          className="pointer-events-none absolute inset-x-0 text-center font-[300] leading-[1.02] tracking-[0.01em]"
          style={{
            fontSize: 'clamp(40px, min(6.4vw, 10.5svh), 124px)',
            // Bottom of the heading sits a fifth of an em INTO the frame: it
            // may overlap the render, it may never run off the top.
            bottom: 'calc(50% - var(--fy) + var(--fh) / 2 - 0.2em)',
          }}
        >
          {DREAM.map((line) => (
            <span key={line} className="mx-auto block w-fit overflow-hidden pb-[0.06em]">
              <span data-dream-line className="block will-change-transform">
                {line}
              </span>
            </span>
          ))}
        </h2>

        <p
          data-dream-copy
          className={`pointer-events-none absolute left-1/2 w-[min(86vw,640px)] -translate-x-1/2 text-center lg:w-[34vw] ${copyText}`}
          style={{ top: 'calc(50% + var(--fy) + var(--fh) / 2 + 2.2vw)', color: INK }}
        >
          {DREAM_COPY}
        </p>
      </div>
    </section>
  );
}
