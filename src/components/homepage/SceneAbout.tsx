'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, gsapInit } from '@/lib/animations/gsap';

const PARAGRAPHS = [
  'We approach each project as a unique architectural challenge. Our methodology is rooted in an unwavering commitment to design excellence and material authenticity.',
  'From the initial sketch to the final construction details, every decision is guided by a deep understanding of spatial dynamics and human experience.',
  'We believe that true luxury lies in simplicity. By stripping away the unnecessary, we reveal the essence of structure and light.',
  "Our collaborative process ensures that every client's vision is meticulously translated into a timeless and functional reality.",
  'The result is not just a building, but a crafted environment that resonates with its surroundings and stands the test of time.',
];

const IMAGES = [
  'https://res.cloudinary.com/konaverse/image/upload/v1779212436/clients/tdkdb/general/about/first-origin.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212437/clients/tdkdb/general/about/second-design-philosophy.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212434/clients/tdkdb/general/about/third-construction.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212432/clients/tdkdb/general/about/fourth-people.png',
  'https://res.cloudinary.com/konaverse/image/upload/v1779212428/clients/tdkdb/general/about/fifth-vision.png',
];

export default function SceneAbout() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const paraRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useLayoutEffect(() => {
    gsapInit();
    const trigger = triggerRef.current;
    const pin = pinRef.current;
    if (!trigger || !pin) return;

    const ctx = gsap.context(() => {
      // Create the main pin timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trigger,
          start: 'top top',
          end: '+=500%', // 500vh of scrolling while pinned (600vh total scroll track)
          pin: trigger,
          scrub: 1,
          pinSpacing: true,
        },
      });

      // Initial state for paragraphs (hide characters of subsequent paragraphs)
      if (paraRefs.current[0]) {
        gsap.set(paraRefs.current[0], { opacity: 1 });
      }
      paraRefs.current.forEach((para, idx) => {
        if (idx > 0 && para) {
          gsap.set(para, { opacity: 1 });
          const chars = para.querySelectorAll('.char');
          if (chars.length > 0) {
            gsap.set(chars, { opacity: 0, x: -4 });
          }
        }
      });

      // Set initial scale for all images (zoom in slightly for parallax feel)
      imageRefs.current.forEach((ref) => {
        if (ref) {
          const img = ref.querySelector('img');
          if (img) {
            gsap.set(img, { scale: 1.35 });
          }
        }
      });

      // Scale down the first image as we start scrolling
      const firstImg = imageRefs.current[0]?.querySelector('img');
      if (firstImg) {
        tl.to(firstImg, { scale: 1.0, duration: 0.22, ease: 'power1.out' }, 0);
      }

      // We have 4 transitions. Available progress: 0 to 1.
      // We start transitions at 0.15, 0.35, 0.55, 0.75
      for (let i = 0; i < IMAGES.length - 1; i++) {
        const startTime = 0.15 + i * 0.2;

        // Wipe up and scale down next image
        const nextImgWrap = imageRefs.current[i + 1];
        if (nextImgWrap) {
          tl.to(
            nextImgWrap,
            { clipPath: 'inset(0% 0 0 0)', duration: 0.12, ease: 'power2.inOut' },
            startTime,
          );

          const img = nextImgWrap.querySelector('img');
          if (img) {
            tl.to(img, { scale: 1.0, duration: 0.66, ease: 'power1.out' }, startTime);
          }
        }

        // Wipe in next paragraph's letters sequentially
        const para = paraRefs.current[i + 1];
        if (para) {
          const chars = para.querySelectorAll('.char');
          if (chars.length > 0) {
            tl.to(
              chars,
              {
                opacity: 1,
                x: 0,
                stagger: 0.0007, // Organic, rapid typewriter stagger
                duration: 0.05,
                ease: 'power1.out',
              },
              startTime,
            );
          } else {
            tl.to(para, { opacity: 1, duration: 0.12 }, startTime);
          }
        }
      }
    }, trigger);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 w-full bg-white">
      {/* Block A: 100vh Blank white space */}
      <div className="h-screen w-full bg-white" />

      {/* Block B Wrapper (The Trigger) */}
      <div ref={triggerRef} className="relative h-screen w-full bg-white">
        {/* The Pinned Element */}
        <div
          ref={pinRef}
          className="absolute inset-0 flex h-screen w-full flex-col justify-end overflow-hidden bg-white px-4 pb-2 pt-20 sm:px-6 md:px-10"
        >
          <div className="grid h-full w-full grid-cols-12 gap-8 lg:gap-16">
            {/* Left side: Container (pinned higher) */}
            <div className="col-span-12 flex h-full flex-col justify-start lg:col-span-8">
              {/* Image Container */}
              <div className="relative aspect-[16/6] w-full overflow-hidden">
                {IMAGES.map((src, i) => (
                  <div
                    key={src}
                    ref={(el) => {
                      imageRefs.current[i] = el;
                    }}
                    className="absolute inset-0 h-full w-full"
                    style={{
                      zIndex: i,
                      clipPath: i === 0 ? 'inset(0 0 0 0)' : 'inset(100% 0 0 0)',
                    }}
                  >
                    <Image
                      src={src}
                      alt={`About architecture ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Paragraphs */}
            <div className="hidden h-full flex-col justify-between pb-24 lg:col-span-4 lg:flex">
              {PARAGRAPHS.map((p, i) => {
                if (i === 0) {
                  return (
                    <p
                      key={i}
                      ref={(el) => {
                        paraRefs.current[i] = el;
                      }}
                      className="text-base font-light text-black xl:text-lg 2xl:text-xl"
                    >
                      {p}
                    </p>
                  );
                }

                const words = p.split(' ');
                return (
                  <p
                    key={i}
                    ref={(el) => {
                      paraRefs.current[i] = el;
                    }}
                    className="text-base font-light text-black xl:text-lg 2xl:text-xl"
                  >
                    {words.map((word, wIdx) => (
                      <span key={wIdx} className="word inline-block">
                        {word.split('').map((char, cIdx) => (
                          <span key={cIdx} className="char inline-block">
                            {char}
                          </span>
                        ))}
                        {wIdx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
                      </span>
                    ))}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
