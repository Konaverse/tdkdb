import NavbarClient from './NavbarClient';
import { getSiteSettings } from '@/lib/sanity/queries';

export default async function Navbar() {
  const settings = await getSiteSettings();
  return <NavbarClient settings={settings} />;
}
