import type { SanityImage } from '@/lib/sanity/types';

const INTERIORS: Record<string, string> = {
  a6db7c7d8add950c48b6c1b1fa51ae83eb3769d8: 'Apartment interior · living room',
  a5941cc33bd1d484f409a9c401d45ab07e19b0cb: 'Apartment interior · kitchen and dining',
  '73785ea3e6902ffd7d9deaebbb4ebead114296ac': 'Apartment interior · main bedroom',
  c384bfeb12d5bbe7a1bb756d95cc8d89f959c0c6: 'Apartment interior · second bedroom',
  c60ad8b406b1d3888790948b74d7641328b45a9f: 'Apartment terrace',
};

export function imageCaption(image: SanityImage, fallback: string): string {
  return (
    image.caption?.trim() ||
    image.alt?.trim() ||
    INTERIORS[image.asset._ref.split('-')[1]] ||
    fallback
  );
}
