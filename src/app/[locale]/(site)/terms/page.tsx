import type { Metadata } from 'next';

import LegalPlaceholder from '@/components/legal/LegalPlaceholder';
import { getSiteSettings } from '@/lib/sanity/queries';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Terms of use',
    description: 'The terms under which the TDK Design & Build website is offered.',
    path: '/en/terms',
    noIndex: true,
  });
}

export default async function TermsPage() {
  const settings = await getSiteSettings();
  return <LegalPlaceholder title="Terms of use" email={settings?.email} />;
}
