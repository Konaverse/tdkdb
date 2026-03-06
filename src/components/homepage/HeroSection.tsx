'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';
import Button from '@/components/ui/Button';

const IsoLevelWarp = dynamic(
  () => import('@/components/ui/isometric-wave-grid-background'),
  { ssr: false },
);

const WireframeMesh = dynamic(() => import('@/components/ui/WireframeMesh'), { ssr: false });

// ─── Hardcoded project data ──────────────────────────────────────────────────

const ARMONIA = {
  name: 'ARMONIA APARTMENTS',
  location: 'Lakatameia, Nicosia',
  year: 2024,
  type: 'Residential',
  statusLabel: 'COMPLETED',
  cta: { label: 'VIEW PROJECT →', href: '/en/projects/armonia' },
  cloudinaryId: 'clients/tdkdb/armonia/exterior/armonia_square',
  bgId: 'v1772794906/clients/tdkdb/armonia/exterior/armonia_bg',
  rayColor: 'rgba(212,165,116,0.08)',
};

const ALMOND = {
  name: 'ALMOND RESIDENCES',
  location: 'Limassol',
  year: 2025,
  type: 'Residential',
  statusLabel: 'IN DEVELOPMENT',
  cta: { label: 'REGISTER INTEREST →', href: '/en/projects/almond' },
  cloudinaryId: 'v1772797414/clients/tdkdb/almond/renders/Almond_square',
  bgId: 'v1772798045/clients/tdkdb/almond/renders/almond_bg',
  rayColor: 'rgba(102,151,159,0.08)',
};

// ─── Light rays helper ───────────────────────────────────────────────────────

function LightRays({ color }: { color: string }) {
  return (
    <>
      {[25, 45, 65].map((deg, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '2px',
            height: '200%',
            top: '-50%',
            left: '50%',
            transformOrigin: 'top center',
            transform: `rotate(${deg}deg)`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: color,
              filter: 'blur(8px)',
              animation: `ray-drift ${13 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * -3}s`,
            }}
          />
        </div>
      ))}
    </>
  );
}

// ─── Mobile layout ───────────────────────────────────────────────────────────

