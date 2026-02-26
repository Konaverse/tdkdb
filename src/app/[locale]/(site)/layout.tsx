'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Matches /en and /el (with or without trailing slash) — the homepage
// which manages its own nav/footer within the cinematic scroll experience.
const HOME_RE = /^\/(en|el)\/?$/;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = HOME_RE.test(pathname);

  return (
    <>
      {!isHomepage && <Navbar />}
      {children}
      {!isHomepage && <Footer />}
    </>
  );
}
