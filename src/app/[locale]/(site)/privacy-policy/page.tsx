import type { Metadata } from 'next';

import LegalPlaceholder from '@/components/legal/LegalPlaceholder';
import { getSiteSettings } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Privacy policy',
    description: 'How TDK Design & Build handles the details you share with the studio.',
    path: '/en/privacy-policy',
    noIndex: true,
  });
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  return <LegalPlaceholder title="Privacy policy" email={settings?.email} />;
}
