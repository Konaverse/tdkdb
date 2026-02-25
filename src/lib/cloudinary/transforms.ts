const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'fit' | 'scale';
}

export function cloudinaryUrl(publicId: string, options: CloudinaryOptions = {}): string {
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options;

  const transforms = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    (width || height) && `c_${crop}`,
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

// cloudinaryUrl test (uncomment to verify):
// console.log(heroImage('clients/tdkdb/armonia/exterior/hero'))
// Expected: https://res.cloudinary.com/[cloud]/image/upload/w_1920,q_auto,f_auto,c_fill/clients/tdkdb/armonia/exterior/hero
