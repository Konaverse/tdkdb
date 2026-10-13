import type { Metadata } from 'next';
import ContactClient from './ContactClient';

import { getSiteImages, getSiteSettings } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Contact',
    description:
      'Write to TDK Design & Build in Nicosia — about a new home, a residence under construction, or a question for the studio.',
    path: '/en/contact',
  });
}

export default async function ContactPage() {
  const [settings, images] = await Promise.all([getSiteSettings(), getSiteImages()]);

  return <ContactClient settings={settings} plate={images['contact-plate']} />;
}
