'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { gsap } from '@/lib/animations/gsap';

const DISPLAY_EMAIL = 'info@tdkdb.com';

const EXPLORE_LINKS = [
  { label: 'Home', path: '' },
  { label: 'About', path: 'about' },
  { label: 'Services', path: 'services' },
  { label: 'Projects', path: 'projects' },
  { label: 'Insights', path: 'insights' },
  { label: 'Contact', path: 'contact' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Facebook', href: '#' },
];

export default function FooterClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const footerRef = useRef<HTMLElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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
    <footer ref={footerRef} className="relative overflow-hidden border-t border-border bg-void">
      <div className="mx-auto max-w-content px-8">
        {/* ── Main grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-12 py-section lg:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-6">
            <Link
              href={`/${locale}`}
              className="text-display-md font-light tracking-[0.05em] text-paper"
            >
              TDK
            </Link>
            <p className="text-label text-stone">Design. Build. Last.</p>
            <address className="flex flex-col gap-2 not-italic">
              <p className="text-body text-stone">
                28th October 12
                <br />
                Limassol 3107, Cyprus
              </p>
              <a
                href={`mailto:${DISPLAY_EMAIL}`}
                className="text-body text-stone transition-colors duration-fast ease-smooth hover:text-paper"
              >
                {DISPLAY_EMAIL}
              </a>
              <p className="text-body text-stone">+357 — — — —</p>
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
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-body text-stone transition-colors duration-fast ease-smooth hover:text-paper"
                >
                  {label}
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
            © 2025 TDK Design &amp; Build. All rights reserved.
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
