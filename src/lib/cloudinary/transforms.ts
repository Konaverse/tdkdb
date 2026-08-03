const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'scale';
  /** Raw Cloudinary effect tokens, e.g. `['e_blur:200']`. Applied last. */
  effects?: string[];
}

export function cloudinaryUrl(publicId: string, options: CloudinaryOptions = {}): string {
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill', effects } = options;

  const transforms = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    (width || height) && `c_${crop}`,
    ...(effects ?? []),
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function heroImage(publicId: string): string {
  return cloudinaryUrl(publicId, { width: 1920 });
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
