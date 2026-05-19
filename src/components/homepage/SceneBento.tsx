'use client';

import {
  ArrowUpRight,
  Sparkle,
  Compass,
  Ruler,
  HardHat,
  Hammer,
  Building2,
  Wrench,
  PencilRuler,
  Layers,
  Home,
  TreePine,
  Square,
  Triangle,
  Box,
  KeyRound,
} from 'lucide-react';
import Button from '@/components/ui/Button';

const CARD_TINT = '#1c2829';

const TIMELINE: Array<[string, string, string]> = [
  ['2024 — Now', 'Armonia Apartments', 'Lakatameia, Nicosia'],
  ['2022 — 2024', 'Almond Residences', 'Strovolos, Nicosia'],
  ['2018 — 2022', 'Bespoke Family Homes', 'Across Cyprus'],
];

const CRAFT_ROW_1 = [Compass, Ruler, PencilRuler, Layers, HardHat, Hammer, Building2, Wrench];
const CRAFT_ROW_2 = [Home, TreePine, Square, Triangle, Box, KeyRound, Compass, Layers];

function CraftTile({ Icon }: { Icon: typeof Compass }) {
  return (
    <div className="liquid-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-xl md:h-16 md:w-16">
      <Icon strokeWidth={1.5} className="h-5 w-5 text-white/85 md:h-6 md:w-6" />
    </div>
  );
}

function MarqueeRow({
  icons,
  direction,
}: {
  icons: typeof CRAFT_ROW_1;
  direction: 'left' | 'right';
}) {
  const animClass = direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right';
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className={`flex w-max gap-3 ${animClass}`}>
        {[...icons, ...icons].map((Icon, i) => (
          <CraftTile key={i} Icon={Icon} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  align = 'center',
}: {
  children: React.ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : 'justify-start'}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <Sparkle strokeWidth={1.5} className="h-3 w-3 text-white/70" />
      <span className="text-[11px] uppercase tracking-[0.22em] text-white/70">{children}</span>
      <Sparkle strokeWidth={1.5} className="h-3 w-3 text-white/70" />
    </div>
  );
}

export default function SceneBento() {
  return (
    <section
      className="relative flex w-full flex-col justify-center bg-void px-4 py-12 text-paper antialiased sm:px-6 sm:py-16 md:px-10 md:py-24 lg:min-h-[180vh] lg:px-14 lg:py-32"
      style={{ backgroundColor: 'var(--color-void)' }}
    >
      {/* ─── Header row ──────────────────────────────────────── */}
      <div className="mb-10 flex flex-col items-start justify-between gap-8 md:mb-16 md:flex-row md:items-center lg:mb-24">
        <div className="max-w-3xl">
          <h2
            className="text-[28px] font-light tracking-tight sm:text-3xl md:text-4xl lg:text-[44px]"
            style={{ lineHeight: 1.15 }}
          >
            We&apos;re TDK Design &amp; Build.
          </h2>
          <p className="mt-6 max-w-3xl text-sm leading-[1.6] text-white/60 md:mt-8 md:text-[15px]">
            A Cyprus-based developer shaping considered residences, mixed-use buildings, and family
            homes. Three decades of craft behind us — we move from the first sketch to the handed
            keys with focus and intention.
          </p>
        </div>

        <Button href="/en/contact" variant="primary" size="sm" magnetic className="shrink-0">
          Start Your Project
        </Button>
      </div>

      {/* ─── Bento grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:h-[130vh] lg:grid-cols-3">
        {/* ── Column 1 — Track Record ─────────────────────── */}
        <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-black p-5 md:p-6 lg:min-h-0">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            src="https://res.cloudinary.com/konaverse/video/upload/v1779145642/clients/tdkdb/general/bento/leaf.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/80" />
          <div className="relative z-10 flex h-full flex-col">
            <SectionLabel>Track Record</SectionLabel>
            <div className="mt-auto">
              <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-3">
                {TIMELINE.map(([year, role, place]) => (
                  <div key={year} className="contents">
                    <span
                      className="text-[12px] text-white/85"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {year}
                    </span>
                    <Sparkle strokeWidth={1.5} className="h-3 w-3 text-white/60" />
                    <span className="text-[13px] text-white/90">
                      {role}
                      <span className="text-white/55"> · {place}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Column 2 ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-rows-[auto_1fr] md:gap-5">
          {/* Client Voice */}
          <div
            className="noise-overlay relative overflow-hidden rounded-2xl p-5 md:p-6"
            style={{ backgroundColor: CARD_TINT }}
          >
            <SectionLabel align="start">Client Voice</SectionLabel>
            <p
              className="mt-4 text-[13px] leading-[1.6] text-white/85 sm:text-[13.5px]"
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              &ldquo;TDK reshaped what we hoped a home could feel like — every junction considered,
              every finish quiet. The process felt graceful, and the result speaks for
              itself.&rdquo;
            </p>
            <p
              className="mt-4 text-[12px] text-white/70"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="text-white/95">Elena Markou</span>
              <span> · Homeowner — Armonia</span>
            </p>
          </div>

          {/* Stat */}
          <div className="relative flex min-h-[260px] flex-col overflow-hidden rounded-2xl bg-black p-5 md:p-6">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-60"
              src="https://res.cloudinary.com/konaverse/video/upload/v1779145615/clients/tdkdb/general/bento/prism.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
              <span
                className="text-5xl font-light tracking-tight drop-shadow sm:text-6xl md:text-7xl lg:text-[88px]"
                style={{ color: 'var(--color-threshold)' }}
              >
                120+
              </span>
              <span
                className="mt-3 text-[12px] uppercase tracking-[0.22em] text-white/85"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Homes delivered
              </span>
            </div>
          </div>
        </div>

        {/* ── Column 3 ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-rows-[1fr_auto] md:gap-5">
          {/* Craft / Disciplines */}
          <div className="relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl bg-black p-5 md:p-6">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-50"
              src="https://res.cloudinary.com/konaverse/video/upload/v1779145531/clients/tdkdb/general/bento/smoke.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
            <div className="relative z-10 flex h-full flex-col gap-4">
              <SectionLabel>Our Craft</SectionLabel>
              <div className="mt-auto flex flex-col gap-3">
                <MarqueeRow icons={CRAFT_ROW_1} direction="left" />
                <MarqueeRow icons={CRAFT_ROW_2} direction="right" />
              </div>
            </div>
          </div>

          {/* Reach Us */}
          <div
            className="noise-overlay relative overflow-hidden rounded-2xl p-5 md:p-6"
            style={{ backgroundColor: CARD_TINT }}
          >
            <a
              href="/en/contact"
              className="liquid-glass absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:text-white"
              aria-label="Contact TDK"
            >
              <ArrowUpRight strokeWidth={1.5} className="h-4 w-4" />
            </a>
            <SectionLabel align="start">Reach Us</SectionLabel>
            <div
              className="mt-4 flex flex-col gap-1.5 text-[14px] text-white/90"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <a href="mailto:hello@tdkdb.com" className="transition hover:text-white">
                hello@tdkdb.com
              </a>
              <a href="tel:+35722000000" className="text-white/70 transition hover:text-white">
                +357 22 000 000
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
