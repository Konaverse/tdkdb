'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';

import { gsap } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import { useIntro } from '@/components/homepage/IntroProvider';
import SocialGlyph from '@/components/ui/SocialGlyph';
import type { SiteSettings } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   Navbar — logo, and a small cluster: Contact | EN · EL | burger

   THE BAR
   Transparent, and only ever pure black or pure white. A difference blend was
   tried first and dropped: over a photograph it inverts the colours (the
   blue hero sky turned the marks orange). Instead each homepage section, and
   each dark region inside one, declares data-nav="light" | "dark"; the logo
   and the right-hand cluster each read what lies under them a few times a
   second and switch, independently, via --nav-ink / --nav-ground. The
   Contact button is filled with the ink: black with white type on light
   ground, white with black type on dark.
   Side margins follow the hero: 2vw left (the socials and paragraphs), 1.35vw
   right (the right-hand paragraph); the logo file carries 15.5% of empty
   space on its left, taken back with a negative margin. Thin hairlines
   separate the three controls on the right.

   THE MENU
   A compact white panel pinned to the top-right corner. That corner is
   locked: the clip-path unfolds from it, down and to the left, while the two
   burger lines turn into an X. The panel sits under
   the bar in z-order, so the X stays on top of it; Contact and the language
   switcher step back while it is open.

   Inside, everything arrives by the side reveal (a line sliding sideways into
   its own mask, as in the hero): the pages first, large, then a hairline
   draws, then the contact details and socials. Closing plays the same
   timeline backwards, faster.

   One timeline, built once. The page you are on is set in teal; the others
   are ink and take the teal on hover.

   A11y: the burger is a real toggle (aria-expanded, aria-controls); the panel
   is a dialog; Escape, a click outside and navigation all close it; focus
   goes to the first link on open and back to the burger on close. Lenis is
   stopped while it is open.
   ─────────────────────────────────────────────────────────────────────────── */

const LOGO =
  'https://res.cloudinary.com/konaverse/image/upload/v1772055539/clients/tdkdb/general/logo-dark.svg';

const PAGES = [
  { label: 'Home', path: '' },
  { label: 'About', path: 'about' },
  { label: 'Projects', path: 'projects' },
  { label: 'Contact', path: 'contact' },
];

/* The menu is white, always: ink type, hairlines, one teal page. */
const INK = '#111111';
const INK_SOFT = 'rgba(17, 17, 17, 0.72)';
const INK_FAINT = 'rgba(17, 17, 17, 0.48)';
const HAIRLINE = 'rgba(17, 17, 17, 0.12)';
const TEAL = 'var(--color-threshold, #66979f)';

type Theme = 'light' | 'dark';

/** The bar's two states: marks in pure black on light ground, pure white on
    dark. --nav-ground is the opposite colour, for the filled button's type. */
const DARK_VARS = {
  '--nav-ink': '#ffffff',
  '--nav-ground': '#000000',
  '--nav-logo': 'brightness(0) invert(1)',
} as React.CSSProperties;
const LIGHT_VARS = {
  '--nav-ink': '#000000',
  '--nav-ground': '#ffffff',
  '--nav-logo': 'brightness(0)',
} as React.CSSProperties;

interface Props {
  settings: SiteSettings | null;
}

/** A line that slides sideways into its own mask. */
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <span data-reveal className="block will-change-transform">
        {children}
      </span>
    </span>
  );
}