function HeroMobile() {
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      [card1Ref.current, card2Ref.current].forEach((card) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              once: true,
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  const armoniaUrl = cloudinaryUrl(ARMONIA.cloudinaryId, {
    width: 800,
    quality: 'auto',
    format: 'auto',
  });
  const almondUrl = cloudinaryUrl(ALMOND.cloudinaryId, {
    width: 800,
    quality: 'auto',
    format: 'auto',
  });

  const projects = [
    { ...ARMONIA, url: armoniaUrl, ref: card1Ref, statusClass: 'text-stone', bg: 'linear-gradient(to bottom, #0d0d0d, rgba(212,165,116,0.06))' },
    { ...ALMOND, url: almondUrl, ref: card2Ref, statusClass: 'text-threshold', bg: 'linear-gradient(to bottom, #0d0d0d, rgba(102,151,159,0.06))' },
  ];

  return (
    <div className="w-full">
      {projects.map((p) => (
        <div
          key={p.name}
          ref={p.ref}
          className="flex min-h-screen flex-col items-center justify-center px-8 py-24"
          style={{ background: p.bg }}
        >
          <img
            src={p.url}
            alt={p.name}
            className="mb-12 object-contain"
            style={{ maxWidth: '80vw', maxHeight: '50vh' }}
          />
          <div className="w-full max-w-sm">
            <p
              className="font-sans font-light text-paper"
              style={{ fontSize: 'clamp(28px,6vw,40px)', lineHeight: 1.1 }}
            >
              {p.name}
            </p>
            <p className="text-label text-stone mt-3 tracking-[0.2em]">
              {p.location} · {p.year} · {p.type}
            </p>
            <div className="mt-6">
              <span
                className={`text-label ${p.statusClass} inline-block bg-surface px-3 py-1.5 uppercase tracking-[0.2em]`}
              >
                {p.statusLabel}
              </span>
            </div>
            <div className="mt-6">
              <Button magnetic variant="ghost" href={p.cta.href}>
                {p.cta.label}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Desktop hero ────────────────────────────────────────────────────────────

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const heroRef = useRef<HTMLElement>(null);
  const isoWrapRef = useRef<HTMLDivElement>(null);
  const wireframeWrapRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const state1TextRef = useRef<HTMLDivElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const armoniaRef = useRef<HTMLImageElement>(null);
  const almondRef = useRef<HTMLImageElement>(null);
  const armoniaGlowRef = useRef<HTMLDivElement>(null);
  const armoniaRaysRef = useRef<HTMLDivElement>(null);
  const almondGlowRef = useRef<HTMLDivElement>(null);
  const almondRaysRef = useRef<HTMLDivElement>(null);
  const armoniaInfoRef = useRef<HTMLDivElement>(null);
  const almondInfoRef = useRef<HTMLDivElement>(null);

  // One-time mobile detection
  useEffect(() => {
    setIsMobile(
      window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches,
    );
  }, []);

  // Fade in sub-quote on mount
  useEffect(() => {
    if (isMobile) return;
    if (!subTextRef.current) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(subTextRef.current, { opacity: 1 });
      return;
    }

    gsap.fromTo(
      subTextRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.6 },
    );
  }, [isMobile]);

  // Pinned scroll timeline
  useLayoutEffect(() => {
    if (isMobile) return;
    if (
      !heroRef.current ||
      !isoWrapRef.current ||
      !wireframeWrapRef.current ||
      !headlineRef.current ||
      !state1TextRef.current ||
      !armoniaRef.current ||
      !almondRef.current ||
      !armoniaGlowRef.current ||
      !armoniaRaysRef.current ||
      !almondGlowRef.current ||
      !almondRaysRef.current ||
      !armoniaInfoRef.current ||
      !almondInfoRef.current
    )
      return;

    let tl: gsap.core.Timeline | null = null;
    let st: ScrollTrigger | null = null;

    const build = () => {
      gsapInit();
      tl?.kill();
      st?.kill();

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // ── Initial states ──────────────────────────────────────────────────

      // Headline: positioned at top-left in CSS; push it down to where it
      // looks like it's sitting at the bottom-left in State 1
      const headlineEl = headlineRef.current!;
      const headlineH = headlineEl.offsetHeight;
      const topTarget = Math.max(96, Math.min(vh * 0.11, 120));
      const bottomPad = Math.max(48, Math.min(vh * 0.06, 80));
      const initialY = vh - bottomPad - headlineH - topTarget;
      gsap.set(headlineEl, { y: initialY, scale: 1, transformOrigin: 'top left' });

      // Both buildings start off-screen bottom-right, opacity 0
      gsap.set(armoniaRef.current!, {
        xPercent: -50,
        yPercent: -50,
        x: vw + 300,
        y: vh + 200,
        scale: 0.6,
        opacity: 0,
        rotation: 5,
      });
      gsap.set(almondRef.current!, {
        xPercent: -50,
        yPercent: -50,
        x: vw + 300,
        y: vh + 200,
        scale: 0.6,
        opacity: 0,
        rotation: 5,
      });
      // Both bgs: hidden via clipPath (circle reveal); rays: hidden via opacity
      gsap.set(armoniaGlowRef.current!, { clipPath: 'circle(0% at 50% 50%)' });
      gsap.set(almondGlowRef.current!, { clipPath: 'circle(0% at 50% 50%)' });
      gsap.set([armoniaRaysRef.current!, almondRaysRef.current!], { opacity: 0 });
      gsap.set([armoniaInfoRef.current!, almondInfoRef.current!], { opacity: 0, y: 20 });

      // ── Arc geometry ─────────────────────────────────────────────────────
      // Display position: center of the hero viewport (top of the circular arc)
      const DX = vw / 2;
      const DY = vh / 2;
      // Right-side control point (3-o'clock of the circle, below center)
      const RX = vw * 0.8;
      const RY = vh * 0.75;
      // Left-side control point (9-o'clock of the circle, below center)
      const LX = vw * 0.2;
      const LY = vh * 0.75;
      // Off-screen exits
      const OFF_R_X = vw + 300;
      const OFF_R_Y = vh + 200;
      const OFF_L_X = -300;
      const OFF_L_Y = vh + 200;

      // ── Build timeline (total duration = 1, positions are seconds) ──────
      tl = gsap.timeline({ defaults: { ease: 'none' } });

      // 0→0.1: Wireframe exits, iso dims, sub-quote exits
      tl.to(wireframeWrapRef.current!, { opacity: 0, duration: 0.1, ease: 'power2.inOut' }, 0);
      tl.to(isoWrapRef.current!, { opacity: 0.4, duration: 0.1, ease: 'power2.inOut' }, 0);
      tl.to(
        state1TextRef.current!,
        { opacity: 0, y: -30, duration: 0.125, ease: 'power2.in' },
        0,
      );

      // 0→0.12: Headline slides from bottom-left up to top-left, shrinks to label
      tl.to(
        headlineEl,
        { y: 0, scale: 0.4, duration: 0.12, ease: 'power3.inOut' },
        0,
      );

      // 0.1→0.45: Armonia sweeps in along the right side of the circle arc
      //   Path: off-screen bottom-right → right-side control → display (top of arc)
      //   Ease power2.inOut = slow start, fast middle, slows to rest at display
      tl.to(
        armoniaRef.current!,
        {
          motionPath: {
            path: [{ x: RX, y: RY }, { x: DX, y: DY }],
            curviness: 1.2,
          },
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.35,
          ease: 'power2.inOut',
        },
        0.1,
      );

      // 0.35→0.45: Armonia bg expands from center circle, rays bloom in, iso dims further
      tl.to(armoniaGlowRef.current!, { clipPath: 'circle(170% at 50% 50%)', duration: 0.1, ease: 'power2.out' }, 0.35);
      tl.to(armoniaRaysRef.current!, { opacity: 1, duration: 0.1 }, 0.35);
      tl.to(isoWrapRef.current!, { opacity: 0.15, duration: 0.1 }, 0.35);

      // 0.45→0.52: Armonia info slides in
      tl.to(
        armoniaInfoRef.current!,
        { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' },
        0.45,
      );

      // 0.52→0.56: Armonia info exits before swap
      tl.to(armoniaInfoRef.current!, { opacity: 0, duration: 0.04 }, 0.52);

      // 0.56→0.86: WHEEL SWAP — both move simultaneously, same ease, same duration
      //   Armonia: display (top) → left-side control → off-screen bottom-left
      //   Almond:  off-screen bottom-right → right-side control → display (top)
      //   Identical ease + duration = locked together like points on a wheel
      tl.to(
        armoniaRef.current!,
        {
          motionPath: {
            path: [{ x: LX, y: LY }, { x: OFF_L_X, y: OFF_L_Y }],
            curviness: 1.2,
          },
          scale: 0.6,
          rotation: -5,
          duration: 0.3,
          ease: 'power2.inOut',
        },
        0.56,
      );
      tl.to(
        almondRef.current!,
        {
          motionPath: {
            path: [{ x: RX, y: RY }, { x: DX, y: DY }],
            curviness: 1.2,
          },
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.inOut',
        },
        0.56,
      );

      // 0.56→0.7: Armonia bg collapses back to circle, rays fade out
      tl.to(armoniaGlowRef.current!, { clipPath: 'circle(0% at 50% 50%)', duration: 0.14, ease: 'power2.in' }, 0.56);
      tl.to(armoniaRaysRef.current!, { opacity: 0, duration: 0.14 }, 0.56);

      // 0.7→0.86: Almond bg expands from center circle, rays bloom in
      tl.to(almondGlowRef.current!, { clipPath: 'circle(170% at 50% 50%)', duration: 0.16, ease: 'power2.out' }, 0.7);
      tl.to(almondRaysRef.current!, { opacity: 1, duration: 0.16 }, 0.7);

      // 0.87→0.94: Almond info slides in
      tl.to(
        almondInfoRef.current!,
        { opacity: 1, y: 0, duration: 0.07, ease: 'power2.out' },
        0.87,
      );

      // 0.92→1.0: Everything fades out — pin releases into SceneAnatomy
      tl.to(
        [
          almondInfoRef.current!,
          almondRef.current!,
          almondGlowRef.current!,
          almondRaysRef.current!,
          isoWrapRef.current!,
          headlineEl,
        ],
        { opacity: 0, duration: 0.08 },
        0.92,
      );

      // ── Pin + scrub ─────────────────────────────────────────────────────
      st = ScrollTrigger.create({
        trigger: heroRef.current!,
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: 1.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tl,
      });
    };

    build();
    ScrollTrigger.addEventListener('refreshInit', build);

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', build);
      tl?.kill();
      st?.kill();
    };
  }, [isMobile]);

  // ── Cloudinary URLs ────────────────────────────────────────────────────────
  const armoniaUrl = cloudinaryUrl(ARMONIA.cloudinaryId, {
    width: 1400,
    quality: 'auto',
    format: 'auto',
  });
  const armoniaBgUrl = cloudinaryUrl(ARMONIA.bgId, {
    width: 1920,
    quality: 'auto',
    format: 'auto',
  });
  const almondUrl = cloudinaryUrl(ALMOND.cloudinaryId, {
    width: 1400,
    quality: 'auto',
    format: 'auto',
  });
  const almondBgUrl = cloudinaryUrl(ALMOND.bgId, {
    width: 1920,
    quality: 'auto',
    format: 'auto',
  });

  if (isMobile) {
    return <HeroMobile />;
  }

  return (
    <section ref={heroRef} className="relative h-screen w-full overflow-hidden">

      {/* z-0: IsoLevelWarp line grid */}
      <div ref={isoWrapRef} className="absolute inset-0 z-0">
        <IsoLevelWarp color="102, 151, 159" speed={0.6} density={45} />
      </div>

      {/* z-1: Armonia background — circle clip-path reveal */}
      <div
        ref={armoniaGlowRef}
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: `url(${armoniaBgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* z-1: Armonia atmosphere — amber light rays */}
      <div
        ref={armoniaRaysRef}
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      >
        <LightRays color={ARMONIA.rayColor} />
      </div>

      {/* z-1: Almond background — circle clip-path reveal */}
      <div
        ref={almondGlowRef}
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: `url(${almondBgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 45%',
        }}
      />

      {/* z-1: Almond atmosphere — teal light rays */}
      <div
        ref={almondRaysRef}
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      >
        <LightRays color={ALMOND.rayColor} />
      </div>

      {/* z-2: Permanent vignette — draws focus inward */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* z-2: Bottom scrim — ensures info text legibility on light backgrounds */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2]"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
        }}
      />

      {/* z-3: Wireframe mesh — visible in State 1 only, GSAP fades out */}
      <div
        ref={wireframeWrapRef}
        className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center"
      >
        <div style={{ width: '50vmin', height: '50vmin' }}>
          <WireframeMesh />
        </div>
      </div>

      {/* z-4: Building renders — GSAP animates x/y/scale/opacity */}
      <img
        ref={armoniaRef}
        src={armoniaUrl}
        alt="Armonia Apartments"
        className="pointer-events-none absolute z-[4]"
        style={{ width: '123vmin', height: '123vmin', objectFit: 'contain' }}
      />
      <img
        ref={almondRef}
        src={almondUrl}
        alt="Almond Residences"
        className="pointer-events-none absolute z-[4]"
        style={{ width: '210vmin', height: '210vmin', objectFit: 'contain' }}
      />

      {/* z-11: Persistent headline — starts bottom-left, moves to top-left on scroll */}
      <div
        ref={headlineRef}
        className="pointer-events-none absolute z-[11]"
        style={{
          top: 'clamp(96px, 11vh, 120px)',
          left: 'clamp(32px, 4vw, 64px)',
          transformOrigin: 'top left',
        }}
      >
        <span
          className="block font-sans font-light text-paper"
          style={{
            fontSize: 'clamp(64px, 8vw, 120px)',
            lineHeight: 1.0,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          DESIGNED TO LAST.
        </span>
      </div>

      {/* z-10: State 1 sub-quote — top-right, exits on scroll */}
      <div ref={state1TextRef} className="pointer-events-none absolute inset-0 z-[10]">
        <div
          className="absolute"
          style={{
            top: 'clamp(100px, 12vh, 140px)',
            right: 'clamp(32px, 4vw, 64px)',
          }}
        >
          <p
            ref={subTextRef}
            className="text-right font-sans font-light text-stone"
            style={{ maxWidth: '280px', lineHeight: 1.7, fontSize: '18px', opacity: 0 }}
          >
            Where concrete meets conviction
          </p>
        </div>
      </div>

      {/* z-10: Armonia project info overlay */}
      <div
        ref={armoniaInfoRef}
        className="absolute bottom-[8%] left-0 right-0 z-[10] flex items-end justify-between"
        style={{ padding: '0 clamp(32px, 4vw, 64px)' }}
      >
        <div>
          <p
            className="font-sans font-light text-paper"
            style={{ fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: 1.1 }}
          >
            {ARMONIA.name}
          </p>
          <p className="text-label text-stone mt-2 tracking-[0.2em]">
            {ARMONIA.location} · {ARMONIA.year} · {ARMONIA.type}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="text-label text-stone bg-surface px-3 py-1.5 uppercase tracking-[0.2em]">
            {ARMONIA.statusLabel}
          </span>
          <Button magnetic variant="ghost" href={ARMONIA.cta.href}>
            {ARMONIA.cta.label}
          </Button>
        </div>
      </div>

      {/* z-10: Almond project info overlay */}
      <div
        ref={almondInfoRef}
        className="absolute bottom-[8%] left-0 right-0 z-[10] flex items-end justify-between"
        style={{ padding: '0 clamp(32px, 4vw, 64px)' }}
      >
        <div>
          <p
            className="font-sans font-light text-paper"
            style={{ fontSize: 'clamp(36px, 4vw, 64px)', lineHeight: 1.1 }}
          >
            {ALMOND.name}
          </p>
          <p className="text-label text-stone mt-2 tracking-[0.2em]">
            {ALMOND.location} · {ALMOND.year} · {ALMOND.type}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="text-label text-threshold bg-surface px-3 py-1.5 uppercase tracking-[0.2em]">
            {ALMOND.statusLabel}
          </span>
          <Button magnetic variant="ghost" href={ALMOND.cta.href}>
            {ALMOND.cta.label}
          </Button>
        </div>
      </div>

    </section>
  );
}
