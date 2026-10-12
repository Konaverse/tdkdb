import FooterClient from './FooterClient';
import { getSiteSettings } from '@/lib/sanity/queries';
import footerBackdrop from '../../../public/images/footer-modular-sunset.jpg';

export default async function Footer() {
  const settings = await getSiteSettings();
  return <FooterClient settings={settings} backdrop={footerBackdrop} />;
}
