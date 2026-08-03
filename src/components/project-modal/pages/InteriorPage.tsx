'use client';

import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

import type { ProjectModalPageProps } from '../registry';
import { PAGE_PAD } from '../registry';

/* ───────────────────────────────────────────────────────────────────────────
   Interior — SCAFFOLD.

   The counterweight to Exterior: type on the left, a tall stack of plates on
   the right that scrolls inside the sheet. Designed properly in its own pass.
   ─────────────────────────────────────────────────────────────────────────── */

export default function InteriorPage({ project }: ProjectModalPageProps) {
  const pool = [
    ...(project.photosGallery?.images ?? []),
    project.homepagePortraitImageId,
    project.homepageGridImageId,
    project.heroImageId,
  ].filter((id): id is string => Boolean(id));

  return (
    <div
      className="grid min-h-full w-full grid-cols-1 lg:grid-cols-12"
      style={{ padding: PAGE_PAD }}
    >
      <div className="lg:sticky lg:top-0 lg:col-span-4 lg:self-start lg:pr-[3vw]">
        <h2
          data-page-rise
          className="font-sans font-[300] leading-[0.95] tracking-[0.02em] text-paper"
          style={{ fontSize: 'clamp(28px, 2.6vw, 48px)' }}
        >
          Interior
        </h2>

        <p data-page-rise className="mt-8 max-w-[38ch] text-body text-stone">
          {project.photosGallery?.caption ??
            project.homepageParagraphClose ??
            'Interior photography for this residence is being prepared.'}
        </p>
      </div>

      <div
        data-page-rise
        className="mt-10 flex flex-col gap-[1.6vw] lg:col-span-7 lg:col-start-6 lg:mt-0"
      >
        {pool.slice(0, 4).map((id, i) => (
          <div
            key={`${id}-${i}`}
            className="relative w-full overflow-hidden"
            // Alternating ratios keep the stack from reading as a uniform feed.
            style={{ aspectRatio: i % 2 === 0 ? '16 / 10' : '4 / 3' }}
          >
            <img
              src={cloudinaryUrl(id, { width: 1400 })}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
