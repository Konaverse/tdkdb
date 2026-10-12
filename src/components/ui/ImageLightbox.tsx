'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

import { gsap, gsapInit } from '@/lib/animations/gsap';
import { getLenis } from '@/lib/animations/lenis';
import styles from './ImageLightbox.module.css';

interface Photograph {
  src: string;
  preview: string;
  alt: string;
  caption: string;
}

interface Gallery {
  images: Photograph[];
  index: number;
  opener: HTMLButtonElement;
  pathname: string;
}

const LightboxContext = createContext({
  open: (_button: HTMLButtonElement) => {},
  ready: false,
});

/** Keep the complete photograph, including when its thumbnail is portrait-cropped. */
function photograph(frame: HTMLElement): Photograph | null {
  const img = frame.querySelector('img');
  if (!img?.getAttribute('src')) return null;
  const url = new URL(img.getAttribute('src')!, window.location.href);
  const dimensions = /-(\d+)x(\d+)\.[a-z]+$/i.exec(url.pathname);
  const aspect = dimensions
    ? Number(dimensions[1]) / Number(dimensions[2])
    : img.naturalWidth / img.naturalHeight || Number(img.width) / Number(img.height) || 16 / 9;
  if (url.hostname === 'cdn.sanity.io') {
    ['h', 'fit', 'crop', 'rect', 'fp-x', 'fp-y', 'fp-z'].forEach((key) =>
      url.searchParams.delete(key),
    );
    const fittedWidth = Math.min(
      window.innerWidth,
      Math.max(200, window.innerHeight - 136) * aspect,
    );
    const deviceWidth = fittedWidth * Math.min(window.devicePixelRatio || 1, 2);
    const width = [900, 1400, 2000, 2400].find((candidate) => candidate >= deviceWidth) ?? 2400;
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '85');
  }
  const caption =
    frame.querySelector('[data-image-caption], [data-caption]')?.textContent?.trim() || '';
  return {
    src: url.href,
    preview: img.currentSrc || img.src,
    alt: img.alt || caption || 'TDK project photograph',
    caption,
  };
}

export default function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const close = useCallback(() => setGallery(null), []);
  const open = useCallback(
    (opener: HTMLButtonElement) => {
      const clicked = opener.closest<HTMLElement>('[data-lightbox]');
      if (!clicked) return;
      const frames = Array.from(document.querySelectorAll<HTMLElement>('[data-lightbox]')).filter(
        (frame) =>
          frame.dataset.lightbox === clicked.dataset.lightbox && frame.getClientRects().length > 0,
      );
      const entries = frames
        .map((frame) => ({ frame, image: photograph(frame) }))
        .filter(
          (entry): entry is { frame: HTMLElement; image: Photograph } => entry.image !== null,
        );
      const index = entries.findIndex((entry) => entry.frame === clicked);
      if (index < 0) return;
      setGallery({ images: entries.map((entry) => entry.image), index, opener, pathname });
    },
    [pathname],
  );

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (gallery && gallery.pathname !== pathname) close();
  }, [pathname, gallery, close]);

  const value = useMemo(() => ({ open, ready }), [open, ready]);

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {gallery &&
        gallery.pathname === pathname &&
        createPortal(<Lightbox gallery={gallery} close={close} />, document.body)}
    </LightboxContext.Provider>
  );
}

