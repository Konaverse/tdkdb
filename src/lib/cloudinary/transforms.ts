const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'scale';
  /** Where to crop from. `auto` lets Cloudinary find the subject. */
  gravity?: 'auto' | 'face' | 'auto:face' | 'center';
  /** Raw Cloudinary effect tokens, e.g. `['e_blur:200']`. Applied last. */
  effects?: string[];
}

export function cloudinaryUrl(publicId: string, options: CloudinaryOptions = {}): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity,
    effects,
  } = options;

  const transforms = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    (width || height) && `c_${crop}`,
    gravity && `g_${gravity}`,
    ...(effects ?? []),
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function heroImage(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1920 });
}

/**
 * The project page's full-bleed hero, in a fixed ladder of widths.
 *
 * A ladder rather than an exact width so the homepage → project transition and
 * the hero it lands on ask for the SAME URL: the overlay decodes it during the
 * expansion, and the hero finds it already in the cache. Width only, so every
 * rung keeps the source's aspect ratio.
 */
export const PROJECT_HERO_WIDTHS = [1200, 1600, 2000, 2400, 2800] as const;

export function projectHeroUrl(publicId: string, width: number): string {
  return cloudinaryUrl(publicId, { width });
}

export function projectHeroSrcSet(publicId: string): string {
  return PROJECT_HERO_WIDTHS.map((w) => `${projectHeroUrl(publicId, w)} ${w}w`).join(', ');
}

/** The smallest rung that covers `devicePx`, or the largest. */
export function projectHeroWidthFor(devicePx: number): number {
  return (
    PROJECT_HERO_WIDTHS.find((w) => w >= devicePx) ??
    PROJECT_HERO_WIDTHS[PROJECT_HERO_WIDTHS.length - 1]
  );
}

/** A width-only srcset, for images whose rendered size depends on the viewport. */
export function responsiveSrcSet(
  publicId: string,
  widths: readonly number[] = [800, 1200, 1600, 2000, 2400, 2800],
): string {
  return widths.map((w) => `${cloudinaryUrl(publicId, { width: w })} ${w}w`).join(', ');
}

export function projectCard(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 800, height: 600 });
}

export function galleryImage(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1400 });
}

export function constructionPhoto(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1000 });
}

/**
 * A team portrait at 3:4, cropped by Cloudinary rather than by CSS: these are
 * ordinary photographs (a wide shot at a ceremony, a selfie indoors), so a
 * centred CSS crop loses the person. `g_auto` finds the subject.
 */
export function portraitUrl(publicId: string, width: number): string {
  return cloudinaryUrl(publicId, {
    width,
    height: Math.round((width * 4) / 3),
    crop: 'fill',
    gravity: 'auto',
  });
}

export function portraitSrcSet(publicId: string, widths = [600, 900, 1200]): string {
  return widths.map((w) => `${portraitUrl(publicId, w)} ${w}w`).join(', ');
}

export function teamPhoto(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 400, height: 400 });
}

export function ogImage(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1200, height: 630 });
}

/**
 * Full-bleed atmospheric wash sitting behind a composition at low opacity.
 *
 * Small and pre-blurred by Cloudinary on purpose: a CSS `filter: blur()` across
 * a whole viewport is a live GPU pass, and these sit inside a pinned, scrubbed
 * section where that cost is paid on every frame. Baking it into a ~1100px
 * asset costs nothing at runtime, and the upscale to full bleed softens it
 * further for free.
 */
export function backdropImage(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1400, quality: 60, effects: ['e_blur:100'] });
}

// cloudinaryUrl test (uncomment to verify):
// console.log(heroImage('clients/tdkdb/armonia/exterior/hero'))
// Expected: https://res.cloudinary.com/[cloud]/image/upload/w_1920,q_auto,f_auto,c_fill/clients/tdkdb/armonia/exterior/hero
