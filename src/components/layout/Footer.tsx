import FooterClient from './FooterClient';
import { getSiteImages, getSiteSettings } from '@/lib/sanity/queries';

export default async function Footer() {
  const [settings, images] = await Promise.all([getSiteSettings(), getSiteImages()]);
  return <FooterClient settings={settings} backdrop={images['footer-backdrop']} />;
}
