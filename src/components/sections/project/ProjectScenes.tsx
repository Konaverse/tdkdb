'use client';

import { useLayoutEffect, useRef } from 'react';

import RevealFrame from '@/components/animations/RevealFrame';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';
import { cloudinaryUrl, responsiveSrcSet } from '@/lib/cloudinary/transforms';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectScenes — the renders, as four spreads rather than a gallery

   THE SYSTEM
   One stack on the page grid: side margins of --page-margin, the 12-column
   grid with --page-gutter, and the spreads separated by --page-margin too,
   so the white around every picture is one measure. Spreads are as tall as
   their pictures make them; only the system is fixed.

   A · APERTURE   One plate across the full content width. The render inside
                  pulls back as the plate crosses the screen.
   B · SIDE NOTE  A portrait crop over six columns; the pull quote and the
                  features in columns 8–12, written on line by line. The
                  picture drifts inside its frame.
   C · DIPTYCH    A wide plate over eight columns and a tall one over four,
                  one row, the same height. Their renders drift at different
                  rates, so the pair has depth without breaking the grid.
   D · PANORAMA   A low, wide band across the content width. The camera pans
                  along it as the page moves down.

   ENTRANCE — every picture uses <RevealFrame> (stripReveal), the site's one
   image entrance. Only the text entrances and the scroll motion live here.

   LAYERS — one node, one property
     RevealFrame settle (scale, entrance) > [data-a-zoom] scale (scrub)
                                          > [data-pan] yPercent (scrub)
                                          > [data-d-pan] xPercent (scrub)
   Scrubs use scrub: true — Lenis already smooths the scroll.
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

function Render({ id, alt, sizes }: { id: string; alt: string; sizes: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cloudinaryUrl(id, { width: 1600 })}
      srcSet={responsiveSrcSet(id)}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="block h-full w-full object-cover"
    />
  );
}

/** A render with vertical overscan, for a drift of ±`range`% inside its frame. */
function Drift({ range, children }: { range: number; children: React.ReactNode }) {
  const over = range * 2 + 4;
  return (
    <div
      data-pan={range}
      className="absolute inset-x-0"
      style={{ top: `-${over / 2}%`, height: `${100 + over}%` }}
    >
      {children}
    </div>
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

    // Decode ahead of the scroll, so no render decodes on its first frame.
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
    let ctx: gsap.Context | null = null;

    // Line splits need the real face.
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);
        const passage = (trigger: Element) => ({
          trigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        });

        /* scroll motion */
        const zoom = q('[data-a-zoom]')[0];
        if (zoom) {
          gsap.fromTo(
            zoom,
            { scale: 1.2 },
            { scale: 1, ease: 'none', scrollTrigger: passage(zoom.parentElement!) },
          );
        }
        q('[data-pan]').forEach((el) => {
          const range = Number((el as HTMLElement).dataset.pan);
          gsap.fromTo(
            el,
            { yPercent: -range },
            { yPercent: range, ease: 'none', scrollTrigger: passage(el.parentElement!) },
          );
        });
        const pano = q('[data-d-pan]')[0];
        if (pano) {
          gsap.fromTo(
            pano,
            { xPercent: 0, x: 0 },
            {
              // 128% wide: travel exactly the overscan.
              xPercent: -(28 / 128) * 100,
              x: 0,
              ease: 'none',
              scrollTrigger: passage(pano.parentElement!),
            },
          );
        }

        /* the side note's words */
        const quoteEl = q('[data-b-quote]')[0];
        if (quoteEl) {
          const quoteSplit = maskLines(quoteEl);
          const featureSplits = q('[data-b-feature]').map((el) => maskLines(el));
          const idx = q('[data-b-index]');
          gsap.set([...quoteSplit.lines, ...featureSplits.flatMap((s) => s.lines)], {
            clipPath: LINE_HIDDEN,
          });
          gsap.set(idx, { autoAlpha: 0 });
          gsap
            .timeline({
              scrollTrigger: { trigger: quoteEl, start: 'top 88%', once: true },
              onComplete: () => {
                quoteSplit.split.revert();
                featureSplits.forEach((s) => s.split.revert());
              },
            })
            .to(
              quoteSplit.lines,
              { clipPath: LINE_SHOWN, duration: 1, ease: 'power2.inOut', stagger: 0.13 },
              0,
            )
            .to(idx, { autoAlpha: 1, duration: 0.6, stagger: 0.12 }, 0.45)
            .to(
              featureSplits.map((s) => s.lines),
              { clipPath: LINE_SHOWN, duration: 0.8, ease: 'power2.inOut', stagger: 0.12 },
              0.5,
            );
        }

        // Fonts have settled every height above; place the triggers again.
        ScrollTrigger.refresh();
      }, root);
    });

    return () => {
      alive = false;
      ctx?.revert();
      cleanupImgs();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-nav="light"
      className="gap-page px-page py-page flex flex-col"
      style={{ background: '#ffffff', color: INK }}
    >
      {/* ── A · Aperture ─────────────────────────────────────────────────── */}
      {imgA && (
        <section aria-label={`${title}, the building`}>
          <RevealFrame nav="dark" className="aspect-[4/5] w-full lg:aspect-[16/9]">
            <div data-a-zoom className="h-full w-full">
              <Render
                id={imgA}
                alt={`${title}, exterior`}
                sizes="(min-width: 1024px) 100vw, 180vw"
              />
            </div>
          </RevealFrame>
        </section>
      )}

      {/* ── B · Side note ────────────────────────────────────────────────── */}
      <section className="lg:gap-x-gutter grid grid-cols-1 gap-y-12 pb-8 lg:grid-cols-12 lg:pb-0">
        {imgB && (
          <RevealFrame nav="dark" className="aspect-[4/5] w-full lg:col-span-6">
            <Drift range={6}>
              <Render
                id={imgB}
                alt={`${title}, the building from the garden`}
                sizes="(min-width: 1024px) 110vw, 180vw"
              />
            </Drift>
          </RevealFrame>
        )}

        <div className="flex flex-col justify-end lg:col-span-5 lg:col-start-8">
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
      {(imgC1 || imgC2) && (
        <section
          aria-label={`${title}, two views`}
          className="gap-page lg:gap-x-gutter grid grid-cols-1 lg:grid-cols-12 lg:gap-y-0"
        >
          {imgC1 && (
            <RevealFrame nav="dark" className="aspect-[3/2] w-full lg:col-span-8">
              <Drift range={5}>
                <Render
                  id={imgC1}
                  alt={`${title}, view one`}
                  sizes="(min-width: 1024px) 70vw, 100vw"
                />
              </Drift>
            </RevealFrame>
          )}
          {imgC2 && (
            // Stretches to the row: the same height as its neighbour.
            <RevealFrame nav="dark" className="aspect-[4/5] w-full lg:col-span-4 lg:aspect-auto">
              <Drift range={11}>
                <Render
                  id={imgC2}
                  alt={`${title}, view two`}
                  sizes="(min-width: 1024px) 60vw, 140vw"
                />
              </Drift>
            </RevealFrame>
          )}
        </section>
      )}

      {/* ── D · Panorama ─────────────────────────────────────────────────── */}
      {imgD && (
        <section aria-label={`${title}, panorama`}>
          <RevealFrame nav="dark" className="h-[48svh] w-full lg:h-[72svh]">
            <div data-d-pan className="absolute inset-y-0 left-0 w-[128%]">
              <Render
                id={imgD}
                alt={`${title}, panorama`}
                sizes="(min-width: 1024px) 128vw, 200vw"
              />
            </div>
          </RevealFrame>
        </section>
      )}
    </div>
  );
}
