'use client';

import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cloudinaryUrl } from '@/lib/cloudinary/transforms';

// Types
export interface iCardItem {
  title: string;
  description: string;
  tag: string;
  src: string; // we will pass cloudinaryUrl here
  link: string;
  color: string;
  textColor: string;
}

interface iCardProps extends iCardItem {
  i: number;
}

// Components
const Card: FC<iCardProps> = ({ title, description, tag, color, textColor, link, i, src }) => {
  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-4 md:p-0">
      <div
        className="relative mx-auto flex h-[65vh] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 shadow-2xl"
        style={{ backgroundColor: color }}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            className="h-full w-full object-cover"
            src={src}
            alt={title}
            fill
            sizes="100vw"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <p className="mb-4 text-xs tracking-[0.3em]" style={{ color: 'var(--color-threshold)' }}>
            {tag}
          </p>
          <h2
            className="font-sans font-[300] tracking-[0.04em]"
            style={{
              color: textColor,
              fontSize: 'clamp(32px, 8vw, 64px)',
              lineHeight: 1,
            }}
          >
            {title}
          </h2>
          <p
            className="mt-4 max-w-[80%] text-xs tracking-[0.25em]"
            style={{ color: 'var(--color-stone)' }}
          >
            {description}
          </p>

          <div className="mt-10">
            <Link
              href={link}
              className="inline-flex items-center gap-4 border px-6 py-3 text-xs tracking-[0.25em] text-paper transition-colors duration-300"
              style={{ borderColor: 'rgba(255,255,255,0.18)', color: textColor }}
            >
              VIEW
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * CardSlide component displays a series of cards in a vertical scroll layout
 * Each card contains a title, description, and decorative elements
 */
interface iCardSlideProps {
  items: iCardItem[];
}

const CardsParallax: FC<iCardSlideProps> = ({ items }) => {
  return (
    <div className="min-h-screen bg-void pb-[20vh]">
      {items.map((project, i) => {
        return <Card key={`p_${i}`} {...project} i={i} />;
      })}
    </div>
  );
};

export { CardsParallax };