/** An independent hit area leaves image entrances and inner pans untouched. */
export function LightboxTrigger({ label = 'Open photograph in lightbox' }: { label?: string }) {
  const { open, ready } = useContext(LightboxContext);
  return (
    <button
      type="button"
      data-lightbox-trigger
      aria-label={label}
      aria-haspopup="dialog"
      disabled={!ready}
      className={styles.trigger}
      onClick={(event) => open(event.currentTarget)}
    />
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M28 12H4m9-9-9 9 9 9' : 'M4 12h24m-9-9 9 9-9 9'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

function Lightbox({ gallery, close }: { gallery: Gallery; close: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(gallery.index);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const image = gallery.images[index];
  const loaded = loadedSource === image.src;
  const failed = failedSource === image.src;
  const move = useCallback(
    (direction: number) => {
      setIndex((current) => (current + direction + gallery.images.length) % gallery.images.length);
    },
    [gallery.images.length],
  );
  const description = useMemo(() => image.caption || image.alt, [image]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const lenis = getLenis();
    const wasStopped = lenis?.isStopped;
    body.style.overflow = 'hidden';
    if (gap > 0)
      body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gap}px`;
    lenis?.stop();
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    gsapInit();
    const ctx = gsap.context(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      gsap.fromTo(
        shellRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' },
      );
    }, dialog);

    return () => {
      ctx.revert();
      dialog.close();
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      if (!wasStopped) lenis?.start();
      if (gallery.opener.isConnected && window.location.pathname === gallery.pathname) {
        gallery.opener.focus({ preventScroll: true });
        lenis?.scrollTo(scrollPosition.y, { immediate: true, force: true });
        window.scrollTo(scrollPosition.x, scrollPosition.y);
      }
    };
  }, [gallery.opener, gallery.pathname]);

  useEffect(() => {
    // Only the two adjacent full-size photographs are warmed, after opening.
    if (gallery.images.length < 2) return;
    const neighbors = [1, -1].map((direction) => {
      const next = new Image();
      next.decoding = 'async';
      next.src =
        gallery.images[(index + direction + gallery.images.length) % gallery.images.length].src;
      return next;
    });
    return () => neighbors.forEach((neighbor) => neighbor.removeAttribute('src'));
  }, [index, gallery.images]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== 'touch' ||
      !event.isPrimary ||
      (event.target as Element).closest('button')
    )
      return;
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
  };

  const navigation = (direction: 'left' | 'right') => (
    <button
      type="button"
      aria-label={direction === 'left' ? 'Previous photograph' : 'Next photograph'}
      disabled={gallery.images.length < 2}
      className={`${styles.arrow} ${direction === 'left' ? styles.previous : styles.next}`}
      onClick={() => move(direction === 'left' ? -1 : 1)}
    >
      <Arrow direction={direction} />
    </button>
  );

  return (
    <dialog
      ref={dialogRef}
      data-image-lightbox
      data-nav="dark"
      aria-label="Photograph lightbox"
      aria-modal="true"
      aria-describedby="lightbox-caption"
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (!(event.target as Element).closest('button, [data-lightbox-media], figcaption'))
          close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      <div ref={shellRef} className={styles.shell}>
        <button
          ref={closeRef}
          type="button"
          aria-label="Close lightbox"
          className={styles.close}
          onClick={close}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 5 14 14M19 5 5 19" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <h2 className="sr-only">TDK photographs</h2>
        <div className={styles.gallery}>
          {navigation('left')}
          <figure className={styles.figure}>
            <div
              data-lightbox-media
              className={styles.media}
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                swipe.current = null;
              }}
            >
              <img
                src={image.preview}
                alt=""
                aria-hidden="true"
                className={styles.preview}
                draggable={false}
              />
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                decoding="async"
                draggable={false}
                className={styles.image}
                data-loaded={loaded || undefined}
                onLoad={() => {
                  setLoadedSource(image.src);
                  setFailedSource('');
                }}
                onError={() => setFailedSource(image.src)}
              />
              {failed && (
                <p role="status" className={styles.error}>
                  The full-size photograph could not load. The preview is shown.
                </p>
              )}
            </div>
            <figcaption
              id="lightbox-caption"
              className={styles.caption}
              aria-live="polite"
              aria-atomic="true"
            >
              <span>{description}</span>
              <span className={styles.count}>
                {index + 1} / {gallery.images.length}
              </span>
            </figcaption>
          </figure>
          {navigation('right')}
        </div>
      </div>
    </dialog>
  );
}