export default function NavbarClient({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const { phase } = useIntro();

  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const href = (path: string) => (path ? `/${locale}/${path}` : `/${locale}`);
  const isCurrent = (path: string) =>
    path
      ? pathname.startsWith(`/${locale}/${path}`)
      : pathname === `/${locale}` || pathname === `/${locale}/`;

  const headerRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const navFirstRunRef = useRef(true);
  const wasOpenRef = useRef(false);
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);

  const email = settings?.email;
  const phone = settings?.phone;
  const address = (settings?.address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const socials = settings?.socialLinks ?? [];

  /* ── intro-gated entrance of the bar (unchanged behaviour) ── */
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

  /* ── the menu timeline, built once ── */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const burger = burgerRef.current;
    const header = headerRef.current;
    if (!panel || !burger || !header) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(panel);
      const lineTop = burger.querySelector('[data-line="top"]');
      const lineBottom = burger.querySelector('[data-line="bottom"]');
      const stepBack = header.querySelectorAll('[data-step-back]');
      const reveals = q('[data-reveal]');
      const rules = q('[data-rule]');
      const pageReveals = q('[data-page] [data-reveal]');
      const detailReveals = reveals.filter((el) => !pageReveals.includes(el));

      gsap.set(panel, { autoAlpha: 0 });
      gsap.set(reveals, { xPercent: -104, x: 0 });
      gsap.set(rules, { scaleX: 0 });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: 'power3.inOut' },
        onReverseComplete: () => {
          gsap.set(panel, { autoAlpha: 0 });
        },
      });

      tl.set(panel, { autoAlpha: 1 }, 0);

      // The top-right corner stays put; the panel unfolds from it, down and
      // to the left.
      tl.fromTo(
        panel,
        { clipPath: 'inset(0% 0% 100% 100%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: reduced ? 0.01 : 0.85 },
        0,
      );

      // Burger to X.
      tl.to(lineTop, { y: 3, rotation: 45, duration: 0.55 }, 0);
      tl.to(lineBottom, { y: -3, rotation: -45, duration: 0.55 }, 0);
      tl.to(stepBack, { autoAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0);

      // The side reveal.
      tl.to(
        pageReveals,
        { xPercent: 0, x: 0, duration: 0.95, ease: 'power4.out', stagger: 0.07 },
        0.32,
      );
      tl.to(rules, { scaleX: 1, duration: 0.8, stagger: 0.1 }, 0.5);
      tl.to(
        detailReveals,
        { xPercent: 0, x: 0, duration: 0.85, ease: 'power4.out', stagger: 0.035 },
        0.58,
      );

      tlRef.current = tl;
    }, panel);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
  }, []);

  /* ── open / close ── */
  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;

    if (open) {
      tl.timeScale(1).play();
      getLenis()?.stop();
      wasOpenRef.current = true;
      const t = setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), 350);
      return () => clearTimeout(t);
    }

    if (wasOpenRef.current) {
      tl.timeScale(1.7).reverse();
      getLenis()?.start();
      burgerRef.current?.focus({ preventScroll: true });
      wasOpenRef.current = false;
    }
  }, [open]);

  /* ── black or white, from what is underneath ──
     Each homepage section declares data-nav="light" | "dark", and so does any
     dark region inside a light section (the interlude's render, the contact
     photograph). A few times a second the logo and the right-hand cluster
     each look straight down: the last declared element in document order
     whose box contains their point wins, so nested regions beat their
     section. Anything undeclared (the interior pages) counts as dark. While
     the menu is open the cluster sits on the white panel, so it is black. */
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const themeAt = (x: number, y: number): Theme => {
      let theme: Theme = 'dark';
      document.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          theme = el.dataset.nav === 'light' ? 'light' : 'dark';
        }
      });
      return theme;
    };

    const apply = (el: HTMLElement, theme: Theme) => {
      if (el.dataset.theme === theme) return;
      el.dataset.theme = theme;
      const vars = theme === 'light' ? LIGHT_VARS : DARK_VARS;
      Object.entries(vars as Record<string, string>).forEach(([k, v]) =>
        el.style.setProperty(k, v),
      );
    };

    let frame = 0;
    const tick = () => {
      if (++frame % 4) return;
      const l = left.getBoundingClientRect();
      const r = right.getBoundingClientRect();
      const y = l.top + l.height / 2;
      apply(left, themeAt(l.left + l.width / 2, y));
      apply(right, openRef.current ? 'light' : themeAt(r.left + r.width / 2, y));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* ── close on navigation ── */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ── close on Escape ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const underline =
    'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-smooth hover:bg-[length:100%_1px]';

  return (
    <>
      {/* ── The bar ── */}
      <header
        ref={headerRef}
        data-site-header
        className="pointer-events-none fixed left-0 top-0 z-[100] w-full"
      >
        <nav className="flex h-20 items-center justify-between pl-[max(16px,2vw)] pr-[max(16px,1.35vw)]">
          <Link
            ref={leftRef}
            href={href('')}
            className="pointer-events-auto flex items-center"
            style={DARK_VARS}
          >
            <Image
              src={LOGO}
              alt="TDK Design & Build"
              width={140}
              height={36}
              className="-ml-[12.5px] h-24 w-auto object-contain transition-[filter] duration-300"
              style={{ filter: 'var(--nav-logo)' }}
              priority
            />
          </Link>

          <div
            ref={rightRef}
            className="pointer-events-auto flex items-center gap-4 sm:gap-6"
            style={DARK_VARS}
          >
            <Link
              data-step-back
              href={href('contact')}
              className="hidden border px-5 py-2.5 text-label transition-colors duration-300 hover:!bg-transparent hover:!text-[color:var(--nav-ink)] sm:block"
              style={{
                background: 'var(--nav-ink)',
                borderColor: 'var(--nav-ink)',
                color: 'var(--nav-ground)',
              }}
            >
              Contact
            </Link>

            <span
              data-step-back
              aria-hidden="true"
              className="hidden h-4 w-px transition-colors duration-300 sm:block"
              style={{ background: 'var(--nav-ink)' }}
            />

            <div
              data-step-back
              className="flex items-center gap-3 text-label transition-colors duration-300"
              style={{ color: 'var(--nav-ink)' }}
            >
              <span className="border-b border-current pb-px">EN</span>
              <span className="cursor-not-allowed" title="Greek coming soon">
                EL
              </span>
            </div>

            <span
              data-step-back
              aria-hidden="true"
              className="h-4 w-px transition-colors duration-300"
              style={{ background: 'var(--nav-ink)' }}
            />

            <button
              ref={burgerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="site-menu"
              className="relative -mr-1.5 flex h-10 w-10 cursor-pointer items-center justify-center"
            >
              <span className="relative block h-[7px] w-7">
                <span
                  data-line="top"
                  className="absolute left-0 top-0 block h-px w-full transition-colors duration-300"
                  style={{ background: 'var(--nav-ink)' }}
                />
                <span
                  data-line="bottom"
                  className="absolute bottom-0 left-0 block h-px w-full transition-colors duration-300"
                  style={{ background: 'var(--nav-ink)' }}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Click-away catcher, only while open. */}
      {open && (
        <div aria-hidden="true" className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
      )}

      {/* ── The menu ── */}
      <div
        ref={panelRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className="invisible fixed right-2 top-2 z-[90] w-[min(460px,calc(100vw-16px))] sm:right-3 sm:top-3"
        style={{ color: INK, fontFamily: 'var(--font-josefin)' }}
      >
        {/* White, always. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: '#ffffff', boxShadow: `inset 0 0 0 1px ${HAIRLINE}` }}
        />

        <div className="relative px-7 pb-7 pt-24 sm:px-9 sm:pb-9">
          {/* Pages */}
          <nav aria-label="Pages">
            <ul className="flex flex-col gap-1">
              {PAGES.map((p, i) => {
                const current = isCurrent(p.path);
                return (
                  <li key={p.label} data-page>
                    <Reveal className="pb-[0.1em]">
                      <Link
                        ref={i === 0 ? firstLinkRef : undefined}
                        href={href(p.path)}
                        onClick={() => setOpen(false)}
                        aria-current={current ? 'page' : undefined}
                        className={`inline-block text-[clamp(34px,4.2vw,46px)] font-[300] leading-[1.12] transition-colors duration-300 ${
                          current ? '' : 'hover:text-threshold'
                        }`}
                        // The page you are on is the one in teal.
                        style={current ? { color: TEAL } : undefined}
                      >
                        <span className={current ? '' : underline}>{p.label}</span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </nav>

          <span
            data-rule
            aria-hidden="true"
            className="mt-8 block h-px w-full origin-left"
            style={{ background: HAIRLINE }}
          />

          {/* Contact details */}
          <div className="mt-7 grid grid-cols-2 gap-6 text-[14px] font-[300] leading-[1.6]">
            <div>
              <p
                className="mb-3 text-[10px] font-[600] uppercase tracking-[0.24em]"
                style={{ color: INK_FAINT }}
              >
                <Reveal>Get in touch</Reveal>
              </p>
              {email && (
                <Reveal>
                  <a href={`mailto:${email}`} className={underline}>
                    {email}
                  </a>
                </Reveal>
              )}
              {phone && (
                <Reveal>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className={underline}
                    style={{ color: INK_SOFT }}
                  >
                    {phone}
                  </a>
                </Reveal>
              )}
            </div>

            {address.length > 0 && (
              <div>
                <p
                  className="mb-3 text-[10px] font-[600] uppercase tracking-[0.24em]"
                  style={{ color: INK_FAINT }}
                >
                  <Reveal>Studio</Reveal>
                </p>
                <address className="not-italic" style={{ color: INK_SOFT }}>
                  {address.map((line) => (
                    <Reveal key={line}>{line}</Reveal>
                  ))}
                </address>
              </div>
            )}
          </div>

          {socials.length > 0 && (
            <>
              <span
                data-rule
                aria-hidden="true"
                className="mt-7 block h-px w-full origin-left"
                style={{ background: HAIRLINE }}
              />
              <ul className="mt-6 flex gap-3">
                {socials.map((s) => (
                  <li key={s.url}>
                    <Reveal>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.platform}
                        className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[#111111] hover:text-white"
                        style={{ borderColor: 'rgba(17,17,17,0.3)' }}
                      >
                        <span className="block h-4 w-4">
                          <SocialGlyph platform={s.platform} />
                        </span>
                      </a>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
