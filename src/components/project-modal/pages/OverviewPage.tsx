'use client';

import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Overview — SCAFFOLD.

   Structure only, so the shell can be judged on its own: an asymmetric split
   where the type column is padded and the plate bleeds to the sheet edge.
   The composition gets designed properly in its own pass.
   ─────────────────────────────────────────────────────────────────────────── */

export default function OverviewPage({ project }: ProjectModalPageProps) {
  const facts: [string, string][] = [
    ['Location', project.location],
    ['Year', String(project.year)],
    ['Type', project.type.replace('-', ' ')],
    [
      'Status',
      project.status === 'completed'
        ? 'Completed'
        : project.status === 'in-progress'
          ? 'In development'
          : 'Upcoming',
    ],
  ];

  return (
    <div className="grid min-h-full w-full grid-cols-1 lg:grid-cols-12">
      {/* ── Type column ────────────────────────────────────────────────────── */}
      <div className="flex flex-col justify-between lg:col-span-5" style={{ padding: PAGE_PAD }}>
        <div>
          <h2
            data-page-rise
            className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
            style={{ fontSize: 'clamp(34px, 3.4vw, 68px)' }}
          >
            {project.title}
          </h2>

          {project.homepageIntro && (
            <p data-page-rise className="mt-8 max-w-[46ch] text-body text-stone">
              {project.homepageIntro}
            </p>
          )}

          {project.homepageParagraphMid && (
            <p data-page-rise className="mt-5 max-w-[46ch] text-body text-stone">
              {project.homepageParagraphMid}
            </p>
          )}
        </div>

        <dl data-page-rise className="mt-14 grid grid-cols-2 gap-x-8 gap-y-7">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-label tracking-[0.24em] text-stone">{k.toUpperCase()}</dt>
              <dd className="mt-2 font-sans font-[300] capitalize text-paper">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Plate — bleeds to the sheet edge ──────────────────────────────── */}
      <div
        data-page-rise
        className="relative min-h-[42vh] overflow-hidden lg:col-span-7 lg:min-h-0"
      >
        {project.heroImageId && (
          <img
            src={cloudinaryUrl(project.heroImageId, { width: 1600 })}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
