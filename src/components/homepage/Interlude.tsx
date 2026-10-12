'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit, ScrollTrigger, SplitText } from '@/lib/animations/gsap';
import { CHAR_HIDDEN, maskChars, riseIn } from '@/lib/animations/text';
import { imageUrl } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';
import InterludeGlass, { GLASS_INSETS } from './InterludeGlass';
import { LightboxTrigger } from '@/components/ui/ImageLightbox';
import styles from './Interlude.module.css';

/**
 * Interlude: three beats over the full-bleed kitchen, then a centered image
 * with WE HOUSE to its left, YOUR DREAM to its right, and the original copy
 * below. Three nested clear-glass panes open inward, each from its parent's
 * settled edges, and finish before the pullback visually settles. Their rim
 * samples follow the real image crop, camera zoom and parallax; the faces
 * stay transparent.
 *
 * One pinned GSAP timeline owns the image scale, clip, glass insets and
 * masked text reveals. Parallax has its own node and trigger. Everything
 * reverses with scroll; the CSS target drives sizing on refresh. Below lg
 * retain the existing vertical beats and sticky photo, without a pin.
 * Context cleanup restores the markup and removes image listeners on resize
 * and navigation. Reduced motion removes the letter and glass entrances.
 */

/** The pinned, two-state interlude runs from lg up. Below it (phones and
    portrait tablets) scrolling vertically to move content sideways reads
    badly, so the section is a plain vertical stack of the first state. */
const DESKTOP_QUERY = '(min-width: 1024px)';

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

const DREAM = ['WE HOUSE', 'YOUR DREAM'];
const DREAM_COPY =
  'From the first sketch to the handed keys, one team designs and builds your home, so the residence you imagined is the one you move into.';

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
const SHRINK = 2.2;
const HOLD_LAST = 0.55;
const GLASS_START = 0.4;
const GLASS_END = 0.78;
const GLASS_OPEN = (SHRINK * (GLASS_END - GLASS_START)) / GLASS_INSETS.length;

/* Line clip states. */
const LINE_ON = 'inset(0% 0% 0% 0%)';
const LINE_BEFORE = 'inset(0% 100% 0% 0%)';
const LINE_AFTER = 'inset(0% 0% 0% 100%)';

