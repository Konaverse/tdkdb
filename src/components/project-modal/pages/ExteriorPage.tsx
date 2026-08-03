'use client';

import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Exterior — SCAFFOLD.

   A held composition rather than a scrolling gallery: one large plate with
   two smaller ones stacked beside it, on a grid that keeps a column open.
   Designed properly in its own pass.
   ─────────────────────────────────────────────────────────────────────────── */

export default function ExteriorPage({ project }: ProjectModalPageProps) {
  const pool = [
    ...(project.rendersGallery?.images ?? []),
    project.heroImageId,
    project.homepageGridImageId,
    project.homepagePortraitImageId,
  ].filter((id): id is string => Boolean(id));

  const [lead, second, third] = pool;

  return (
    <div className="flex min-h-full w-full flex-col" style={{ padding: PAGE_PAD }}>
      <h2
        data-page-rise
        className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
        style={{ fontSize: 'clamp(28px, 2.6vw, 48px)' }}
      >
        Exterior
      </h2>

      <div
        data-page-rise
        className="mt-10 grid min-h-[52vh] flex-1 grid-cols-1 gap-[1.4vw] lg:grid-cols-12"
      >
        {/* Lead plate — seven of twelve, so column 8 stays open. */}
        <div className="relative overflow-hidden lg:col-span-7 lg:row-span-2">
          {lead && (
            <img
              src={cloudinaryUrl(lead, { width: 1600 })}
              alt={`${project.title} exterior`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col gap-[1.4vw] lg:col-span-4 lg:col-start-9">
          {[second, third].map((id, i) => (
            <div key={i} className="relative min-h-[22vh] flex-1 overflow-hidden">
              {id && (
                <img
                  src={cloudinaryUrl(id, { width: 1000 })}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {project.rendersGallery?.caption && (
        <p data-page-rise className="mt-7 max-w-[52ch] text-body text-stone">
          {project.rendersGallery.caption}
        </p>
      )}
    </div>
  );
}
