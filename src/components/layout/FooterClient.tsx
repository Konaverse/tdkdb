'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import type { SiteSettings } from '@/lib/sanity/types';

const EXPLORE_LINKS = [
  { label: 'Home', path: '' },
  { label: 'About', path: 'about' },
  { label: 'Services', path: 'services' },
  { label: 'Projects', path: 'projects' },
  { label: 'Insights', path: 'insights' },
  { label: 'Contact', path: 'contact' },
];

interface Props {
  settings: SiteSettings | null;
}

export default function FooterClient({ settings }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const footerRef = useRef<HTMLElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const ctx = gsap.context(() => {
      gsap.set(curtainRef.current, { yPercent: 0 });

      gsap.to(curtainRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power3.inOut',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const hrefFor = (path: string) => (path === '' ? `/${locale}` : `/${locale}/${path}`);

  return (
    <footer
      ref={footerRef}
      className="relative z-[60] overflow-hidden border-t border-border bg-void"
    >
      <div className="mx-auto max-w-content px-8">
        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 py-section lg:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-6">
            <Link
              href={`/${locale}`}
              className="text-display-md font-light tracking-[0.05em] text-paper"
            >
              {settings?.companyName || 'TDK'}
            </Link>
            <p className="text-label text-stone">{settings?.tagline || 'Design. Build. Last.'}</p>
            <address className="flex flex-col gap-2 not-italic">
              <p className="whitespace-pre-line text-body text-stone">
                {settings?.address || 'Limassol, Cyprus'}
              </p>
              <a
                href={`mailto:${settings?.email || 'info@tdkdb.com'}`}
                className="text-body text-stone transition-colors duration-fast ease-smooth hover:text-paper"
              >
                {settings?.email || 'info@tdkdb.com'}
              </a>
              <p className="text-body text-stone">{settings?.phone || ''}</p>
            </address>
          </div>

          {/* Col 2 — Explore */}
          <div className="flex flex-col gap-6">
            <p className="text-label text-stone">Explore</p>
            <nav className="flex flex-col gap-3">
              {EXPLORE_LINKS.map(({ label, path }) => (
                <Link
                  key={label}
                  href={hrefFor(path)}
                  className="text-body text-stone transition-colors duration-fast ease-smooth hover:text-paper"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3 — Connect */}
          <div className="flex flex-col gap-6">
            <p className="text-label text-stone">Connect</p>
            <nav className="flex flex-col gap-3">
              {(settings?.socialLinks || []).map(({ platform, url }) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-body text-stone transition-colors duration-fast ease-smooth hover:text-paper"
                >
                  {platform}
                  <span className="inline-block transition-transform duration-fast ease-smooth group-hover:translate-x-1">
                    →
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-border py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-label text-stone">
            © {new Date().getFullYear()} {settings?.companyName || 'TDK'}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-label text-stone">
            <Link
              href={`/${locale}/privacy`}
              className="transition-colors duration-fast ease-smooth hover:text-paper"
            >
              Privacy Policy
            </Link>
            <span className="opacity-40">·</span>
            <Link
              href={`/${locale}/terms`}
              className="transition-colors duration-fast ease-smooth hover:text-paper"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* ── Curtain — rendered last so it sits on top ─────────────────────── */}
      <div ref={curtainRef} className="pointer-events-none absolute inset-0 bg-surface" />
    </footer>
  );
}
