'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import SocialGlyph from '@/components/ui/SocialGlyph';
import type { SiteSettings } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   Footer — the room behind the page

   From the Sept 2026 board "footer.png", taken apart and rebuilt: a dimmed
   living-room render full bleed; "Stay in contact" top left; a frosted glass
   panel holding the index, the studio, the socials, the email and the legal
   line; and a giant wordmark at the foot — "TDK DESIGN" on one line, cut
   through its lower half, "& BUILD" stepped down and right.

   THE ASYMMETRY
   One vertical line organises everything: the glass panel's left edge
   (47vw). "& BUILD" starts on it, the panel stands on it to the right, low, and
   "Stay in contact" owns the field to its left. "TDK DESIGN" crosses that
   line from the left margin, and the panel's foot overlaps the top of it.

   THE REVEAL — the page lifts off the footer
   The footer keeps its place in the flow, so nothing about page height or
   pinning changes. Its contents ([data-drift]) start pulled 42% up behind
   the footer's own top edge and settle to 0 as the footer scrolls in: the
   section above leaves at full scroll speed while the room underneath moves
   at a little over half of it, uncovered rather than scrolled. A shadow
   ([data-veil]) lifts off the room as it is uncovered.

   WINDOWS, NOT FILTERS
   The wordmark letters and the glass panel are painted with copies of the
   render, aligned pixel for pixel with the backdrop (paint() computes each
   element's offset inside the drift box and positions a cover-sized
   background to match):
   · the letters use a brightened copy, clipped to the glyphs, so the words
     read as windows into a lit room;
   · the panel uses a heavily pre-blurred copy (Cloudinary e_blur), so it is
     frosted glass with no backdrop-filter — which would re-blur on every
     frame of the reveal.

   MOTION
   · Scroll (scrubbed): drift y and veil opacity only.
   · Once, as the footer is mostly uncovered: "Stay in contact" words slide
     sideways into their masks; a hairline draws along the panel's top edge
     as the glass fades up and its lines slide in; "TDK DESIGN" travels in from the left and "& BUILD"
     from the right, crossing on the panel's line.

   LAYERS — one node, one property
     [data-drift]      y            scrub
     [data-veil]       opacity      scrub
     [data-word]       xPercent     entrance
     [data-panel]      opacity      entrance (composited: a clip-path wipe
                                    re-rasterised the frosted image every frame)
     [data-panel-rule] scaleX       entrance
     [data-slide]      xPercent     entrance
     [data-wm-line]    xPercent     entrance (its background moves with it
                                    and lands aligned)
   ─────────────────────────────────────────────────────────────────────────── */

const IMAGE_ID = 'clients/tdkdb/armonia/interior/2';
/** Natural aspect of the render (2400 × 1350). */
const IMAGE_ASPECT = 16 / 9;

const BACKDROP = cloudinaryUrl(IMAGE_ID, { width: 2400 });
const LIT = cloudinaryUrl(IMAGE_ID, { width: 2400, effects: ['e_brightness:60'] });
const FROSTED = cloudinaryUrl(IMAGE_ID, { width: 1200, quality: 60, effects: ['e_blur:1400'] });

const PAPER = '#f4f2ee';
const PAPER_SOFT = 'rgba(244, 242, 238, 0.78)';
const PAPER_FAINT = 'rgba(244, 242, 238, 0.55)';
const HAIRLINE = 'rgba(244, 242, 238, 0.16)';

const INDEX = [
  { label: 'Home', path: '' },
  { label: 'About', path: 'about' },
  { label: 'Projects', path: 'projects' },
  { label: 'Contact', path: 'contact' },
];

interface Props {
  settings: SiteSettings | null;
}

