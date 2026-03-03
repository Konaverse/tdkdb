import FooterClient from './FooterClient';
import { getSiteSettings } from '@/lib/sanity/queries';

export default async function Footer() {
  const settings = await getSiteSettings();
  return <FooterClient settings={settings} />;
}
