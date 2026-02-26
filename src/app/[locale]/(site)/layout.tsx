import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// NOTE: HOME_RE suppression lives here once Phase 4 (HomepageCanvas) is built.
// The canvas experience manages its own nav/footer — restore the client-side
// pathname check and remove Navbar/Footer from the homepage at that point.

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