export default function Interlude({ image }: { image?: SanityImage }) {
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

    /* ── below lg: no pin, no second state. Each beat reveals once as it
       arrives: titles and copy rise letter by letter through masks. ── */
    const buildMobile = () => {
      if (reduced) return;
      gsap.utils.toArray<HTMLElement>('[data-m-beat]', scope).forEach((beat) => {
        const heading = maskChars(beat.querySelectorAll('[data-m-word]'));
        const body = maskChars(beat.querySelectorAll('[data-m-copy]'));
        const words = heading.chars;
        const copy = body.chars;
        gsap
          .timeline({
            scrollTrigger: { trigger: beat, start: 'top 82%', once: true },
            onComplete: () => {
              heading.split.revert();
              body.split.revert();
            },
          })
          .to(words, riseIn(words))
          .to(copy, riseIn(copy), 0.25);
      });
    };

    const build = () => {
      ctx?.revert();
      const desktop = window.matchMedia(DESKTOP_QUERY).matches;
      ctx = gsap.context(() => {
        if (!desktop) {
          buildMobile();
          return;
        }
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
        const glassBounds = one('[data-glass-bounds]');
        const panes = q('[data-glass-pane]') as HTMLElement[];
        const rims = q('[data-glass-rim]') as HTMLCanvasElement[];
        const optics = rims.map((rim) => rim.getContext('2d'));
        const photograph = parallax.querySelector('img') as HTMLImageElement;
        const dreamHeading = one('[data-dream-heading]');
        const dreamLines = maskChars(q('[data-dream-line]')).chars;

        // Sample the actual cover crop, camera zoom and parallax. Read every
        // box first. Four narrow stretched crops recreate inward refraction
        // without filtering or repainting multiple full-size photographs.
        const syncGlass = () => {
          if (!photograph.naturalWidth || Number(gsap.getProperty(panes[0], 'opacity')) === 0)
            return;
          const photoBox = photograph.getBoundingClientRect();
          const boxes = panes.map((pane) => pane.getBoundingClientRect());
          if (boxes[0].bottom < 0 || boxes[0].top > window.innerHeight) return;
          const scale = Number(gsap.getProperty(shrink, 'scaleX')) || 1;
          const cover = Math.max(
            photoBox.width / photograph.naturalWidth,
            photoBox.height / photograph.naturalHeight,
          );
          const width = photograph.naturalWidth * cover;
          const height = photograph.naturalHeight * cover;
          const x = photoBox.left + (photoBox.width - width) / 2;
          const y = photoBox.top + (photoBox.height - height) / 2;
          const darkness = Number(gsap.getProperty(dim, 'opacity'));
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          panes.forEach((pane, i) => {
            const optical = optics[i];
            if (!optical || Number(gsap.getProperty(pane, 'opacity')) === 0) return;
            const { width: w, height: h, left, top } = boxes[i];
            const rim = rims[i];
            const pixelW = Math.ceil(w * dpr);
            const pixelH = Math.ceil(h * dpr);
            if (rim.width !== pixelW) rim.width = pixelW;
            if (rim.height !== pixelH) rim.height = pixelH;
            optical.setTransform(pixelW / w, 0, 0, pixelH / h, 0, 0);
            optical.clearRect(0, 0, w, h);
            const bevel = Math.min(24 * scale, w / 4, h / 4);
            const bend = bevel * 0.75;
            const radius = Math.min(32 * scale, w / 2, h / 2);
            optical.save();
            optical.beginPath();
            optical.roundRect(0, 0, w, h, radius);
            optical.clip();
            const draw = (
              dx: number,
              dy: number,
              dw: number,
              dh: number,
              sx: number,
              sy: number,
              sw: number,
              sh: number,
            ) => {
              optical.drawImage(
                photograph,
                (left - x + sx) / cover,
                (top - y + sy) / cover,
                sw / cover,
                sh / cover,
                dx,
                dy,
                dw,
                dh,
              );
            };
            draw(0, 0, w, bevel, 0, bend, w, bevel - bend);
            draw(0, h - bevel, w, bevel, 0, h - bevel, w, bevel - bend);
            draw(0, bevel, bevel, h - bevel * 2, bend, bevel, bevel - bend, h - bevel * 2);
            draw(
              w - bevel,
              bevel,
              bevel,
              h - bevel * 2,
              w - bevel,
              bevel,
              bevel - bend,
              h - bevel * 2,
            );
            // Darken only painted pixels; the transparent face stays untouched.
            optical.globalCompositeOperation = 'source-atop';
            optical.fillStyle = `rgba(0, 0, 0, ${darkness})`;
            optical.fillRect(0, 0, w, h);
            optical.restore();
          });
        };
        photograph.addEventListener('load', syncGlass);

        /* ── split the copy into lines, each in its own mask ── */
        const splitCopy = (p: HTMLElement, align: 'right' | 'center') => {
          const s = SplitText.create(p, { type: 'lines', mask: 'lines' });
          gsap.set(s.masks, {
            width: 'fit-content',
            marginLeft: 'auto',
            marginRight: align === 'center' ? 'auto' : 0,
          });
          return { ...s, chars: maskChars(s.lines).chars };
        };
        const beatCopy = BEATS.map((_, i) => {
          const lead = splitCopy(one(`[data-lead="${i}"]`), 'right');
          const aside = splitCopy(one(`[data-aside="${i}"]`), 'right');
          return {
            lines: [...lead.lines, ...aside.lines] as HTMLElement[],
            masks: [...lead.masks, ...aside.masks] as HTMLElement[],
            chars: [...lead.chars, ...aside.chars],
          };
        });
        const dreamSplit = splitCopy(one('[data-dream-copy]'), 'center');
        const dreamCopyLines = dreamSplit.lines as HTMLElement[];
        const dreamCopyChars = dreamSplit.chars;

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
        beatCopy.forEach((b, i) => gsap.set(b.chars, { yPercent: i === 0 || reduced ? 0 : 135 }));
        gsap.set(dreamCopyLines, { clipPath: LINE_BEFORE });
        if (reduced) gsap.set([...dreamLines, ...dreamCopyChars], { yPercent: 0 });
        if (reduced) gsap.set(dreamHeading, { autoAlpha: 0 });
        gsap.set(dim, { opacity: DIM_A });
        gsap.set(zoom, { scale: 1.1 });
        panes.forEach((pane, i) => {
          gsap.set(pane, {
            autoAlpha: 0,
            '--glass-inset': `${i ? GLASS_INSETS[i - 1] : 0}%`,
          });
        });

        /* ── entrance: once, on arrival ── */
        if (!reduced && !entered) {
          const titleChars = maskChars(words).chars;
          gsap.set(beatCopy[0].chars, CHAR_HIDDEN);
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
            .to(titleChars, riseIn(titleChars))
            .to(beatCopy[0].chars, riseIn(beatCopy[0].chars), 0.35);
        }

        /* ── the pinned, scrubbed timeline ── */
        const tl = gsap.timeline({
          // Chained fromTo tweens share nodes: none may stamp its start value
          // at creation, or it overwrites the rest state above.
          defaults: { ease: 'none', immediateRender: false },
          onUpdate: syncGlass,
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

          // Outgoing lines wipe away; incoming letters rise through masks.
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
          const copyAt = Math.min(outEnd - 0.08, at + GLIDE * 0.62);
          tl.set(inLines, { clipPath: LINE_ON }, copyAt);
          tl.fromTo(
            beatCopy[k + 1].chars,
            { yPercent: reduced ? 0 : 135, y: 0 },
            riseIn(beatCopy[k + 1].chars, { duration: 0.5, stagger: { amount: 0.2 } }),
            copyAt,
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

        // The optical frames share the photograph's current clipped bounds.
        tl.fromTo(
          glassBounds,
          { left: '0%', right: '0%', top: '0%', bottom: '0%' },
          {
            left: () => `${fit().insetX}%`,
            right: () => `${fit().insetX}%`,
            top: () => `${fit().insetY}%`,
            bottom: () => `${fit().insetY}%`,
            duration: SHRINK,
            ease: 'power3.inOut',
          },
          shrinkAt,
        );
        const glassAt = shrinkAt + SHRINK * GLASS_START;
        tl.addLabel('glassStart', glassAt);
        panes.forEach((pane, i) => {
          const openAt = glassAt + i * GLASS_OPEN;
          if (reduced) {
            tl.set(
              pane,
              { autoAlpha: 1, '--glass-inset': `${GLASS_INSETS[i]}%` },
              shrinkAt + SHRINK,
            );
          } else {
            tl.fromTo(pane, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.07 }, openAt);
            tl.fromTo(
              pane,
              { '--glass-inset': `${i ? GLASS_INSETS[i - 1] : 0}%` },
              {
                '--glass-inset': `${GLASS_INSETS[i]}%`,
                duration: GLASS_OPEN,
                ease: 'power2.inOut',
              },
              openAt,
            );
          }
        });
        tl.addLabel('glassSettled', shrinkAt + SHRINK * GLASS_END);
        tl.addLabel('imageSettled', shrinkAt + SHRINK);

        // "We House / Your Dream" and its copy rise letter by letter.
        const dreamAt = shrinkAt + SHRINK * 0.62;
        if (reduced) tl.set(dreamHeading, { autoAlpha: 1 }, dreamAt);
        tl.fromTo(dreamLines, { yPercent: reduced ? 0 : 135, y: 0 }, riseIn(dreamLines), dreamAt);
        tl.set(dreamCopyLines, { clipPath: LINE_ON }, dreamAt + 0.3);
        tl.fromTo(
          dreamCopyChars,
          { yPercent: reduced ? 0 : 135, y: 0 },
          riseIn(dreamCopyChars),
          dreamAt + 0.3,
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
              onUpdate: syncGlass,
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
        return () => photograph.removeEventListener('load', syncGlass);
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
      id="interlude"
      data-nav="light"
      ref={rootRef}
      aria-label="We house your dream"
      className="relative w-full"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      {/* ── Below lg: the render as a sticky backdrop, the beats stacked over
          it and scrolling normally. No pin, no sideways travel, no state B. ── */}
      <div
        data-nav="dark"
        className="relative text-white lg:hidden"
        style={{ background: '#0d0d0d' }}
      >
        <div
          data-lightbox="page"
          className="sticky top-0 -mb-[100svh] h-svh w-full overflow-hidden"
        >
          <img
            src={image ? imageUrl(image, { width: 1400 }) : ''}
            alt="Armonia apartment kitchen and dining room"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.58)' }} />
          <LightboxTrigger label="View Armonia kitchen and dining room" />
        </div>

        <div className="relative px-5 pb-[30svh] pt-[30svh] sm:px-8">
          {BEATS.map((b, i) => (
            <article key={b.title} data-m-beat className={i > 0 ? 'mt-[40svh]' : ''}>
              <h3 className="text-[clamp(34px,9vw,56px)] font-[300] leading-[1.08] tracking-[0.01em]">
                {b.title.split(' ').map((w, k) => (
                  <span key={k}>
                    {k > 0 && ' '}
                    <span className="-mb-[0.15em] inline-block overflow-hidden pb-[0.15em] align-top">
                      <span data-m-word className="inline-block will-change-transform">
                        {w}
                      </span>
                    </span>
                  </span>
                ))}
              </h3>
              <p
                data-m-copy
                className="mt-6 max-w-[36ch] text-[16px] font-[300] leading-[1.5]"
                style={{ color: 'rgba(255, 255, 255, 0.88)' }}
              >
                {b.lead}
              </p>
              <p
                data-m-copy
                className="mt-4 max-w-[36ch] text-[16px] font-[300] leading-[1.5]"
                style={{ color: 'rgba(255, 255, 255, 0.62)' }}
              >
                {b.aside}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* ── lg and up: the pinned two-state interlude ── */}
      <div
        ref={pinRef}
        className="relative hidden h-svh w-full overflow-hidden [--fh:calc(var(--fw)*1.05)] [--fw:84vw] [--fy:2svh] lg:block lg:[--fh:calc(var(--fw)*9/16)] lg:[--fw:min(39.5vw,78svh)] lg:[--fy:4svh]"
      >
        {/* The frame the render shrinks to. Invisible; measured. */}
        <div
          data-frame-target
          aria-hidden="true"
          className="pointer-events-none invisible absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: 'var(--fw)', height: 'var(--fh)', top: 'calc(50% + var(--fy))' }}
        />

        {/* ── The render ── */}
        <div data-shrink data-nav="dark" className="absolute inset-0 will-change-transform">
          <div data-clip data-lightbox="page" className="absolute inset-0 overflow-hidden">
            <div data-zoom className="absolute inset-0 will-change-transform">
              <div
                data-parallax
                className="absolute inset-x-0 top-[-10%] h-[120%] will-change-transform"
              >
                <img
                  src={image ? imageUrl(image, { width: 2400 }) : ''}
                  alt="Armonia apartment kitchen and dining room"
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div data-dim className="absolute inset-0" style={{ background: '#000000' }} />
            <InterludeGlass />
            <LightboxTrigger label="View Armonia kitchen and dining room" />
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

        {/* ── State B: heading on either side of the image, copy below ── */}
        <h2 data-dream-heading aria-label="We house your dream" className={styles.dreamHeading}>
          {DREAM.map((line) => (
            <span key={line} className={styles.dreamSide}>
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
