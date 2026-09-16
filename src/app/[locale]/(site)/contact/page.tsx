import type { Metadata } from 'next';
import ContactClient from './ContactClient';

import { getSiteImages, getSiteSettings } from '@/lib/sanity/queries';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Contact | TDK Design & Build',
  description:
    'Write to TDK Design & Build in Nicosia — about a new home, a residence under construction, or a question for the studio.',
};

export default async function ContactPage() {
  const [settings, images] = await Promise.all([getSiteSettings(), getSiteImages()]);

  return <ContactClient settings={settings} plate={images['contact-plate']} />;
}
