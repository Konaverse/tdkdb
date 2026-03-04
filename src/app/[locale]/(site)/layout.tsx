import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Note: Nav and Footer are async Server Components. They cannot be rendered
// conditionally inside a 'use client' layout based on usePathname() without
// causing infinite fetch loops in the Next.js App Router.
// They are now rendered globally here. If the homepage needs them hidden,
// it should hide them using CSS (e.g. adding a global style or targeting their specific classes).

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
