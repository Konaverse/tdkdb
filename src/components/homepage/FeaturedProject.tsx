import Link from 'next/link';

import RevealFrame from '@/components/animations/RevealFrame';
import { displayTitle, projectHref } from '@/lib/projects/display';
import { imageSrcSet, imageUrl } from '@/lib/sanity/image';
import type { Project } from '@/lib/sanity/types';

interface FeaturedProjectProps {
  project: Project;
  locale: string;
}

export default function FeaturedProject({ project, locale }: FeaturedProjectProps) {
  const title = displayTitle(project);
  const href = projectHref(locale, project.slug.current);
  const units = project.units ?? [];
  const available = units.filter((unit) => unit.status === 'available');
  const town = project.location.split(',')[0].trim();
  const percent = Math.max(0, Math.min(100, project.progressPercent ?? 0));
  const image = project.heroImage;

  return (
    <section
      id="featured-almond"
      data-nav="light"
      aria-labelledby="featured-project-heading"
      className="px-page py-[clamp(64px,10svh,120px)] text-[#111111]"
      style={{ background: '#ffffff', fontFamily: 'var(--font-josefin)' }}
    >
      <div className="gap-x-gutter grid items-center gap-y-10 lg:grid-cols-12">
        <RevealFrame className="aspect-[4/3] lg:col-span-7" nav="dark">
          <Link href={href} aria-label={`Explore ${title}`} className="block h-full w-full">
            <img
              src={imageUrl(image, { width: 1600 })}
              srcSet={imageSrcSet(image, [600, 900, 1200, 1600, 2000])}
              sizes="(min-width: 1024px) 56vw, 96vw"
              alt={`${title}, ${project.location}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </Link>
        </RevealFrame>

        <div className="lg:col-span-5 lg:pl-[2vw]">
          <p className="text-[15px] font-[400]">Now selling in {town}</p>
          <h2
            id="featured-project-heading"
            className="mt-6 max-w-[9ch] text-[clamp(52px,5.6vw,100px)] font-[300] leading-[0.94] tracking-[-0.02em]"
          >
            {title}
          </h2>
          <p className="mt-7 max-w-[36ch] text-[clamp(18px,1.35vw,23px)] font-[300] leading-[1.45]">
            {units.length > 0 ? `${units.length} residences` : 'New residences'}, designed and built
            by one team. Find your home at {title}. Get in touch for plans, prices and a viewing.
          </p>

          <dl className="mt-9 grid grid-cols-2 gap-x-8">
            <div>
              <dt className="text-[14px] text-[#111111]/70">Available residences</dt>
              <dd className="mt-3 font-mono text-[clamp(36px,3.3vw,60px)] leading-none tracking-[-0.04em]">
                {available.length}
                {units.length > 0 && (
                  <span className="ml-2 font-sans text-[16px] font-[300] tracking-normal">
                    of {units.length}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[14px] text-[#111111]/70">Construction complete</dt>
              <dd className="mt-3 font-mono text-[clamp(36px,3.3vw,60px)] leading-none tracking-[-0.04em]">
                {percent}
                <span className="ml-1 font-sans text-[0.5em] font-[300] tracking-normal">%</span>
              </dd>
              <div className="mt-4 h-1.5 bg-[#ecece8]" aria-hidden="true">
                <div className="h-full bg-threshold" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-5">
            <Link
              href={`${href}#register-interest`}
              className="inline-flex min-h-12 items-center justify-center gap-6 bg-threshold px-8 py-4 text-[13px] font-[600] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
            >
              <span className="button-label">Register interest</span>
              <span className="button-label" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link
              href={href}
              className="inline-flex min-h-12 items-center gap-3 text-[15px] underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
            >
              Explore the residences <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