export default function FooterClient({ settings }: Props) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const href = (path: string) => (path ? `/${locale}/${path}` : `/${locale}`);

  const footerRef = useRef<HTMLElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);

  const email = settings?.email;
  const phone = settings?.phone;
  const address = (settings?.address ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const socials = settings?.socialLinks ?? [];

  /* ── windows: align every painted copy with the backdrop ── */
  useLayoutEffect(() => {
    const box = driftRef.current;
    if (!box) return;

    const paint = () => {
      const W = box.clientWidth;
      const H = box.clientHeight;
      if (!W || !H) return;
      const bw = W / H > IMAGE_ASPECT ? W : H * IMAGE_ASPECT;
      const bh = bw / IMAGE_ASPECT;
      const bx = (W - bw) / 2;
      const by = (H - bh) / 2;
      box.querySelectorAll<HTMLElement>('[data-window]').forEach((el) => {
        // Offsets ignore transforms, so entrance slides never skew the maths.
        let x = 0;
        let y = 0;
        let n: HTMLElement | null = el;
        while (n && n !== box) {
          x += n.offsetLeft;
          y += n.offsetTop;
          n = n.offsetParent as HTMLElement | null;
        }
        const size = `${bw.toFixed(1)}px ${bh.toFixed(1)}px`;
        const pos = `${(bx - x).toFixed(1)}px ${(by - y).toFixed(1)}px`;
        // Washed windows carry a flat light layer over the render.
        const washed = el.dataset.window === 'washed';
        el.style.backgroundSize = washed ? `100% 100%, ${size}` : size;
        el.style.backgroundPosition = washed ? `0 0, ${pos}` : pos;
      });
    };

    paint();
    document.fonts?.ready.then(paint);

    // Decode the three renders before the footer arrives: a 2400px
    // background decoded on its first paint lands as a dropped frame in the
    // middle of the entrance.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        [BACKDROP, LIT, FROSTED].forEach((src) => {
          const img = new Image();
          img.src = src;
          img.decode?.().catch(() => {});
        });
      },
      { rootMargin: '150% 0px' },
    );
    io.observe(box);
    const ro = new ResizeObserver(paint);
    ro.observe(box);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  /* ── motion ── */
  useLayoutEffect(() => {
    gsapInit();
    const footer = footerRef.current;
    const drift = driftRef.current;
    if (!footer || !drift) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(footer);

      // The reveal: the room settles slower than the page lifts.
      gsap.fromTo(
        drift,
        { yPercent: -42, y: 0 },
        {
          yPercent: 0,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
      gsap.fromTo(
        q('[data-veil]'),
        { opacity: 0.8 },
        {
          opacity: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        },
      );

      // The entrance, once.
      const words = q('[data-word]');
      const slides = q('[data-slide]');
      const panel = q('[data-panel-fade]');
      const [lineA, lineB] = q('[data-wm-line]');

      gsap.set(words, { xPercent: -104, x: 0 });
      gsap.set(slides, { xPercent: -104, x: 0 });
      const panelRule = q('[data-panel-rule]');
      // A hair of opacity, never 0 or hidden: a panel the browser has not yet
      // drawn pays for its first paint mid-entrance, as a dropped frame.
      gsap.set(panel, { opacity: 0.01 });
      gsap.set(panelRule, { scaleX: 0 });
      gsap.set(lineA, { xPercent: -60, x: 0, autoAlpha: 0 });
      gsap.set(lineB, { xPercent: 60, x: 0, autoAlpha: 0 });

      gsap
        .timeline({ scrollTrigger: { trigger: footer, start: 'top 45%', once: true } })
        .to(panelRule, { scaleX: 1, duration: 1.3, ease: 'power3.inOut' }, 0)
        .to(panel, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 0.15)
        .to(words, { xPercent: 0, x: 0, duration: 1.3, ease: 'power4.out', stagger: 0.1 }, 0.1)
        .to(slides, { xPercent: 0, x: 0, duration: 1.1, ease: 'power4.out', stagger: 0.05 }, 0.55)
        .to(
          [lineA, lineB],
          { xPercent: 0, x: 0, autoAlpha: 1, duration: 1.8, ease: 'power4.out', stagger: 0.12 },
          0.25,
        );
    }, footer);

    return () => ctx.revert();
  }, []);

  /** A line that slides sideways into its own mask on entrance. */
  const Slide = ({
    children,
    className = '',
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span className={`block overflow-hidden ${className}`}>
      <span data-slide className="block will-change-transform">
        {children}
      </span>
    </span>
  );

  const label = 'mb-5 text-[11px] font-[600] uppercase tracking-[0.24em]';
  const underline =
    'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-smooth hover:bg-[length:100%_1px]';

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden [--wm:13vw] lg:h-[max(100svh,720px)] lg:[--wm:11.3vw]"
      style={{ background: '#0b0b0b', color: PAPER, fontFamily: 'var(--font-josefin)' }}
    >
      <div
        ref={driftRef}
        data-drift
        className="relative will-change-transform lg:absolute lg:inset-0"
      >
        {/* ── The room ── */}
        <img
          src={BACKDROP}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.5) 45%, rgba(8,8,8,0.7) 100%)',
          }}
        />

        {/* ── Stay in contact ── */}
        <div className="relative px-5 pt-20 lg:absolute lg:left-[5.5vw] lg:top-[14svh] lg:w-[36vw] lg:px-0 lg:pt-0">
          <h2 className="text-[clamp(44px,5.4vw,104px)] font-[300] leading-[1.02] tracking-[0.005em]">
            {['Stay in', 'contact'].map((w) => (
              <span key={w} className="block overflow-hidden pb-[0.12em]">
                <span data-word className="block will-change-transform">
                  {w}
                </span>
              </span>
            ))}
          </h2>
          <p
            className="mt-6 max-w-[34ch] text-[clamp(15px,1.1vw,19px)] font-[300] leading-[1.5]"
            style={{ color: PAPER_SOFT }}
          >
            <Slide>Tell us about the home you have in mind.</Slide>
            <Slide>We answer every message ourselves.</Slide>
          </p>
        </div>

        {/* ── The glass ── */}
        <div
          data-panel
          className="relative z-10 mx-5 mt-12 lg:absolute lg:bottom-[calc(var(--wm)*1.02)] lg:left-[47vw] lg:right-[3.2vw] lg:mx-0 lg:mt-0"
        >
          {/* Drawn first, along the top edge; the glass fades up under it. */}
          <span
            data-panel-rule
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-10 block h-px origin-left"
            style={{ background: 'rgba(244,242,238,0.55)' }}
          />
          {/* Frosted copy of the room, aligned with it. */}
          <div
            data-panel-fade
            data-window
            aria-hidden="true"
            className="absolute inset-0 will-change-[opacity]"
            style={{ backgroundImage: `url(${FROSTED})`, opacity: 0.94 }}
          />
          <div
            data-panel-fade
            aria-hidden="true"
            className="absolute inset-0 will-change-[opacity]"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(20,20,20,0.30) 45%, rgba(10,10,10,0.42) 100%)',
              boxShadow: `inset 0 0 0 1px ${HAIRLINE}, inset 0 1px 0 rgba(255,255,255,0.28)`,
            }}
          />

          <div
            data-panel-fade
            className="relative flex flex-col p-6 will-change-[opacity] sm:p-8 lg:p-[2.6vw]"
          >
            {/* Index · Studio · Socials */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-[1fr_1fr_auto]">
              <nav aria-label="Footer">
                <p className={label} style={{ color: PAPER_FAINT }}>
                  <Slide>Index</Slide>
                </p>
                <ul className="flex flex-col gap-2">
                  {INDEX.map((l) => (
                    <li key={l.label}>
                      <Slide>
                        <Link
                          href={href(l.path)}
                          className={`text-[clamp(18px,1.45vw,26px)] font-[300] leading-[1.25] ${underline}`}
                        >
                          {l.label}
                        </Link>
                      </Slide>
                    </li>
                  ))}
                </ul>
              </nav>

              {(address.length > 0 || phone) && (
                <div>
                  <p className={label} style={{ color: PAPER_FAINT }}>
                    <Slide>Studio</Slide>
                  </p>
                  <address
                    className="text-[clamp(14px,1vw,17px)] font-[300] not-italic leading-[1.6]"
                    style={{ color: PAPER_SOFT }}
                  >
                    {address.map((line) => (
                      <Slide key={line}>{line}</Slide>
                    ))}
                    {phone && (
                      <Slide className="mt-3">
                        <a href={`tel:${phone.replace(/\s+/g, '')}`} className={underline}>
                          {phone}
                        </a>
                      </Slide>
                    )}
                  </address>
                </div>
              )}

              {socials.length > 0 && (
                <ul className="col-span-2 flex gap-3 sm:col-span-1 sm:flex-col">
                  {socials.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.platform}
                        className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 hover:bg-[#f4f2ee] hover:text-[#111111]"
                        style={{ borderColor: 'rgba(244,242,238,0.34)' }}
                      >
                        <span className="block h-[18px] w-[18px]">
                          <SocialGlyph platform={s.platform} />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* The email, large */}
            {email && (
              <div className="mt-12 lg:mt-[6svh]">
                <div className="h-px w-full" style={{ background: HAIRLINE }} />
                <p className={`${label} mt-6`} style={{ color: PAPER_FAINT }}>
                  <Slide>Write to us</Slide>
                </p>
                <Slide>
                  <a
                    href={`mailto:${email}`}
                    className="group inline-flex items-baseline gap-[0.4em] text-[clamp(28px,3.3vw,62px)] font-[300] leading-[1.05]"
                  >
                    <span className={underline}>{email}</span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="h-[0.5em] w-[0.5em] transition-transform duration-500 ease-smooth group-hover:-translate-y-[0.08em] group-hover:translate-x-[0.08em]"
                    >
                      <path d="M3 13L13 3M5 3h8v8" />
                    </svg>
                  </a>
                </Slide>
              </div>
            )}

            {/* Legal */}
            <div className="mt-10 lg:mt-[5svh]">
              <div className="h-px w-full" style={{ background: HAIRLINE }} />
              <div
                className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[12px] font-[400] tracking-[0.04em]"
                style={{ color: PAPER_FAINT }}
              >
                <div className="flex gap-6">
                  <Link
                    href={href('privacy-policy')}
                    className={`hover:text-[#f4f2ee] ${underline}`}
                  >
                    Privacy Policy
                  </Link>
                  <Link href={href('terms')} className={`hover:text-[#f4f2ee] ${underline}`}>
                    Terms and Conditions
                  </Link>
                </div>
                <span>© {new Date().getFullYear()} TDK Design &amp; Build</span>
              </div>
            </div>
          </div>
        </div>
        {/* ── The wordmark: two windows into the lit room ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative z-0 select-none px-5 pb-2 pt-16 font-[600] uppercase leading-none lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-[3.2vw] lg:pt-0"
          style={{ fontSize: 'var(--wm)' }}
        >
          {/* TDK DESIGN — cut through its lower half by its own band. */}
          <div className="overflow-hidden" style={{ height: '0.5em' }}>
            <div
              data-wm-line
              data-window="washed"
              className="w-max whitespace-nowrap tracking-[-0.01em] will-change-transform"
              style={{
                backgroundImage: `linear-gradient(rgba(244,242,238,0.34), rgba(244,242,238,0.34)), url(${LIT})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                marginTop: '0.02em',
              }}
            >
              TDK DESIGN
            </div>
          </div>
          {/* & BUILD — stepped down onto the panel's line, sitting on the floor. */}
          <div
            className="ml-[28vw] overflow-hidden lg:ml-[43.8vw]"
            style={{ height: '0.74em', marginTop: '0.02em' }}
          >
            <div
              data-wm-line
              data-window="washed"
              className="w-max whitespace-nowrap tracking-[-0.01em] will-change-transform"
              style={{
                backgroundImage: `linear-gradient(rgba(244,242,238,0.34), rgba(244,242,238,0.34)), url(${LIT})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              &amp; BUILD
            </div>
          </div>
        </div>
      </div>

      {/* The shadow the page leaves as it lifts. */}
      <div
        data-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: '#050505', opacity: 0 }}
      />
    </footer>
  );
}
