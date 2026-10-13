import type { Metadata } from 'next';

import AboutClient from './AboutClient';
import { getSiteImages } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'About',
    description:
      'TDK Design & Build is a family studio in Nicosia. The architect who draws a residence and the manager who builds it work under one roof — and hand over the keys.',
    path: '/en/about',
  });
}

export default async function AboutPage() {
  const images = await getSiteImages();

  return <AboutClient images={images} />;
}
