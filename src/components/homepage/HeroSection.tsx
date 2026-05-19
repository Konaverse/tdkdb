'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';
import Button from '@/components/ui/Button';

const TITLE = 'TDKDB';
const PARAGRAPH =
  'TDK Design & Build is a Cyprus-based developer crafting residences and mixed-use buildings — bound not by trend or scale but by a hunger to bring intention, craft, and clarity to every detail.';

/* ─── WordsPullUp (GSAP) ─────────────────────────────────────── */

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

function WordsPullUp({ text, className = '', showAsterisk = false, style }: WordsPullUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(' ');

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!.querySelectorAll('.word'),
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.08,
        },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <span
            key={i}
            className="word relative inline-block"
            style={{ marginRight: isLast ? 0 : '0.25em', opacity: 0 }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute -right-[0.3em] top-[0.65em] text-[0.31em]">*</span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ─── HeroSection ─────────────────────────────────────────────── */

export default function HeroSection() {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        paragraphRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: 'expo.out' },
      );
      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.7, ease: 'expo.out' },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="h-screen w-full">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-black md:rounded-[2rem]">
        {/* Background video — swap with TDK reel later */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://res.cloudinary.com/konaverse/video/upload/v1779145388/clients/tdkdb/general/hero/hero_video.mp4"
        />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

        {/* Hero content — bottom anchored */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10">
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="text-[22vw] font-medium leading-[0.85] tracking-[-0.05em] sm:text-[20vw] md:text-[18vw] lg:text-[17vw] xl:text-[16vw] 2xl:text-[17vw]"
                style={{ color: 'var(--color-paper)', fontFamily: 'var(--font-primary)' }}
              >
                <WordsPullUp text={TITLE} showAsterisk />
              </h1>
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
              <p
                ref={paragraphRef}
                className="text-xs sm:text-sm md:text-base"
                style={{
                  lineHeight: 1.2,
                  color: 'rgba(245, 240, 232, 0.75)',
                  fontFamily: 'var(--font-primary)',
                  opacity: 0,
                }}
              >
                {PARAGRAPH}
              </p>

              <div ref={ctaRef} className="self-start" style={{ opacity: 0 }}>
                <Button href="/en/projects" variant="primary" size="sm" magnetic>
                  View Our Work
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
