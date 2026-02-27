'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import Lightbox from '@/components/ui/Lightbox';
import { galleryImage } from '@/lib/cloudinary/transforms';

interface ProjectRendersGalleryProps {
  heading: string;
  images: string[]; // Cloudinary public IDs
}

export default function ProjectRendersGallery({ heading, images }: ProjectRendersGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Section>
      <GridWrapper>
        <FadeUp>
          <p className="text-label mb-12 text-stone">{heading}</p>
        </FadeUp>
        {/* Featured image + thumbnails */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <FadeUp>
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="group relative block w-full overflow-hidden"
              aria-label="View full-size image"
            >
              <img
                src={galleryImage(images[0])}
                alt={`${heading} render 1`}
                className="aspect-video w-full object-cover transition-transform duration-slow ease-smooth group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-fast ease-smooth group-hover:opacity-100">
                <span className="text-label border border-paper bg-void/80 px-4 py-2 text-paper backdrop-blur-sm">
                  VIEW FULL SIZE
                </span>
              </div>
            </button>
          </FadeUp>
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {images.slice(1).map((img, i) => (
                <FadeUp key={img} delay={i * 60}>
                  <button
                    type="button"
                    onClick={() => openLightbox(i + 1)}
                    className="group relative block overflow-hidden"
                    aria-label={`View render ${i + 2}`}
                  >
                    <img
                      src={galleryImage(img)}
                      alt={`${heading} render ${i + 2}`}
                      className="aspect-square w-full object-cover transition-transform duration-medium ease-smooth group-hover:scale-[1.05]"
                    />
                  </button>
                </FadeUp>
              ))}
            </div>
          )}
        </div>
      </GridWrapper>

      <Lightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </Section>
  );
}
