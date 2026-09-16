import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

import { client } from './client';

/* ───────────────────────────────────────────────────────────────────────────
   Image URLs, from Sanity's own pipeline.

   Replaces the Cloudinary helpers (Sept 2026): images are uploaded in the
   Studio, beside the content they belong to, and served from Sanity's CDN.
   Same knobs as before — a width, an optional height and crop, a blur for
   placeholders — plus the editor's hotspot, which is why `fit: 'crop'` with
   `crop('focalpoint')` is the default for anything with a height: the person
   who uploads the photograph decides what must stay in frame.

   `auto('format')` gives WebP/AVIF where the browser takes it, and quality
   defaults to 75, which is Sanity's sweet spot for photography.
   ─────────────────────────────────────────────────────────────────────────── */

const builder = imageUrlBuilder(client);

export type ImageSource = SanityImageSource;

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  /** Gaussian blur, 0–100. For pre-blurred backdrops. */
  blur?: number;
}

export function imageUrl(source: ImageSource, options: ImageOptions = {}): string {
  const { width, height, quality = 75, blur } = options;

  let url = builder.image(source).auto('format').quality(quality);
  if (width) url = url.width(Math.round(width));
  if (height) url = url.height(Math.round(height));
  // A height means a crop, and a crop must respect the editor's hotspot.
  if (width && height) url = url.fit('crop').crop('focalpoint');
  if (blur) url = url.blur(blur);

  return url.url();
}

/** A width-only srcset, for images whose rendered size depends on the viewport. */
export function imageSrcSet(
  source: ImageSource,
  widths: readonly number[] = [800, 1200, 1600, 2000, 2400, 2800],
): string {
  return widths.map((w) => `${imageUrl(source, { width: w })} ${w}w`).join(', ');
}

/** A portrait at 3:4, cropped to the hotspot. */
export function portraitUrl(source: ImageSource, width: number): string {
  return imageUrl(source, { width, height: Math.round((width * 4) / 3) });
}

export function portraitSrcSet(source: ImageSource, widths: readonly number[] = [600, 900, 1200]) {
  return widths.map((w) => `${portraitUrl(source, w)} ${w}w`).join(', ');
}

/**
 * The full-bleed project hero, in a fixed ladder of widths.
 *
 * A ladder rather than an exact width so the homepage → project transition
 * and the hero it lands on ask for the SAME URL: the overlay decodes it
 * during the expansion, and the hero finds it already in the cache.
 */
export const PROJECT_HERO_WIDTHS = [1200, 1600, 2000, 2400, 2800] as const;

export function projectHeroUrl(source: ImageSource, width: number): string {
  return imageUrl(source, { width });
}

export function projectHeroSrcSet(source: ImageSource): string {
  return PROJECT_HERO_WIDTHS.map((w) => `${projectHeroUrl(source, w)} ${w}w`).join(', ');
}

/** The smallest rung that covers `devicePx`, or the largest. */
export function projectHeroWidthFor(devicePx: number): number {
  return (
    PROJECT_HERO_WIDTHS.find((w) => w >= devicePx) ??
    PROJECT_HERO_WIDTHS[PROJECT_HERO_WIDTHS.length - 1]
  );
}

/**
 * A full-bleed atmospheric wash sitting behind a composition at low opacity.
 * Small and pre-blurred on purpose: a CSS `filter: blur()` across a viewport
 * is a live GPU pass, and these sit inside scrubbed sections where that cost
 * is paid every frame. Baked into a ~1400px asset it costs nothing at runtime.
 */
export function backdropUrl(source: ImageSource): string {
  return imageUrl(source, { width: 1400, quality: 60, blur: 60 });
}

export function ogImageUrl(source: ImageSource): string {
  return imageUrl(source, { width: 1200, height: 630 });
}
