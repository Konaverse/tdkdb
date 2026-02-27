'use client';

import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { gsap, gsapInit } from '@/lib/animations/gsap';
import { galleryImage } from '@/lib/cloudinary/transforms';

interface LightboxProps {
  images: string[]; // Cloudinary public IDs
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // GSAP fade in/out
  useLayoutEffect(() => {
    gsapInit();
    if (!overlayRef.current) return;
    if (isOpen) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(Math.max(0, initialIndex - 1));
      if (e.key === 'ArrowRight') onNavigate(Math.min(images.length - 1, initialIndex + 1));
    },
    [isOpen, onClose, onNavigate, initialIndex, images.length],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus trap — move focus to close button when opened
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentImage = images[initialIndex];
  const hasPrev = initialIndex > 0;
  const hasNext = initialIndex < images.length - 1;

  const handleClose = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: onClose,
      });
    } else {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-void"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={handleClose}
        className="text-label absolute top-6 right-6 z-10 text-stone hover:text-paper"
        aria-label="Close lightbox"
      >
        ✕ CLOSE
      </button>

      {/* Counter */}
      <div className="text-label absolute top-6 left-6 text-stone">
        {initialIndex + 1} / {images.length}
      </div>

      {/* Image */}
      <div className="relative flex h-full w-full items-center justify-center p-16">
        <img
          src={galleryImage(currentImage)}
          alt={`Gallery image ${initialIndex + 1}`}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {/* Previous */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => onNavigate(initialIndex - 1)}
          className="text-label absolute left-6 top-1/2 -translate-y-1/2 border border-border px-4 py-3 text-stone hover:border-paper hover:text-paper"
          aria-label="Previous image"
        >
          ← PREV
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={() => onNavigate(initialIndex + 1)}
          className="text-label absolute right-6 top-1/2 -translate-y-1/2 border border-border px-4 py-3 text-stone hover:border-paper hover:text-paper"
          aria-label="Next image"
        >
          NEXT →
        </button>
      )}
    </div>
  );
}
