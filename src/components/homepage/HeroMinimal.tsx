'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap';
import Button from '@/components/ui/Button';
import { LampContainer } from '@/components/ui/lamp';

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

/* ─── HeroMinimal ─────────────────────────────────────────────── */

export default function HeroMinimal() {
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
    <section className="h-screen w-full bg-void">
      {/* LAYER 1: Background (Paragraph & Button) */}
      <div className="fixed inset-0 z-0 h-screen w-full overflow-hidden">
        <LampContainer
          glowColor="#ffffff"
          glowColorBright="#ffffff"
          className="pointer-events-none absolute inset-0 h-full min-h-full w-full"
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-0 sm:px-6 sm:pb-1 md:px-10 md:pb-1">
          <div className="grid grid-cols-12 items-end gap-4">
            {/* Empty column to keep grid layout identical */}
            <div className="col-span-12 lg:col-span-8"></div>

            <div className="col-span-12 flex flex-col gap-5 pb-28 sm:pb-32 lg:col-span-4 lg:pb-3">
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

      {/* LAYER 2: Foreground (Title) */}
      <div className="pointer-events-none fixed inset-0 z-50 h-screen w-full overflow-hidden mix-blend-difference">
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-0 sm:px-6 sm:pb-1 md:px-10 md:pb-1">
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="pointer-events-auto col-span-12 lg:col-span-8">
              <h1
                className="translate-y-[0.12em] text-[22vw] font-medium leading-[0.85] tracking-[-0.05em] sm:text-[20vw] md:text-[18vw] lg:text-[17vw] xl:text-[16vw] 2xl:text-[17vw]"
                style={{
                  color: '#fff',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                <WordsPullUp text={TITLE} showAsterisk />
              </h1>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
