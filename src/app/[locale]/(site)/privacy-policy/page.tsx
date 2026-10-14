import type { Metadata } from 'next';

import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import { getSiteSettings } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Privacy and cookies',
    description:
      'What the TDK Design & Build website collects, why, who receives it, how Meta Pixel and the Conversions API are used with your consent, and how to withdraw it.',
    path: '/en/privacy-policy',
  });
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  return <PrivacyPolicy settings={settings} />;
}
