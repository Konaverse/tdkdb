'use client';

import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import RevealFrame from '@/components/animations/RevealFrame';
import { useProjectTransition } from '@/components/transition/ProjectTransition';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { CHAR_HIDDEN, maskChars, riseIn } from '@/lib/animations/text';
import { imageSrcSet, imageUrl, portraitSrcSet, portraitUrl } from '@/lib/sanity/image';
import { displayTitle, projectHref, projectScope, STATUS_LABEL } from '@/lib/projects/display';
import type { Project, ProjectScope } from '@/lib/sanity/types';
import styles from './ProjectsClient.module.css';

/* ───────────────────────────────────────────────────────────────────────────
   Projects — the hub

   A ledger, not a gallery. No filters, no tabs, no cards: each building
   stands at the page's full content width and states itself. The viewport
   hero holds a centered portrait and a row continuing off the right edge,
   with the title and introduction aligned along the bottom.

   Two ledgers, by scope (Sept 2026, at the client's request): what the
   studio drew AND built (Armonia, Almond Suites), and what it drew for
   others to build (the Modulars, the Vragadinou complexes). They must never
   share a list — a design-only project must not read as one TDK built.

   Everything sits on the page grid (--page-margin / 12 columns), the plates
   are the project page's plate (content width, 16:9), and each one enters
   with the site's one image entrance (RevealFrame: the cover lifts, the
   render settles). No scroll zoom here: the architect asked for as few
   effects as possible on this page. A plain click opens the project
   through ProjectTransition, exactly as on the homepage, so the render
   becomes the page's hero either way.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectsClientProps {
  projects: Project[];
}

const INK = '#111111';
const BODY = 'rgba(17, 17, 17, 0.72)';
const MUTED = 'rgba(17, 17, 17, 0.5)';
const TEAL = 'var(--color-threshold, #66979f)';

const LEAD =
  'The studio takes on a few homes at a time. Some we draw and build ourselves, from the first sketch to the keys; others we draw for someone else to build.';

/** The two ledgers, in page order. */
const GROUPS: { scope: ProjectScope; title: string; note: string }[] = [
  {
    scope: 'design-build',
    title: 'Designed and built',
    note: 'Drawn, built and handed over by the studio. The same people from the first sketch to the last fitting.',
  },
  {
    scope: 'design',
    title: 'Designed',
    note: 'Drawn by the studio and built by others. The plan, the elevations and the detail were ours; the site was someone else’s.',
  },
];

