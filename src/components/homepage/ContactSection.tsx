'use client';

import { useLayoutEffect, useRef } from 'react';
import ContactForm from '@/components/contact/ContactForm';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { maskChars, riseIn } from '@/lib/animations/text';
import { imageReveal } from '@/lib/animations/imageReveal';
import { imageUrl } from '@/lib/sanity/image';
import type { SanityImage } from '@/lib/sanity/types';

const INTRO =
  'For a new home, a question about a residence, or simply to say hello, we would like to hear from you.';

/** The original editorial contact layout, with the form replacing its details grid. */
export default function ContactSection({ plate }: { plate?: SanityImage }) {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsapInit();
    const scope = rootRef.current;
    if (!scope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let alive = true;
    let ctx: gsap.Context | null = null;
    let reveal: { revert: () => void } | null = null;

    document.fonts.ready.then(() => {
      if (!alive) return;
      ctx = gsap.context(() => {
        const q = gsap.utils.selector(scope);
        const letters = maskChars(q('[data-letter]')).chars;
        const intro = maskChars(q('[data-intro]'));
        const form = q('[data-contact-form]');
        gsap.set(form, { autoAlpha: 0, y: 16 });
        reveal = imageReveal(q('[data-plate]')[0] as HTMLElement, {
          settle: q('[data-settle]')[0],
        });
        gsap
          .timeline({
            scrollTrigger: { trigger: scope, start: 'top 68%', once: true },
            onComplete: () => intro.split.revert(),
          })
          .to(letters, riseIn(letters), 0.2)
          .to(intro.chars, riseIn(intro.chars), 0.45)
          .to(form, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.75);
      }, scope);
    });

    return () => {
      alive = false;
      ctx?.revert();
      reveal?.revert();
    };
  }, []);

  return (
    <section
      data-nav="light"
      ref={rootRef}
      id="contact"
      aria-labelledby="contact-heading"
      className="relative w-full bg-white text-[#111111]"
      style={{ fontFamily: 'var(--font-josefin)' }}
    >
      <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1fr_29vw]">
        <div className="flex flex-col px-5 pb-12 pt-28 sm:px-8 lg:pb-[11svh] lg:pl-[8.2vw] lg:pr-[4vw] lg:pt-[19svh]">
          <h2
            id="contact-heading"
            aria-label="Contact"
            className="-mt-[0.2em] whitespace-nowrap text-[clamp(56px,7.4vw,150px)] font-[300] leading-[0.9] tracking-[0.06em]"
          >
            {'CONTACT'.split('').map((letter, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="inline-block overflow-hidden pb-[0.06em] pt-[0.2em] align-top"
              >
                <span data-letter className="inline-block will-change-transform">
                  {letter}
                </span>
              </span>
            ))}
          </h2>
          <div className="mt-10 grid gap-10 lg:mt-[14svh] lg:grid-cols-[minmax(0,19vw)_minmax(0,1fr)] lg:gap-[8vw]">
            <div>
              <p
                data-intro
                className="max-w-[26ch] text-[clamp(19px,1.55vw,28px)] font-[300] leading-[1.3]"
              >
                {INTRO}
              </p>
            </div>
            <div data-contact-form className="min-w-0">
              <ContactForm compact />
            </div>
          </div>
        </div>
        <div
          data-nav="dark"
          className="relative aspect-[3/2] w-full overflow-hidden sm:aspect-[4/3] lg:aspect-auto"
        >
          <div data-plate className="absolute inset-0 overflow-hidden">
            <div data-settle className="absolute inset-0 will-change-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plate ? imageUrl(plate, { width: 1400 }) : ''}
                alt="Armonia terrace, a sofa against the glass wall"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={{ objectPosition: '10% 50%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
