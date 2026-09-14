'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import { gsap } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { cn } from '@/lib/utils/cn';
import { useIntro } from '@/components/homepage/IntroProvider';
import type { SiteSettings } from '@/lib/sanity/types';

const NAV_LINKS = [
  { label: 'About', path: 'about' },
  { label: 'Projects', path: 'projects' },
];

interface Props {
  settings: SiteSettings | null;
}

export default function NavbarClient({ settings }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const companyName = settings?.companyName || 'TDK';

  const { phase } = useIntro();

  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const headerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mobileLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const navFirstRunRef = useRef(true);

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Intro-gated entrance ──────────────────────────────────────────────────
  // Hidden through the homepage loader; fades in ~0.9s into the reveal (just
  // before the lamp finishes). On interior pages / client nav it's instant.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    if (phase === 'loading') {
      gsap.set(header, { autoAlpha: 0, y: -12 });
      navFirstRunRef.current = false;
      return;
    }

    if (navFirstRunRef.current && phase === 'done') {
      gsap.set(header, { autoAlpha: 1, y: 0 });
      navFirstRunRef.current = false;
      return;
    }

    gsap.to(header, {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      delay: phase === 'reveal' ? 0.9 : 0,
      ease: 'power3.out',
    });
    navFirstRunRef.current = false;
  }, [phase]);

  // ── Close menu on route change ────────────────────────────────────────────
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // ── Close menu on Escape ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  // ── GSAP mobile menu timeline setup ──────────────────────────────────────
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const links = mobileLinkRefs.current.filter((el): el is HTMLAnchorElement => el !== null);

      // Place overlay off-screen before first paint
      gsap.set(overlayRef.current, { xPercent: 100 });
      gsap.set(links, { opacity: 0, y: 30 });

      timelineRef.current = gsap
        .timeline({ paused: true })
        .to(overlayRef.current, {
          xPercent: 0,
          duration: 0.5,
          ease: 'power3.out',
        })
        .to(
          links,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: 'power3.out',
          },
          '-=0.25',
        );
    });

    return () => ctx.revert();
  }, []);

  // ── Play / reverse on open state change ───────────────────────────────────
  useEffect(() => {
    const tl = timelineRef.current;
    if (!tl) return;

    if (isMenuOpen) {
      tl.play();
      getLenis()?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      if (tl.progress() > 0) tl.reverse();
      getLenis()?.start();
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  const isHomepage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isActive = (path: string) => pathname.includes(`/${path}`);

  return (
    <>
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header
        ref={headerRef}
        className={cn(
          'fixed left-0 top-0 z-[100] w-full',
          'transition-[background-color,border-color,backdrop-filter] duration-fast ease-smooth',
          isScrolled && !isHomepage ? 'border-b border-border' : 'border-b border-transparent',
        )}
        style={{
          backgroundColor: isScrolled && !isHomepage ? 'rgba(13, 13, 13, 0.85)' : 'transparent',
          backdropFilter: isScrolled && !isHomepage ? 'blur(20px)' : undefined,
          mixBlendMode: 'difference',
        }}
      >
        <nav className="mx-auto flex h-20 max-w-content items-center justify-between px-8">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="https://res.cloudinary.com/konaverse/image/upload/v1772055539/clients/tdkdb/general/logo-dark.svg"
              alt={companyName}
              width={140}
              height={36}
              className="h-24 w-auto object-contain brightness-0 invert"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-10 lg:flex">
            {NAV_LINKS.map(({ label, path }) => {
              const active = isActive(path);
              return (
                <li key={path}>
                  <Link
                    href={`/${locale}/${path}`}
                    className="group relative flex flex-col pb-1 text-label text-paper"
                  >
                    {label}
                    {/* Animated underline — scales from left on hover, stays visible when active */}
                    <span
                      className={cn(
                        'absolute bottom-0 left-0 h-px w-full origin-left bg-paper',
                        'transition-transform duration-fast ease-smooth',
                        'group-hover:scale-x-100',
                        active ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right: Contact + language switcher + hamburger */}
          <div className="flex items-center gap-6">
            {/* Contact ghost button — desktop only */}
            <Link
              href={`/${locale}/contact`}
              className={cn(
                'hidden lg:block',
                'border border-paper px-5 py-2.5 text-label text-paper',
                'transition-colors duration-fast ease-smooth',
                'hover:bg-paper hover:text-void',
              )}
            >
              Contact
            </Link>

            {/* Language switcher */}
            <div className="flex items-center gap-1.5 text-label">
              <span className="text-paper">EN</span>
              <span className="text-stone opacity-60">|</span>
              <span className="cursor-not-allowed text-stone opacity-40" title="Greek coming soon">
                EL
              </span>
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col gap-[5px] lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="h-px w-6 bg-paper" />
              <span className="h-px w-6 bg-paper" />
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu overlay ─────────────────────────────────────────────── */}
      <div
        ref={overlayRef}
        className={cn(
          // `translate-x-full` keeps the overlay off-screen before GSAP hydrates,
          // so it never flashes open on first paint. GSAP's inline transform takes
          // over once mounted.
          'fixed inset-0 z-[200] flex translate-x-full flex-col items-center justify-center bg-void',
          !isMenuOpen && 'pointer-events-none',
        )}
        aria-hidden={!isMenuOpen}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(false)}
          className="absolute right-8 top-6 text-[2rem] leading-none text-paper"
          aria-label="Close navigation menu"
        >
          ×
        </button>

        {/* Mobile nav links — staggered by GSAP */}
        <ul className="flex flex-col items-center gap-8">
          {NAV_LINKS.map(({ label, path }, i) => (
            <li key={path}>
              <Link
                ref={(el) => {
                  mobileLinkRefs.current[i] = el;
                }}
                href={`/${locale}/${path}`}
                className="text-display-md text-paper"
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
