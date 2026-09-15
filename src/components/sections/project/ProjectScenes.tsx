'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';
import { cloudinaryUrl, responsiveSrcSet } from '@/lib/cloudinary/transforms';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectScenes — the renders, as four spreads rather than a gallery

   Four viewport-tall scenes, each a different editorial composition, each
   with one idea of motion tied to the scroll. Nothing to click, nothing to
   drag: the reader scrolls and the pages turn.

   A · APERTURE   One plate, framed on white. It arrives small and opens to
                  its full size as the scene rises into place, the render
                  inside pulling back as it grows: after the full-bleed hero,
                  the page steps back and hangs the picture on a wall.
   B · SIDE NOTE  A tall portrait crop on the left; on the right the pull
                  quote and the features, written on line by line. The
                  picture drifts slowly inside its frame.
   C · DIPTYCH    Two plates, a wide one low left and a tall one high right,
                  with the white between them held open. They travel at
                  different speeds, so the pair has depth.
   D · PANORAMA   A band across the full width. The camera pans along it,
                  left to right, as the page moves down.

   LAYERS — one node, one property (see gsap-transform-pitfalls)
     A  [data-a-frame] scale (scrub)    > [data-a-img] scale (scrub)
     B  [data-b-clip] clip-path (enter) > [data-b-settle] scale (enter)
                                        > [data-b-pan] yPercent (scrub)
     C  [data-c-drift] y (scrub)        > [data-c-clip] clip-path (enter)
                                        > [data-c-settle] scale (enter)
     D  [data-d-band] clip-path (enter) > [data-d-pan] xPercent (scrub)
   Scrubs use scrub: true — Lenis already smooths the scroll.

   Images load lazily and are decoded as soon as they arrive, so no render
   decodes on the frame it first scrolls into view.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectScenesProps {
  title: string;
  /** Exactly five: A, B, C-left, C-right, D. */
  images: string[];
  quote?: string;
  features?: string[];
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';

const GUTTER = 'px-[max(20px,5.5vw)]';

function Render({
  id,
  alt,
  sizes,
  className = '',
  data,
}: {
  id: string;
  alt: string;
  sizes: string;
  className?: string;
  data?: Record<string, string>;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...data}
      src={cloudinaryUrl(id, { width: 1600 })}
      srcSet={responsiveSrcSet(id)}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function ProjectScenes({ title, images, quote, features = [] }: ProjectScenesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [imgA, imgB, imgC1, imgC2, imgD] = images;
  const heading = quote?.trim() || title;
  const list = features.filter(Boolean).slice(0, 4);

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;

    // Decode ahead of the scroll.
    const decode = (img: HTMLImageElement) => img.decode?.().catch(() => {});
    const imgs = Array.from(root.querySelectorAll('img'));
    const onLoad = (e: Event) => decode(e.currentTarget as HTMLImageElement);
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth) decode(img);
      else img.addEventListener('load', onLoad);
    });

    const cleanupImgs = () => imgs.forEach((img) => img.removeEventListener('load', onLoad));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return cleanupImgs;

    let alive = true;
    let mm: gsap.MatchMedia | null = null;

    // Line splits need the real face.
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      mm = gsap.matchMedia(root);
      mm.add({ lg: '(min-width: 1024px)' }, (context) => {
        const { lg } = context.conditions as { lg: boolean };
        const q = gsap.utils.selector(root);
        const vh = () => window.innerHeight / 100;
        const scene = (name: string) => q(`[data-scene="${name}"]`)[0] as HTMLElement;

        /* ── A · aperture ── */
        const a = scene('aperture');
        gsap
          .timeline({
            scrollTrigger: { trigger: a, start: 'top bottom', end: 'top top', scrub: true },
          })
          .fromTo(
            q('[data-a-frame]'),
            { scale: lg ? 0.44 : 0.6 },
            { scale: 1, ease: 'power2.out' },
            0,
          )
          .fromTo(q('[data-a-img]'), { scale: 1.45 }, { scale: 1, ease: 'power2.out' }, 0);

        /* ── B · side note ── */
        const b = scene('side');
        gsap.fromTo(
          q('[data-b-pan]'),
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );

        const quoteSplit = maskLines(q('[data-b-quote]')[0]);
        const featureSplits = q('[data-b-feature]').map((el) => maskLines(el));
        const featureIdx = q('[data-b-index]');
        gsap.set([...quoteSplit.lines, ...featureSplits.flatMap((s) => s.lines)], {
          clipPath: LINE_HIDDEN,
        });
        gsap.set(featureIdx, { autoAlpha: 0 });

        gsap
          .timeline({
            scrollTrigger: { trigger: b, start: lg ? 'top 55%' : 'top 70%', once: true },
            onComplete: () => {
              quoteSplit.split.revert();
              featureSplits.forEach((s) => s.split.revert());
            },
          })
          .fromTo(
            q('[data-b-clip]'),
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' },
            0,
          )
          .fromTo(
            q('[data-b-settle]'),
            { scale: 1.2 },
            { scale: 1, duration: 2.4, ease: 'power2.out' },
            0.2,
          )
          .to(
            quoteSplit.lines,
            { clipPath: LINE_SHOWN, duration: 1, ease: 'power2.inOut', stagger: 0.13 },
            lg ? 0.55 : 0.2,
          )
          .to(featureIdx, { autoAlpha: 1, duration: 0.6, stagger: 0.12 }, lg ? 1.05 : 0.7)
          .to(
            featureSplits.map((s) => s.lines),
            { clipPath: LINE_SHOWN, duration: 0.8, ease: 'power2.inOut', stagger: 0.12 },
            lg ? 1.1 : 0.75,
          );

        /* ── C · diptych ── */
        const c = scene('diptych');
        const drift = [lg ? 7 : 3, lg ? 21 : 6];
        q('[data-c-drift]').forEach((el, i) => {
          gsap.fromTo(
            el,
            { y: () => drift[i] * vh() },
            {
              y: () => -drift[i] * vh(),
              ease: 'none',
              scrollTrigger: {
                trigger: c,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
        const clipsFrom = ['inset(0% 100% 0% 0%)', 'inset(0% 0% 100% 0%)'];
        const cTl = gsap.timeline({
          scrollTrigger: { trigger: c, start: lg ? 'top 45%' : 'top 70%', once: true },
        });
        q('[data-c-clip]').forEach((el, i) => {
          cTl.fromTo(
            el,
            { clipPath: clipsFrom[i] },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut' },
            i * 0.28,
          );
        });
        cTl.fromTo(
          q('[data-c-settle]'),
          { scale: 1.22 },
          { scale: 1, duration: 2.4, ease: 'power2.out', stagger: 0.28 },
          0.2,
        );

        /* ── D · panorama ── */
        const d = scene('panorama');
        gsap.fromTo(
          q('[data-d-pan]'),
          { xPercent: 0, x: 0 },
          {
            // The pan node is 128% of the band: travel exactly its overscan.
            xPercent: -(28 / 128) * 100,
            x: 0,
            ease: 'none',
            scrollTrigger: { trigger: d, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
        gsap.fromTo(
          q('[data-d-band]'),
          { clipPath: 'inset(0% 50% 0% 50%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.7,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: d, start: lg ? 'top 55%' : 'top 75%', once: true },
          },
        );
      });
    });

    return () => {
      alive = false;
      mm?.revert();
      cleanupImgs();
    };
  }, []);

  return (
    <div ref={rootRef} style={{ background: '#ffffff', color: INK }}>
      {/* ── A · Aperture ─────────────────────────────────────────────────── */}
      <section
        data-scene="aperture"
        data-nav="light"
        aria-label={`${title}, the building`}
        className="relative flex h-svh items-center justify-center overflow-hidden"
      >
        {imgA && (
          <div
            data-a-frame
            data-nav="dark"
            className="relative aspect-[4/5] w-[min(88vw,64svh)] overflow-hidden lg:aspect-[16/10] lg:w-[min(72vw,134svh)]"
          >
            <Render
              id={imgA}
              alt={`${title}, exterior`}
              sizes="(min-width: 1024px) 72vw, 150vw"
              data={{ 'data-a-img': '' }}
            />
          </div>
        )}
      </section>

      {/* ── B · Side note ────────────────────────────────────────────────── */}
      <section
        data-scene="side"
        data-nav="light"
        className={`relative flex min-h-svh flex-col gap-12 pb-24 lg:grid lg:h-svh lg:grid-cols-12 lg:gap-x-[2vw] lg:py-[8svh] ${GUTTER}`}
      >
        {imgB && (
          <div
            data-b-clip
            data-nav="dark"
            className="relative -mx-[max(20px,5.5vw)] h-[64svh] overflow-hidden lg:col-span-5 lg:mx-0 lg:h-full"
          >
            <div data-b-settle className="absolute inset-0">
              <div data-b-pan className="absolute inset-x-0 -top-[8%] h-[116%]">
                <Render
                  id={imgB}
                  alt={`${title}, the building from the garden`}
                  sizes="(min-width: 1024px) 160vh, 190vw"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col justify-end lg:col-span-5 lg:col-start-7 lg:pb-[1svh]">
          <p
            data-b-quote
            className="max-w-[15ch] text-[clamp(34px,3.7vw,70px)] font-[300] leading-[1.08] tracking-[-0.005em]"
          >
            {heading}
          </p>

          {list.length > 0 && (
            <ol className="mt-12 flex flex-col gap-[max(14px,2.4svh)] lg:mt-[9svh]">
              {list.map((f, i) => (
                <li key={f} className="flex items-baseline gap-6">
                  <span
                    data-b-index
                    className="w-6 shrink-0 font-mono text-[12px]"
                    style={{ color: MUTED }}
                  >
                    {pad2(i + 1)}
                  </span>
                  <span
                    data-b-feature
                    className="text-[clamp(18px,1.45vw,26px)] font-[300] leading-[1.3]"
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ── C · Diptych ──────────────────────────────────────────────────── */}
      <section
        data-scene="diptych"
        data-nav="light"
        aria-label={`${title}, two views`}
        className={`relative flex flex-col gap-10 py-24 lg:block lg:h-svh lg:p-0 ${GUTTER}`}
      >
        {[imgC1, imgC2].map((id, i) =>
          id ? (
            <div
              key={i}
              data-c-drift
              data-nav="dark"
              className={
                i === 0
                  ? 'relative aspect-[3/2] w-[88%] lg:absolute lg:bottom-[9svh] lg:left-[5.5vw] lg:w-[47vw]'
                  : 'relative aspect-[4/5] w-[62%] self-end lg:absolute lg:right-[5.5vw] lg:top-[9svh] lg:w-[27vw]'
              }
            >
              <div data-c-clip className="absolute inset-0 overflow-hidden">
                <div data-c-settle className="absolute inset-0">
                  <Render
                    id={id}
                    alt={`${title}, view ${i + 1}`}
                    sizes={
                      i === 0 ? '(min-width: 1024px) 47vw, 88vw' : '(min-width: 1024px) 60vw, 110vw'
                    }
                  />
                </div>
              </div>
            </div>
          ) : null,
        )}
      </section>

      {/* ── D · Panorama ─────────────────────────────────────────────────── */}
      <section
        data-scene="panorama"
        data-nav="light"
        aria-label={`${title}, panorama`}
        className="relative flex h-[82svh] items-center lg:h-svh"
      >
        {imgD && (
          <div
            data-d-band
            data-nav="dark"
            className="relative h-[58svh] w-full overflow-hidden lg:h-[66svh]"
          >
            <div data-d-pan className="absolute inset-y-0 left-0 w-[128%]">
              <Render
                id={imgD}
                alt={`${title}, panorama`}
                sizes="(min-width: 1024px) 128vw, 200vw"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
