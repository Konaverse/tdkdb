'use client';

import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import RevealFrame from '@/components/animations/RevealFrame';
import { useProjectTransition } from '@/components/transition/ProjectTransition';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';
import { cloudinaryUrl, responsiveSrcSet } from '@/lib/cloudinary/transforms';
import { displayTitle, projectHref, STATUS_LABEL } from '@/lib/projects/display';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   Projects — the hub

   A ledger, not a gallery. No filters, no tabs, no cards: two buildings, so
   each one stands at the page's full content width and states itself. The
   hero is typographic — the page's photographs are the projects themselves,
   and the first one arrives a scroll later.

   Everything sits on the page grid (--page-margin / 12 columns), the plates
   are the project page's plate (content width, 16:9, render pulling back on
   scroll), and each entry enters with the site's one image entrance. A plain
   click opens the project through ProjectTransition, exactly as on the
   homepage, so the render becomes the page's hero either way.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsClientProps {
  projects: Project[];
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';
const TEAL = 'var(--color-threshold, #66979f)';

const LEAD =
  'The studio takes on a few homes at a time. The architects who draw a residence are the ones who build it and hand over the keys.';

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const transition = useProjectTransition();

  const units = projects.flatMap((p) => p.units ?? []);
  const available = units.filter((u) => u.status === 'available').length;
  const figures = [
    { value: projects.length, label: projects.length === 1 ? 'Building' : 'Buildings' },
    ...(units.length ? [{ value: units.length, label: 'Residences' }] : []),
    ...(units.length ? [{ value: available, label: available ? 'Available' : 'Sold out' }] : []),
  ];

  /** Plain clicks go through the transition; modified ones stay links. */
  const open = (e: ReactMouseEvent<HTMLAnchorElement>, p: Project) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href = projectHref(locale, p.slug.current);
    const frame = e.currentTarget.querySelector<HTMLElement>('[data-frame]');
    const image = frame?.querySelector('img');
    const handled =
      !!frame &&
      !!image &&
      transition.start({ href, slug: p.slug.current, imageId: p.heroImageId, frame, image });
    if (!handled) router.push(href);
  };

  useLayoutEffect(() => {
    gsapInit();
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let alive = true;
    let ctx: gsap.Context | null = null;

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);

        /* the hero, on arrival */
        const leadEl = q('[data-lead]')[0];
        const leadSplit = leadEl ? maskLines(leadEl) : null;
        gsap.set(q('[data-hero-word]'), { xPercent: -104, x: 0 });
        if (leadSplit) gsap.set(leadSplit.lines, { clipPath: LINE_HIDDEN });
        gsap.set(q('[data-figure]'), { autoAlpha: 0, y: 18 });

        const hero = gsap
          .timeline({ delay: 0.15, onComplete: () => leadSplit?.split.revert() })
          .to(
            q('[data-hero-word]'),
            { xPercent: 0, x: 0, duration: 1.4, ease: 'power4.out', stagger: 0.1 },
            0,
          );
        if (leadSplit) {
          hero.to(
            leadSplit.lines,
            { clipPath: LINE_SHOWN, duration: 0.9, ease: 'power2.inOut', stagger: 0.12 },
            0.45,
          );
        }
        hero.to(
          q('[data-figure]'),
          { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 },
          0.8,
        );

        /* each entry: the render pulls back as the plate crosses the screen,
           its name and particulars arrive under it */
        q('[data-entry]').forEach((entry) => {
          const zoom = entry.querySelector('[data-zoom]');
          if (zoom) {
            gsap.fromTo(
              zoom,
              { scale: 1.2 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: entry,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }
          const name = entry.querySelector('[data-name]');
          const rows = entry.querySelectorAll('[data-detail]');
          gsap.set(name, { xPercent: -104, x: 0 });
          gsap.set(rows, { autoAlpha: 0, y: 16 });
          gsap
            .timeline({ scrollTrigger: { trigger: entry, start: 'top 72%', once: true } })
            .to(name, { xPercent: 0, x: 0, duration: 1.2, ease: 'power4.out' }, 0)
            .to(
              rows,
              { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
              0.2,
            );
        });

        ScrollTrigger.refresh();
      }, root);
    });

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, []);

  return (
    <main
      ref={rootRef}
      data-nav="light"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      {/* ── Hero — type only; the projects are the pictures ─────────────── */}
      <section className="px-page flex min-h-[82svh] flex-col justify-end pb-[10svh] pt-[24svh]">
        <div className="lg:gap-x-gutter grid items-end gap-y-12 lg:grid-cols-12">
          <h1 className="text-[clamp(64px,10.5vw,200px)] font-[200] leading-[0.86] tracking-[-0.02em] lg:col-span-7">
            {['Projects'].map((word) => (
              <span key={word} className="block overflow-hidden pb-[0.08em]">
                <span data-hero-word className="block">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <div className="lg:col-span-4 lg:col-start-9">
            <p
              data-lead
              className="max-w-[34ch] text-[clamp(18px,1.35vw,24px)] font-[300] leading-[1.45]"
            >
              {LEAD}
            </p>

            <dl className="gap-x-gutter mt-12 grid grid-cols-3">
              {figures.map((f) => (
                <div key={f.label} data-figure className="flex flex-col-reverse">
                  <dt className="mt-2.5 text-[clamp(12px,0.9vw,15px)]" style={{ color: MUTED }}>
                    {f.label}
                  </dt>
                  <dd className="font-mono text-[clamp(26px,2.6vw,46px)] leading-none tracking-[-0.04em]">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── The entries ──────────────────────────────────────────────────── */}
      <div className="px-page flex flex-col gap-[13svh] pb-[18svh]">
        {projects.map((p) => {
          const title = displayTitle(p);
          const unitCount = p.units?.length ?? 0;
          const free = (p.units ?? []).filter((u) => u.status === 'available').length;
          const details = [
            { label: 'Location', value: p.location },
            ...(unitCount
              ? [
                  {
                    label: 'Residences',
                    value:
                      free === unitCount
                        ? `${unitCount}, all available`
                        : free
                          ? `${unitCount}, ${free} available`
                          : `${unitCount}, sold out`,
                    mark: free > 0,
                  },
                ]
              : []),
            {
              label: p.status === 'completed' ? 'Completed' : 'Delivery',
              value: String(p.year),
            },
          ];

          return (
            <article key={p._id} data-entry>
              <Link
                href={projectHref(locale, p.slug.current)}
                onClick={(e) => open(e, p)}
                aria-label={`${title}, ${STATUS_LABEL[p.status].toLowerCase()}`}
                className="group block"
              >
                <RevealFrame
                  nav="dark"
                  frameAttrs={{ 'data-frame': '' }}
                  className="aspect-[4/5] w-full lg:aspect-[16/9]"
                >
                  <div data-zoom className="h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cloudinaryUrl(p.heroImageId, { width: 1600 })}
                      srcSet={responsiveSrcSet(p.heroImageId)}
                      sizes="(min-width: 1024px) 100vw, 180vw"
                      alt={title}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover"
                    />
                  </div>
                </RevealFrame>

                <div className="lg:gap-x-gutter mt-8 grid items-baseline gap-y-8 lg:grid-cols-12">
                  <h2 className="overflow-hidden pb-[0.06em] text-[clamp(32px,4vw,76px)] font-[300] leading-[1] tracking-[-0.01em] lg:col-span-6">
                    <span
                      data-name
                      className="block transition-colors duration-500 ease-smooth group-hover:text-threshold"
                    >
                      {title}
                    </span>
                  </h2>

                  <dl className="gap-x-gutter grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:col-span-5 lg:col-start-8">
                    {details.map((d) => (
                      <div key={d.label} data-detail className="min-w-0">
                        <dt className="text-[clamp(12px,0.9vw,15px)]" style={{ color: MUTED }}>
                          {d.label}
                        </dt>
                        <dd className="mt-2 flex items-center gap-2.5 text-[clamp(15px,1.15vw,20px)] font-[300]">
                          {'mark' in d && d.mark && (
                            <span
                              aria-hidden="true"
                              className="block h-2 w-2 shrink-0"
                              style={{ background: TEAL }}
                            />
                          )}
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
