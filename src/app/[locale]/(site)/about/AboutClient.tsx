'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import RevealFrame from '@/components/animations/RevealFrame';
import { gsap, gsapInit, ScrollTrigger } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';
import { cloudinaryUrl, responsiveSrcSet } from '@/lib/cloudinary/transforms';

/* ───────────────────────────────────────────────────────────────────────────
   About — the studio, light and editorial

   From the two boards the user supplied: a headline with a photograph set
   into the line itself, a full-width plate under it, a statement paired with
   a row of captioned plates, and then the second board's spread — small text
   columns against a large picture, a staggered row of plates with captions,
   and a pull quote held in the margin.

   Everything is on the page grid, every picture enters with the site's one
   image entrance (RevealFrame), and the big plates carry a slow drift so the
   page keeps moving without anything sliding about.

   The copy is the studio's own: a family practice, three people, two
   buildings. No invented numbers — the old page claimed fifteen years and
   eight deliveries, which is not what the dataset says.
   ─────────────────────────────────────────────────────────────────────────── */

const INK = '#111111';
const BODY = 'rgba(17, 17, 17, 0.72)';
const MUTED = 'rgba(17, 17, 17, 0.5)';

const IMG = {
  chip: 'clients/tdkdb/armonia/interior/5.jpg',
  hero: 'clients/tdkdb/general/about/armonia_front_angle_day',
  draw: 'clients/tdkdb/general/about/second-design-philosophy',
  build: 'clients/tdkdb/general/about/fourth-people',
  handover: 'clients/tdkdb/armonia/interior/2.jpg',
  spread: 'clients/tdkdb/armonia/interior/4.jpg',
  small1: 'clients/tdkdb/armonia/exterior/2.jpg',
  small2: 'clients/tdkdb/armonia/interior/3.jpg',
  standard: 'clients/tdkdb/almond/renders/ChatGPT_Image_Feb_6_2026_08_07_30_PM.png',
};

const LEAD =
  'TDK Design & Build is run by three members of the Kyprianou family. The architect who draws a residence and the manager who builds it sit in the same room, and the same name is on both.';

const ROOF_HEADING = ['One team, from the', 'first sketch to the', 'last fitting.'];
const ROOF_BODY =
  'Most developments pass through three or four companies before anyone lives in them. Ours do not. Drawing, building and handing over are the same people, so nothing is lost in between — and there is no one else to point at when something is wrong.';

const STEPS = [
  {
    n: '01',
    title: 'Draw',
    line: 'Theodora reads the site, the brief and the light, and draws until the plan is resolved.',
    image: IMG.draw,
  },
  {
    n: '02',
    title: 'Build',
    line: 'Marios runs the site — the materials, the contractors, the sequence, the standard.',
    image: IMG.build,
  },
  {
    n: '03',
    title: 'Hand over',
    line: 'We finish the building, snag it ourselves, and give you the keys.',
    image: IMG.handover,
  },
];

const POSITION = [
  'We take on a few homes at a time. That is a limit we set, not a stage we are passing through: a studio this size can detail every residence as if it were the only one.',
  'The practice is young. What we have built stands in Lakatamia and Strovolos, and it is the argument for what comes next.',
];

const QUOTE = 'A home is not a beautiful object. It is a space that makes daily life feel better.';
const QUOTE_BY = 'Theodora Kyprianou, architect';

const STANDARD_HEADING = ['Every decision on a site', 'shows up in the finished', 'building.'];
const STANDARD_BODY =
  'So we make them in person — the material, the contractor, the detail where the floor meets the wall. It is slower than handing a drawing to someone else and waiting to see what comes back, and it is the only way we can promise that what was drawn is what you are given.';

const CLOSE = 'If you are thinking about a home, write to us.';

/** The headline's lines. The photograph is set into the end of the first one.
    Phones get their own, shorter breaks: the lines must never wrap, or the
    picture is stranded mid-air. */
