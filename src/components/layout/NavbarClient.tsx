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
   Transparent, mix-blend-mode: difference, so the paper-white marks read
   black on the white sections and white on the renders without any scroll
   logic. Thin hairlines separate the three controls on the right.

   THE MENU
   A compact dark-glass panel pinned to the top-right corner. It opens FROM
   the burger: its clip-path starts as the icon's own box and grows out to
   the panel, while the two burger lines turn into an X. The panel sits under
   the bar in z-order, so the X stays on top of it; Contact and the language
   switcher step back while it is open.

   Inside, everything arrives by the side reveal (a line sliding sideways into
   its own mask, as in the hero): the pages first, large, then a hairline
   draws, then the contact details and socials. Closing plays the same
   timeline backwards, faster.

   One timeline, built once. It is invalidated before each fresh open so the
   icon-sized starting clip is measured at that moment.

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

const PAPER = '#f4f2ee';
const PAPER_SOFT = 'rgba(244, 242, 238, 0.74)';
const PAPER_FAINT = 'rgba(244, 242, 238, 0.5)';
const HAIRLINE = 'rgba(244, 242, 238, 0.16)';
const TEAL = 'var(--color-threshold, #66979f)';

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

      /** The burger's box, as an inset of the panel. */
      const iconInset = () => {
        const p = panel.getBoundingClientRect();
        const b = burger.getBoundingClientRect();
        const pad = 6;
        const t = Math.max(0, b.top - p.top - pad);
        const r = Math.max(0, p.right - b.right - pad);
        const btm = Math.max(0, p.bottom - b.bottom - pad);
        const l = Math.max(0, b.left - p.left - pad);
        return `inset(${t}px ${r}px ${btm}px ${l}px)`;
      };

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

      // The panel grows out of the icon.
      tl.fromTo(
        panel,
        { clipPath: iconInset },
        { clipPath: 'inset(0px 0px 0px 0px)', duration: reduced ? 0.01 : 0.8 },
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
      // A fresh open re-measures the icon-sized starting clip.
      if (tl.progress() === 0) tl.invalidate();
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
        className="pointer-events-none fixed left-0 top-0 z-[100] w-full"
        style={{ mixBlendMode: 'difference' }}
      >
        <nav className="mx-auto flex h-20 max-w-content items-center justify-between px-5 sm:px-8">
          <Link href={href('')} className="pointer-events-auto flex items-center">
            <Image
              src={LOGO}
              alt="TDK Design & Build"
              width={140}
              height={36}
              className="h-24 w-auto object-contain brightness-0 invert"
              priority
            />
          </Link>

          <div className="pointer-events-auto flex items-center gap-4 sm:gap-6">
            <Link
              data-step-back
              href={href('contact')}
              className="hidden border border-paper px-5 py-2.5 text-label text-paper transition-colors duration-fast ease-smooth hover:bg-paper hover:text-void sm:block"
            >
              Contact
            </Link>

            <span
              data-step-back
              aria-hidden="true"
              className="hidden h-5 w-px sm:block"
              style={{ background: 'rgba(245, 240, 232, 0.45)' }}
            />

            <div data-step-back className="flex items-center gap-1.5 text-label">
              <span className="text-paper">EN</span>
              <span className="text-paper opacity-40">|</span>
              <span className="cursor-not-allowed text-paper opacity-40" title="Greek coming soon">
                EL
              </span>
            </div>

            <span
              data-step-back
              aria-hidden="true"
              className="h-5 w-px"
              style={{ background: 'rgba(245, 240, 232, 0.45)' }}
            />

            <button
              ref={burgerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="site-menu"
              className="relative -mr-2 flex h-10 w-10 cursor-pointer items-center justify-center"
            >
              <span className="relative block h-[7px] w-7">
                <span
                  data-line="top"
                  className="absolute left-0 top-0 block h-px w-full bg-paper"
                />
                <span
                  data-line="bottom"
                  className="absolute bottom-0 left-0 block h-px w-full bg-paper"
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
        style={{ color: PAPER, fontFamily: 'var(--font-josefin)' }}
      >
        {/* Dark glass */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(34, 34, 34, 0.94) 0%, rgba(12, 12, 12, 0.96) 55%, rgba(8, 8, 8, 0.97) 100%)',
            backdropFilter: 'blur(24px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
            boxShadow: `inset 0 0 0 1px ${HAIRLINE}, inset 0 1px 0 rgba(255,255,255,0.14)`,
          }}
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
                        className="group inline-flex items-center gap-4 text-[clamp(34px,4.2vw,46px)] font-[300] leading-[1.12]"
                      >
                        <span className={underline}>{p.label}</span>
                        {current && (
                          <span
                            aria-hidden="true"
                            className="block h-px w-8"
                            style={{ background: TEAL }}
                          />
                        )}
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
                style={{ color: PAPER_FAINT }}
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
                    style={{ color: PAPER_SOFT }}
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
                  style={{ color: PAPER_FAINT }}
                >
                  <Reveal>Studio</Reveal>
                </p>
                <address className="not-italic" style={{ color: PAPER_SOFT }}>
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
                        className="flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[#f4f2ee] hover:text-[#111111]"
                        style={{ borderColor: 'rgba(244,242,238,0.34)' }}
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