export default function ProjectsClient({ projects }: ProjectsClientProps) {
  const rootRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const transition = useProjectTransition();

  const featured = projects.find((p) => p.slug.current === 'almond-suites');
  const heroProjects = featured
    ? [featured, ...projects.filter((p) => p._id !== featured._id)]
    : projects;

  const groups = GROUPS.map((g) => ({
    ...g,
    projects: projects.filter((p) => projectScope(p) === g.scope),
  })).filter((g) => g.projects.length);

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
      transition.start({ href, slug: p.slug.current, image_source: p.heroImage, frame, image });
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
        const leadSplit = leadEl ? maskChars(leadEl) : null;
        const heroChars = maskChars(q('[data-hero-word]')).chars;
        if (leadSplit) gsap.set(leadSplit.chars, CHAR_HIDDEN);

        const hero = gsap
          .timeline({ delay: 0.15, onComplete: () => leadSplit?.split.revert() })
          .to(heroChars, riseIn(heroChars), 0);
        if (leadSplit) {
          hero.to(leadSplit.chars, riseIn(leadSplit.chars), 0.45);
        }

        /* each ledger's heading and note rise letter by letter */
        q('[data-group]').forEach((group) => {
          const title = group.querySelector('[data-group-title]');
          const noteEl = group.querySelector<HTMLElement>('[data-group-note]');
          const note = noteEl ? maskChars(noteEl) : null;
          const titleChars = maskChars(title).chars;
          if (note) gsap.set(note.chars, CHAR_HIDDEN);
          const tl = gsap
            .timeline({
              scrollTrigger: { trigger: group, start: 'top 82%', once: true },
              onComplete: () => note?.split.revert(),
            })
            .to(titleChars, riseIn(titleChars), 0);
          if (note) {
            tl.to(note.chars, riseIn(note.chars), 0.3);
          }
        });

        /* each entry: the name and particulars arrive under the plate */
        q('[data-entry]').forEach((entry) => {
          const name = entry.querySelector('[data-name]');
          const rows = entry.querySelectorAll('[data-detail]');
          const nameChars = maskChars(name).chars;
          gsap.set(rows, { autoAlpha: 0, y: 16 });
          gsap
            .timeline({ scrollTrigger: { trigger: entry, start: 'top 72%', once: true } })
            .to(nameChars, riseIn(nameChars), 0)
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
      {/* The first portrait is centered; the remaining frames bleed right. */}
      <section data-projects-hero className={styles.hero} aria-labelledby="projects-heading">
        <div data-projects-strip className={styles.strip}>
          {heroProjects.map((p, index) => (
            <RevealFrame
              key={p._id}
              nav="dark"
              className={styles.portrait}
              frameAttrs={{ 'data-hero-portrait': '' }}
            >
              <img
                src={portraitUrl(p.heroImage, 900)}
                srcSet={portraitSrcSet(p.heroImage, [450, 600, 900, 1200])}
                sizes="(min-width: 640px) 26vw, 42vw"
                alt={p.heroImage.alt || `${displayTitle(p)}, ${p.location}`}
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className="block h-full w-full object-cover"
              />
            </RevealFrame>
          ))}
        </div>

        <div className={`px-page ${styles.copy}`}>
          <h1
            id="projects-heading"
            className="text-[clamp(38px,12vw,72px)] font-[200] leading-[0.86] tracking-[-0.02em] sm:text-[clamp(64px,10.5vw,200px)]"
          >
            {['Projects'].map((word) => (
              <span
                key={word}
                className="-mb-[0.1em] -mt-[0.18em] block overflow-hidden pb-[0.1em] pt-[0.18em]"
              >
                <span data-hero-word className="block">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          <p
            data-lead
            className="max-w-[34ch] justify-self-end text-[clamp(13px,1.35vw,24px)] font-[300] leading-[1.45]"
          >
            {LEAD}
          </p>
        </div>
      </section>

      {/* ── The ledgers ──────────────────────────────────────────────────── */}
      <div className="px-page flex flex-col gap-[22svh] pb-[18svh] pt-[12svh]">
        {groups.map((g) => (
          <section key={g.scope} data-group aria-labelledby={`projects-${g.scope}`}>
            <div className="lg:gap-x-gutter grid items-end gap-y-6 lg:grid-cols-12">
              <h2
                id={`projects-${g.scope}`}
                className="-mb-[0.08em] -mt-[0.16em] overflow-hidden pb-[0.08em] pt-[0.16em] text-[clamp(30px,3.5vw,64px)] font-[300] leading-[1.05] tracking-[-0.01em] lg:col-span-6"
              >
                <span data-group-title className="block">
                  {g.title}
                </span>
              </h2>
              <p
                data-group-note
                className="max-w-[44ch] text-[clamp(15px,1.1vw,19px)] font-[300] leading-[1.6] lg:col-span-5 lg:col-start-8"
                style={{ color: BODY }}
              >
                {g.note}
              </p>
            </div>

            <div className="mt-[9svh] flex flex-col gap-[13svh]">
              {g.projects.map((p) => {
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl(p.heroImage, { width: 1600 })}
                          srcSet={imageSrcSet(p.heroImage)}
                          sizes="(min-width: 1024px) 100vw, 180vw"
                          alt={title}
                          loading="lazy"
                          decoding="async"
                          className="block h-full w-full object-cover"
                        />
                      </RevealFrame>

                      <div className="lg:gap-x-gutter mt-8 grid items-baseline gap-y-8 lg:grid-cols-12">
                        <h3 className="-mb-[0.08em] -mt-[0.16em] overflow-hidden pb-[0.08em] pt-[0.16em] text-[clamp(32px,4vw,76px)] font-[300] leading-[1] tracking-[-0.01em] lg:col-span-6">
                          <span
                            data-name
                            className="block transition-colors duration-500 ease-smooth group-hover:text-threshold"
                          >
                            {title}
                          </span>
                        </h3>

                        <dl className="gap-x-gutter grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:col-span-5 lg:col-start-8">
                          {details.map((d) => (
                            <div key={d.label} data-detail className="min-w-0">
                              <dt
                                className="text-[clamp(12px,0.9vw,15px)]"
                                style={{ color: MUTED }}
                              >
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
          </section>
        ))}
      </div>
    </main>
  );
}
