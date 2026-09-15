'use client';

import { useLayoutEffect, useRef } from 'react';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { LINE_HIDDEN, LINE_SHOWN, maskLines } from '@/lib/animations/lines';

/* ───────────────────────────────────────────────────────────────────────────
   ProjectStory — what the building is, and how far along it is

   Left, the description: its first paragraph set large as the lead, the rest
   in reading size under it, indented to leave the page's white working.
   Right, the site's state in one number: the percentage built, very large,
   a solid bar under it, the stage in words, and the delivery year. Below
   that, whatever specifications the project carries, as plain pairs.

   MOTION — once, on arrival
   · The lead is written on line by line; the body follows as a whole.
   · The percentage counts up while the bar fills to it, the same tween.
   · The specification pairs rise in.
   ─────────────────────────────────────────────────────────────────────────── */

interface ProjectStoryProps {
  paragraphs: string[];
  progress?: { percent: number; label?: string };
  /** "Delivery 2026" / "Completed 2025". */
  milestone: { label: string; value: string };
  specs: { key: string; value: string }[];
}

const INK = '#111111';
const MUTED = 'rgba(17, 17, 17, 0.5)';
const TRACK = '#ecece8';
const TEAL = 'var(--color-threshold, #66979f)';

export default function ProjectStory({
  paragraphs,
  progress,
  milestone,
  specs,
}: ProjectStoryProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [lead, ...body] = paragraphs;
  const percent = progress ? Math.max(0, Math.min(100, Math.round(progress.percent))) : null;

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
        const leadEl = q('[data-lead]')[0];
        const leadSplit = leadEl ? maskLines(leadEl) : null;
        const counter = q('[data-percent]')[0] as HTMLElement | undefined;
        const fill = q('[data-fill]')[0];

        if (leadSplit) gsap.set(leadSplit.lines, { clipPath: LINE_HIDDEN });
        gsap.set(q('[data-body]'), { autoAlpha: 0, y: 20 });
        gsap.set(q('[data-rise]'), { autoAlpha: 0, y: 20 });
        if (fill) gsap.set(fill, { scaleX: 0, transformOrigin: '0% 50%' });
        if (counter) counter.textContent = '0';

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: 'top 85%', once: true },
          onComplete: () => leadSplit?.split.revert(),
        });

        if (leadSplit) {
          tl.to(
            leadSplit.lines,
            { clipPath: LINE_SHOWN, duration: 1, ease: 'power2.inOut', stagger: 0.12 },
            0,
          );
        }
        tl.to(
          q('[data-body]'),
          { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 },
          0.6,
        );
        tl.to(
          q('[data-rise]'),
          { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 },
          0.2,
        );

        if (counter && fill && percent !== null) {
          const n = { v: 0 };
          tl.to(
            n,
            {
              v: percent,
              duration: 2,
              ease: 'power3.inOut',
              onUpdate: () => {
                counter.textContent = String(Math.round(n.v));
                gsap.set(fill, { scaleX: n.v / 100 });
              },
            },
            0.45,
          );
        }
      }, root);
    });

    return () => {
      alive = false;
      ctx?.revert();
    };
  }, [percent]);

  return (
    <section
      ref={rootRef}
      data-nav="light"
      aria-label="About the project"
      className="relative grid gap-20 px-page pb-[20svh] pt-[10svh] lg:grid-cols-12 lg:gap-x-gutter"
      style={{ background: '#ffffff', color: INK, fontFamily: 'var(--font-josefin)' }}
    >
      <div className="lg:col-span-7">
        {lead && (
          <p
            data-lead
            className="max-w-[26ch] text-[clamp(26px,2.55vw,48px)] font-[300] leading-[1.24]"
          >
            {lead}
          </p>
        )}
        {body.length > 0 && (
          <div className="mt-[8svh] flex max-w-[560px] flex-col gap-6 lg:ml-[16.6%]">
            {body.map((p, i) => (
              <p
                key={i}
                data-body
                className="text-[clamp(17px,1.2vw,20px)] font-[300] leading-[1.65]"
                style={{ color: 'rgba(17, 17, 17, 0.78)' }}
              >
                {p}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:col-span-4 lg:col-start-9 lg:pt-[0.6vw]">
        {percent !== null && (
          <div data-rise>
            <p className="font-mono text-[clamp(84px,9.5vw,180px)] leading-[0.8] tracking-[-0.06em]">
              <span data-percent>{percent}</span>
              <span className="ml-2 font-sans text-[0.32em] font-[300] tracking-normal">%</span>
            </p>
            <div className="mt-9 h-[6px] w-full" style={{ background: TRACK }}>
              <div
                data-fill
                className="h-full w-full"
                style={{
                  background: TEAL,
                  transform: `scaleX(${percent / 100})`,
                  transformOrigin: '0% 50%',
                }}
              />
            </div>
            {progress?.label && (
              <p className="mt-5 text-[clamp(17px,1.25vw,22px)] font-[300]">
                {sentenceCase(progress.label)}
              </p>
            )}
          </div>
        )}

        <dl className={`grid grid-cols-2 gap-x-6 gap-y-9 ${percent !== null ? 'mt-[9svh]' : ''}`}>
          {[milestone, ...specs.map((s) => ({ label: s.key, value: s.value }))].map((s) => (
            <div key={s.label} data-rise>
              <dt className="text-[clamp(13px,0.95vw,15px)]" style={{ color: MUTED }}>
                {s.label}
              </dt>
              <dd className="mt-2 text-[clamp(18px,1.4vw,24px)] font-[300]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** "Foundational Complete" → "Foundational complete". */
function sentenceCase(s: string): string {
  const t = s.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
