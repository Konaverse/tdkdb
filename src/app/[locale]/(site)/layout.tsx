'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
