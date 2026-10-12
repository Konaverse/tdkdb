import Link from 'next/link';

import RevealFrame from '@/components/animations/RevealFrame';
import { displayTitle, projectHref } from '@/lib/projects/display';
import { imageSrcSet, imageUrl } from '@/lib/sanity/image';
import type { Project } from '@/lib/sanity/types';
import styles from './FeaturedProject.module.css';

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
      className={`px-page text-[#111111] ${styles.section}`}
      style={{ background: '#ffffff', fontFamily: 'var(--font-josefin)' }}
    >
      <div className="gap-x-gutter grid items-center gap-y-5 lg:grid-cols-12">
        <RevealFrame className={`${styles.frame} lg:col-span-7`} nav="dark">
          <Link href={href} prefetch aria-label={`Explore ${title}`} className={styles.imageLink}>
            <img
              src={imageUrl(image, { width: 1600 })}
              srcSet={imageSrcSet(image, [600, 900, 1200, 1600, 2000])}
              sizes="(min-width: 1024px) 56vw, 96vw"
              alt={`${title}, ${project.location}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div data-featured-overlay className={styles.overlay}>
              <dl className={styles.stat}>
                <dt className={styles.statLabel}>Available residences</dt>
                <dd className={styles.statValue}>
                  {available.length}
                  {units.length > 0 && <span className={styles.statSuffix}>of {units.length}</span>}
                </dd>
              </dl>

              <p className={styles.selling}>Now selling in {town}</p>

              <dl className={`${styles.stat} ${styles.progress}`}>
                <dt className={styles.statLabel}>Construction complete</dt>
                <dd className={styles.statValue}>
                  {percent}
                  <span className={styles.percent}>%</span>
                  <div className={styles.track} aria-hidden="true">
                    <div className={styles.fill} style={{ width: `${percent}%` }} />
                  </div>
                </dd>
              </dl>
            </div>
          </Link>
        </RevealFrame>

        <div className="lg:col-span-5 lg:pl-[2vw]">
          <h2
            id="featured-project-heading"
            className="text-[clamp(36px,8vw,52px)] font-[300] leading-[0.94] tracking-[-0.02em] lg:max-w-[9ch] lg:text-[clamp(52px,5.6vw,100px)]"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-[36ch] text-[16px] font-[300] leading-[1.45] lg:mt-7 lg:text-[clamp(18px,1.35vw,23px)]">
            <span className="lg:hidden">
              {units.length > 0 ? `${units.length} residences` : 'New residences'}, designed and
              built by one team.
            </span>
            <span className="hidden lg:inline">
              {units.length > 0 ? `${units.length} residences` : 'New residences'}, designed and
              built by one team. Find your home at {title}. Get in touch for plans, prices and a
              viewing.
            </span>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 lg:mt-10 lg:gap-y-5">
            <Link
              href={`${href}#register-interest`}
              prefetch
              className="inline-flex min-h-12 w-full items-center justify-center gap-6 bg-threshold px-8 py-4 text-[13px] font-[600] uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] sm:w-auto"
            >
              <span className="button-label">Register interest</span>
              <span className="button-label" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link
              href={href}
              prefetch
              className="inline-flex min-h-10 items-center gap-3 text-[15px] underline decoration-[#111111]/30 underline-offset-4 transition-colors duration-300 hover:text-threshold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111] lg:min-h-12"
            >
              Explore the residences <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
