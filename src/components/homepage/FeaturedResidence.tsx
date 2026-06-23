'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';

import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import Button from '@/components/ui/Button';
import type { Project } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   FeaturedResidence — cinematic full-bleed spotlight on the active sales
   project (Almond). Three parallax depths give it dimension:

     · FAR  — the hero image drifts slowly behind everything.
     · NEAR — a framed detail plate (portrait) drifts the opposite way, faster.
     · TEXT — title clip-wipes in; eyebrow / facts / CTAs fade up on enter.

   "Register Interest" deep-links to the project's interest form
   (#register-interest anchor on the detail page).
   ─────────────────────────────────────────────────────────────────────────── */

interface FeaturedResidenceProps {
  project: Project;
}

export default function FeaturedResidence({ project }: FeaturedResidenceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgImgRef = useRef<HTMLImageElement>(null);
  const detailFrameRef = useRef<HTMLDivElement>(null);
  const detailImgRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  const href = `/en/projects/${project.slug.current}`;
  const detailId = project.homepagePortraitImageId || project.homepageGridImageId;
  const lead = project.homepageIntro || project.pullQuote || '';

  const availableUnits = project.units?.filter((u) => u.status === 'available').length ?? 0;
  const availabilityLabel =
    availableUnits > 0 ? `Now Selling · ${availableUnits} units available` : 'Now Selling';

  const facts: Array<[string, string]> = [
    ['Type', project.type.charAt(0).toUpperCase() + project.type.slice(1)],
    ['Location', project.location],
    [project.status === 'completed' ? 'Completed' : 'Delivery', String(project.year)],
  ];
  if (availableUnits > 0) facts.push(['Availability', `${availableUnits} units`]);

  useLayoutEffect(() => {
    gsapInit();
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (titleRef.current) titleRef.current.style.clipPath = 'none';
      if (detailFrameRef.current) detailFrameRef.current.style.clipPath = 'none';
      if (revealRef.current) {
        Array.from(revealRef.current.querySelectorAll<HTMLElement>('.fr-fade')).forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      }
      return;
    }

    const ctx = gsap.context(() => {
      // FAR — background drifts slowly down as the section scrolls past.
      if (bgImgRef.current) {
        gsap.fromTo(
          bgImgRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      // NEAR — detail plate drifts the opposite way, faster → depth separation.
      if (detailImgRef.current) {
        gsap.fromTo(
          detailImgRef.current,
          { yPercent: 12 },
          {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      // Detail frame clip-wipes in on enter.
      if (detailFrameRef.current) {
        gsap.fromTo(
          detailFrameRef.current,
          { clipPath: 'inset(0 0 100% 0)' },
          {
            clipPath: 'inset(0 0 0% 0)',
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 70%' },
          },
        );
      }

      // Title clip-wipes left→right.
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { clipPath: 'inset(0 100% 0 0)', y: '0.12em' },
          {
            clipPath: 'inset(0 0% 0 0)',
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 65%' },
          },
        );
      }

      // Eyebrow / facts / CTAs fade up, staggered.
      if (revealRef.current) {
        gsap.fromTo(
          revealRef.current.querySelectorAll('.fr-fade'),
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: { trigger: section, start: 'top 65%' },
          },
        );
      }

      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-void text-paper"
    >
      {/* ── FAR: background image ──────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={bgImgRef}
          src={cloudinaryUrl(project.heroImageId, { width: 2400 })}
          alt={project.title}
          className="absolute left-0 top-[-9%] h-[118%] w-full object-cover will-change-transform"
        />
        {/* Scrims — bottom-up + left for legibility over the content. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.78) 30%, rgba(13,13,13,0.35) 60%, rgba(13,13,13,0.15) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.2) 45%, transparent 70%)',
          }}
        />
      </div>

      {/* ── NEAR: framed detail plate (desktop) ────────────────────────────── */}
      {detailId && (
        <div
          ref={detailFrameRef}
          className="absolute right-10 top-1/2 z-10 hidden aspect-[3/4] w-[22vw] max-w-[360px] -translate-y-1/2 overflow-hidden rounded-sm shadow-2xl will-change-[clip-path] lg:block xl:right-16"
        >
          <img
            ref={detailImgRef}
            src={cloudinaryUrl(detailId, { width: 900 })}
            alt=""
            aria-hidden="true"
            className="absolute left-0 top-[-12%] h-[124%] w-full object-cover will-change-transform"
          />
        </div>
      )}

      {/* ── TEXT: content ──────────────────────────────────────────────────── */}
      {/* Mobile/tablet: everything centered. Desktop (lg+): cinematic bottom-left. */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20 md:px-10 md:py-24 lg:items-start lg:justify-end lg:px-14 lg:py-28 lg:text-left">
        <div ref={revealRef} className="max-w-3xl">
          {/* Eyebrow */}
          <div className="fr-fade mb-6 flex items-center justify-center lg:justify-start">
            <span
              className="font-mono text-mono uppercase tracking-[0.3em] text-white/85"
              style={{ textShadow: '0 1px 12px rgba(0,0,0,0.6)' }}
            >
              Featured Residence
            </span>
          </div>

          {/* Availability tag */}
          <span
            className="fr-fade mb-6 inline-flex items-center border px-4 py-1.5 font-mono text-mono uppercase tracking-[0.2em] backdrop-blur-sm"
            style={{
              borderColor: 'rgba(102,151,159,0.55)',
              backgroundColor: 'rgba(13,13,13,0.55)',
              color: 'var(--color-threshold)',
            }}
          >
            {availabilityLabel}
          </span>

          {/* Title */}
          <h2
            ref={titleRef}
            className="font-sans font-[300] leading-[0.92] text-paper"
            style={{ fontSize: 'clamp(56px, 9vw, 150px)', letterSpacing: '0.01em' }}
          >
            {project.title}
          </h2>

          {/* Lead line */}
          {lead && (
            <p className="fr-fade mx-auto mt-6 max-w-xl text-body-lg text-white/75 lg:mx-0">{lead}</p>
          )}

          {/* Facts */}
          <dl className="fr-fade mt-10 flex flex-wrap justify-center gap-x-12 gap-y-5 lg:justify-start">
            {facts.map(([label, value]) => (
              <div key={label} className="flex flex-col items-center gap-1 lg:items-start">
                <dt className="font-mono text-mono uppercase tracking-[0.2em] text-stone">
                  {label}
                </dt>
                <dd className="text-body-lg font-[300] text-paper">{value}</dd>
              </div>
            ))}
          </dl>

          {/* CTAs */}
          <div className="fr-fade mt-12 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
            <Button href={`${href}#register-interest`} variant="primary" size="lg" magnetic>
              Register Interest
            </Button>
            <Link
              href={href}
              data-cursor="view"
              className="group inline-flex items-center gap-3 text-label uppercase tracking-[0.25em] text-paper transition-colors duration-300 hover:text-white/60"
            >
              View Residence
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