const HEAD_WIDE = ['A family studio', 'builds, and hands over', 'the keys.'];
const HEAD_WIDE_TAIL = 'that draws,';
const HEAD_NARROW = ['A family studio', 'that draws, builds,', 'and hands over', 'the keys.'];

/** A picture with vertical overscan, for a slow drift inside its frame. */
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

function Picture({
  id,
  alt,
  sizes,
  position,
}: {
  id: string;
  alt: string;
  sizes: string;
  /** object-position, for portraits where the centre is not the subject. */
  position?: string;
}) {
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
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

/** The photograph set into the headline. */
function Chip() {
  return (
    <span className="inline-block h-[0.58em] w-[1.5em] shrink-0 translate-y-[0.04em] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cloudinaryUrl(IMG.chip, { width: 400 })}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p data-rise className="mt-4 text-[clamp(12px,0.9vw,15px)]" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

export default function AboutClient() {
  const rootRef = useRef<HTMLElement>(null);

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
        gsap.set(q('[data-hero-line]'), { xPercent: -104, x: 0 });
        if (leadSplit) gsap.set(leadSplit.lines, { clipPath: LINE_HIDDEN });

        const hero = gsap
          .timeline({ delay: 0.15, onComplete: () => leadSplit?.split.revert() })
          .to(
            q('[data-hero-line]'),
            { xPercent: 0, x: 0, duration: 1.4, ease: 'power4.out', stagger: 0.1 },
            0,
          );
        if (leadSplit) {
          hero.to(
            leadSplit.lines,
            { clipPath: LINE_SHOWN, duration: 0.9, ease: 'power2.inOut', stagger: 0.12 },
            0.5,
          );
        }

        /* headings slide into their masks as they arrive */
        q('[data-heading]').forEach((heading) => {
          const lines = heading.querySelectorAll('[data-heading-line]');
          gsap.set(lines, { xPercent: -104, x: 0 });
          gsap.to(lines, {
            xPercent: 0,
            x: 0,
            duration: 1.3,
            ease: 'power4.out',
            stagger: 0.09,
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
          });
        });

        /* paragraphs are written on line by line; everything else rises */
        q('[data-write]').forEach((el) => {
          const { split, lines } = maskLines(el);
          gsap.set(lines, { clipPath: LINE_HIDDEN });
          gsap.to(lines, {
            clipPath: LINE_SHOWN,
            duration: 0.9,
            ease: 'power2.inOut',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onComplete: () => split.revert(),
          });
        });

        q('[data-rise]').forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 20 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            },
          );
        });

        /* the plates drift slowly as they cross */
        q('[data-pan]').forEach((el) => {
          const range = Number((el as HTMLElement).dataset.pan);
          gsap.fromTo(
            el,
            { yPercent: -range },
            {
              yPercent: range,
              ease: 'none',
              scrollTrigger: {
                trigger: el.parentElement!,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
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

  // Lines never wrap: the photograph sits inside the first one, and a wrap
  // would strand it mid-air. The size is in vw, so the longest line always fits.
  const heroLine =
    '-mb-[0.1em] -mt-[0.16em] block overflow-hidden whitespace-nowrap pb-[0.1em] pt-[0.16em]';

  return (
    <main
      ref={rootRef}
      data-nav="light"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      {/* ── Hero — the headline carries a photograph inside the line ────── */}
      <section className="px-page pb-[9svh] pt-[22svh]">
        <div className="lg:gap-x-gutter grid items-end gap-y-12 lg:grid-cols-12">
          {/* Two sets of breaks, one per width — see HEAD_WIDE / HEAD_NARROW. */}
          <h1 className="lg:col-span-9">
            <span className="hidden text-[clamp(30px,4.9vw,92px)] font-[200] leading-[1.06] tracking-[-0.015em] sm:block">
              {HEAD_WIDE.map((line, i) => (
                <span key={line} className={heroLine}>
                  <span data-hero-line className="inline-flex items-baseline gap-[0.22em]">
                    {line}
                    {i === 0 && (
                      <>
                        <Chip />
                        {HEAD_WIDE_TAIL}
                      </>
                    )}
                  </span>
                </span>
              ))}
            </span>

            <span className="block text-[clamp(26px,7.6vw,40px)] font-[200] leading-[1.1] tracking-[-0.015em] sm:hidden">
              {HEAD_NARROW.map((line, i) => (
                <span key={line} className={heroLine}>
                  <span data-hero-line className="inline-flex items-baseline gap-[0.22em]">
                    {line}
                    {i === 0 && <Chip />}
                  </span>
                </span>
              ))}
            </span>
          </h1>

          <p
            data-lead
            className="max-w-[36ch] text-[clamp(17px,1.25vw,22px)] font-[300] leading-[1.5] lg:col-span-3 lg:col-start-10"
            style={{ color: BODY }}
          >
            {LEAD}
          </p>
        </div>
      </section>

      {/* ── The plate ────────────────────────────────────────────────────── */}
      <section className="px-page">
        <RevealFrame nav="dark" className="aspect-[4/5] w-full lg:aspect-[16/9]">
          <Drift range={5}>
            <Picture
              id={IMG.hero}
              alt="An Armonia facade at dusk"
              sizes="(min-width: 1024px) 100vw, 180vw"
            />
          </Drift>
        </RevealFrame>
      </section>

      {/* ── One roof ─────────────────────────────────────────────────────── */}
      <section className="px-page pt-[16svh]">
        <div className="lg:gap-x-gutter grid gap-y-10 lg:grid-cols-12">
          <h2
            data-heading
            className="text-[clamp(30px,3.5vw,64px)] font-[300] leading-[1.08] tracking-[-0.01em] lg:col-span-6"
          >
            {ROOF_HEADING.map((line) => (
              <span
                key={line}
                className="-mb-[0.08em] -mt-[0.14em] block overflow-hidden pb-[0.08em] pt-[0.14em]"
              >
                <span data-heading-line className="block">
                  {line}
                </span>
              </span>
            ))}
          </h2>

          <p
            data-write
            className="max-w-[46ch] text-[clamp(16px,1.15vw,20px)] font-[300] leading-[1.65] lg:col-span-5 lg:col-start-8 lg:self-end"
            style={{ color: BODY }}
          >
            {ROOF_BODY}
          </p>
        </div>

        {/* the three moves, as plates */}
        <div className="gap-page lg:gap-x-gutter mt-[9svh] grid grid-cols-1 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title}>
              <RevealFrame nav="dark" className="aspect-[4/5] w-full">
                <Picture id={s.image} alt="" sizes="(min-width: 640px) 34vw, 100vw" />
              </RevealFrame>
              <div className="mt-5 flex items-baseline gap-4">
                <span data-rise className="font-mono text-[12px]" style={{ color: MUTED }}>
                  {s.n}
                </span>
                <h3 data-rise className="text-[clamp(20px,1.7vw,30px)] font-[300]">
                  {s.title}
                </h3>
              </div>
              <p
                data-rise
                className="mt-3 max-w-[34ch] text-[clamp(15px,1.05vw,18px)] font-[300] leading-[1.55]"
                style={{ color: BODY }}
              >
                {s.line}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The spread — text columns against a large picture ────────────── */}
      <section className="px-page pt-[18svh]">
        <div className="lg:gap-x-gutter grid gap-y-12 lg:grid-cols-12">
          <div className="flex flex-col gap-7 lg:col-span-3 lg:pt-[6svh]">
            {POSITION.map((p) => (
              <p
                key={p.slice(0, 20)}
                data-write
                className="max-w-[40ch] text-[clamp(15px,1.05vw,18px)] font-[300] leading-[1.6]"
                style={{ color: BODY }}
              >
                {p}
              </p>
            ))}
          </div>

          <div className="lg:col-span-8 lg:col-start-5">
            <RevealFrame nav="dark" className="aspect-[4/5] w-full lg:aspect-[3/2]">
              <Drift range={6}>
                <Picture
                  id={IMG.spread}
                  alt="An Armonia living space opening onto its terrace"
                  sizes="(min-width: 1024px) 70vw, 100vw"
                />
              </Drift>
            </RevealFrame>
            <Caption>Armonia, Lakatamia — the living space onto the terrace</Caption>
          </div>
        </div>

        {/* the staggered row, and the quote held in the margin */}
        <div className="lg:gap-x-gutter mt-[10svh] grid gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <RevealFrame nav="dark" className="aspect-[4/5] w-full">
              <Picture
                id={IMG.small1}
                alt="Armonia from the street"
                sizes="(min-width: 1024px) 28vw, 100vw"
              />
            </RevealFrame>
            <Caption>Armonia, Lakatamia — completed 2025</Caption>
          </div>

          <div className="lg:col-span-4 lg:mt-[9svh]">
            <RevealFrame nav="dark" className="aspect-[3/2] w-full">
              <Picture
                id={IMG.small2}
                alt="An Armonia interior"
                sizes="(min-width: 1024px) 36vw, 100vw"
              />
            </RevealFrame>
            <Caption>Interior, as delivered</Caption>
          </div>

          <blockquote className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p
              data-write
              className="text-[clamp(22px,2.1vw,38px)] font-[300] leading-[1.25]"
              style={{ color: MUTED }}
            >
              {QUOTE}
            </p>
            <footer
              data-rise
              className="mt-5 text-[clamp(13px,0.95vw,16px)]"
              style={{ color: MUTED }}
            >
              {QUOTE_BY}
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── The standard — one picture, the text laid inside it ───────── */}
      <section className="px-page pt-[20svh]">
        <RevealFrame nav="dark" className="h-[78svh] w-full lg:h-[92svh]">
          <Drift range={5}>
            <Picture
              id={IMG.standard}
              alt="Almond Suites at dusk"
              sizes="(min-width: 1024px) 100vw, 180vw"
            />
          </Drift>

          {/* Legibility for the type, never the picture's own dimming. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.3) 38%, rgba(0,0,0,0) 68%)',
            }}
          />

          <div className="lg:gap-x-gutter absolute inset-x-0 bottom-0 grid gap-y-8 p-[max(20px,3vw)] text-white lg:grid-cols-12">
            <h2
              data-heading
              className="text-[clamp(26px,3.2vw,58px)] font-[300] leading-[1.1] tracking-[-0.01em] lg:col-span-6"
            >
              {STANDARD_HEADING.map((line) => (
                <span
                  key={line}
                  className="-mb-[0.08em] -mt-[0.14em] block overflow-hidden pb-[0.08em] pt-[0.14em]"
                >
                  <span data-heading-line className="block">
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            <p
              data-write
              className="max-w-[44ch] text-[clamp(15px,1.1vw,19px)] font-[300] leading-[1.6] text-white/85 lg:col-span-4 lg:col-start-9 lg:self-end"
            >
              {STANDARD_BODY}
            </p>
          </div>
        </RevealFrame>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────── */}
      <section className="px-page pb-[18svh] pt-[20svh]">
        <div className="lg:gap-x-gutter grid gap-y-8 lg:grid-cols-12">
          <p
            data-write
            className="text-[clamp(30px,4.2vw,84px)] font-[300] leading-[1.06] tracking-[-0.01em] lg:col-span-8"
          >
            {CLOSE}
          </p>
          <div className="lg:col-span-3 lg:col-start-10 lg:self-end">
            <Link
              data-rise
              href="/en/contact"
              className="group inline-flex items-center gap-4 text-[clamp(13px,0.9vw,15px)] font-[600] uppercase tracking-[0.2em]"
            >
              <span className="transition-colors duration-300 group-hover:text-threshold">
                Write to us
              </span>
              <span
                aria-hidden="true"
                className="relative block h-px w-10 bg-current transition-[width,background-color] duration-500 ease-smooth group-hover:w-16 group-hover:bg-threshold"
              >
                <span className="absolute -top-[3px] right-0 block h-[7px] w-[7px] rotate-45 border-r border-t border-current transition-colors duration-300 group-hover:border-threshold" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
