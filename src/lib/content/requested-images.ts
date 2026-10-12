import assets from './requested-images.json';
import type { SanityImage } from '@/lib/sanity/types';

/** User-requested images, optimized from the original TDK files. */
export interface RequestedImage {
  key: string;
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  caption: string;
  image?: SanityImage;
}

export const ALMOND_INTERIORS: RequestedImage[] = assets.filter((asset) =>
  asset.key.startsWith('almond-'),
);
export const PROCESS_IMAGES: Record<'build' | 'draw' | 'handover', RequestedImage> = {
  build: assets.find((asset) => asset.key === 'process-build')!,
  draw: assets.find((asset) => asset.key === 'process-draw')!,
  handover: assets.find((asset) => asset.key === 'process-handover')!,
};
