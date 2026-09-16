'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { projectHeroSrcSet, projectHeroUrl } from '@/lib/cloudinary/transforms';
import { displayTitle, STATUS_LABEL } from '@/lib/projects/display';
import { useProjectTransition } from '@/components/transition/ProjectTransition';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectHero — the photograph, full bleed, and the project's name on it.

   Two ways in, one ending:

   · ARRIVAL, from the homepage's projects section. ProjectTransition has
     already opened the photograph to full bleed on its own layer. The hero
     renders the exact URL the layer decoded (claim), waits for its own copy
     to decode, and hands off: the layer goes, nothing moves, and the copy
     arrives. The picture must therefore sit exactly where the layer ended —
     100% × 100svh, object-cover, centred, no filter, no scale, no dimming
     baked into the image. The scrim is its own node and fades in after.

   · DIRECT load or any other navigation. The photograph opens out of the
     dark ground, settling from a slight push-in, then the same copy entrance.

   The copy: the site's side reveal (each line slides sideways into its own
   mask), the teal hairline drawing before the status, particulars last.
   Start offsets are set by gsap.set, never by classes (see the transform
   pitfalls), and every animated node is visibility:hidden in markup.
   Nothing here moves on scroll.
   ─────────────────────────────────────────────────────────────────────────── */

type HeroProject = Pick<
  Project,
  'title' | 'slug' | 'status' | 'type' | 'location' | 'year' | 'heroImageId'
>;

interface ProjectHeroProps {
  project: HeroProject;
}

const TEAL = 'var(--color-threshold, #66979f)';
const HIDDEN = { visibility: 'hidden' } as const;

/** A line that slides sideways into its own mask. */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <span data-reveal className="block" style={HIDDEN}>
        {children}
      </span>
    </span>
  );
}

export default function ProjectHero({ project }: ProjectHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transition = useProjectTransition();
  const slug = project.slug.current;

  // Decided once, at first render: are we landing from the homepage?
  const [arrival] = useState(() => transition.claim(slug));

  const title = displayTitle(project);
  const words = title.split(' ');
  const particulars = [
    { label: 'Location', value: project.location },
    {
      label: project.status === 'completed' ? 'Completed' : 'Delivery',
      value: String(project.year),
    },
    { label: 'Type', value: project.type.charAt(0).toUpperCase() + project.type.slice(1) },
  ].filter((p) => p.value);

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    const img = imgRef.current;
    if (!root || !img) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let alive = true;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const words = q('[data-word]');
      const reveals = q('[data-reveal]');
      const rules = q('[data-rule]');
      const scrim = q('[data-scrim]');

      if (reduced) {
        gsap.set([img, ...words, ...reveals, ...scrim], { autoAlpha: 1 });
        gsap.set(rules, { scaleX: 1 });
        if (arrival) transition.handoff(slug, root);
        return;
      }

      gsap.set(words, { xPercent: -104, x: 0, autoAlpha: 1 });
      gsap.set(reveals, { xPercent: -104, x: 0, autoAlpha: 1 });
      gsap.set(rules, { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(scrim, { autoAlpha: 0 });

      const copy = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
      copy.to(scrim, { autoAlpha: 1, duration: 1.4, ease: 'power2.inOut' }, 0);
      copy.to(rules, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.15);
      copy.to('[data-status] [data-reveal]', { xPercent: 0, x: 0, duration: 1 }, 0.35);
      copy.to(words, { xPercent: 0, x: 0, duration: 1.35, stagger: 0.09 }, 0.4);
      copy.to(
        '[data-particulars] [data-reveal]',
        { xPercent: 0, x: 0, duration: 1, stagger: 0.06 },
        0.8,
      );

      const decoded =
        img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => {});

      if (arrival) {
        // The layer is showing this picture already; ours stays visible
        // underneath it and simply takes over.
        decoded
          .then(() => (alive ? transition.handoff(slug, root) : undefined))
          .then(() => {
            if (alive) copy.play();
          });
        return;
      }

      const open = gsap.timeline({ paused: true });
      // Out of the section's near-black ground by opacity, not a filter: a
      // live filter on a full-bleed photograph re-rasterises every frame.
      gsap.set(img, { scale: 1.12, autoAlpha: 0 });
      open.to(img, { scale: 1, duration: 2.2, ease: 'expo.out', clearProps: 'transform' }, 0);
      open.to(img, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0);
      open.add(() => {
        copy.play();
      }, 0.35);
      decoded.then(() => {
        if (alive) open.play();
      });
    }, root);

    return () => {
      alive = false;
      ctx.revert();
    };
    // Built once per mount; `arrival` is fixed at first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={rootRef}
      data-nav="dark"
      aria-label={title}
      className="relative w-full overflow-hidden bg-[#0d0d0d] text-white"
      style={{ height: '100svh', fontFamily: 'var(--font-josefin)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={arrival ? arrival.src : projectHeroUrl(project.heroImageId, 2000)}
        srcSet={arrival ? undefined : projectHeroSrcSet(project.heroImageId)}
        sizes={arrival ? undefined : '100vw'}
        alt={title}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        // On arrival the picture is already on screen (on the layer above),
        // so it must be here from the first paint.
        style={arrival ? undefined : HIDDEN}
      />

      {/* Legibility, as its own node: the image itself is never dimmed. */}
      <div
        data-scrim
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          ...HIDDEN,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0) 62%), linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 22%)',
        }}
      />

      <div className="px-page absolute inset-x-0 bottom-0 pb-[max(28px,5.5svh)]">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div data-status className="mb-5 flex items-center gap-3 lg:mb-7">
              <span
                data-rule
                aria-hidden="true"
                className="block h-px w-10 shrink-0"
                style={{ background: TEAL }}
              />
              <Reveal className="text-label uppercase">
                <span style={{ letterSpacing: '0.24em' }}>{STATUS_LABEL[project.status]}</span>
              </Reveal>
            </div>

            <h1 className="text-[clamp(3.1rem,9.2vw,11.5rem)] font-[200] leading-[0.94] tracking-[-0.015em]">
              {words.map((word, i) => (
                // Padding inside the mask keeps descenders and accents whole.
                <span
                  key={i}
                  className="-mb-[0.14em] -mt-[0.18em] block overflow-hidden pb-[0.14em] pt-[0.18em]"
                >
                  <span data-word className="block" style={HIDDEN}>
                    {word}
                  </span>
                </span>
              ))}
            </h1>
          </div>

          <dl
            data-particulars
            className="grid shrink-0 grid-cols-3 gap-x-[clamp(20px,3vw,56px)] lg:mb-[0.9vw]"
          >
            {particulars.map((p) => (
              <div key={p.label} className="min-w-0">
                <dt>
                  <Reveal className="text-[10px] font-[600] uppercase tracking-[0.24em] text-white/60">
                    {p.label}
                  </Reveal>
                </dt>
                <dd className="mt-2">
                  <Reveal className="text-[15px] font-[300] leading-[1.4]">{p.value}</Reveal>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
