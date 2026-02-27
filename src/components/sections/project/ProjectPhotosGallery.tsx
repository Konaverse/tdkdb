'use client';

import { useState } from 'react';
import Section from '@/components/layout/Section';
import GridWrapper from '@/components/layout/GridWrapper';
import FadeUp from '@/components/animations/FadeUp';
import Lightbox from '@/components/ui/Lightbox';
import { galleryImage } from '@/lib/cloudinary/transforms';

interface ProjectPhotosGalleryProps {
  heading: string;
  images: string[]; // Cloudinary public IDs
}

export default function ProjectPhotosGallery({ heading, images }: ProjectPhotosGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <Section background="surface">
      <GridWrapper>
        <FadeUp>
          <p className="mb-12 text-label text-stone">{heading}</p>
        </FadeUp>
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {images.map((img, i) => (
            <FadeUp key={img} delay={i * 60} className="mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => openLightbox(i)}
                className="group relative block w-full overflow-hidden"
                aria-label={`View photo ${i + 1}`}
              >
                <img
                  src={galleryImage(img)}
                  alt={`${heading} photo ${i + 1}`}
                  className="w-full object-cover transition-transform duration-medium ease-smooth group-hover:scale-[1.03]"
                />
                <div className="bg-void/0 group-hover:bg-void/20 absolute inset-0 transition-colors duration-fast ease-smooth" />
              </button>
            </FadeUp>
          ))}
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
