import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NavGuard from '@/components/layout/NavGuard';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavGuard>
        <Navbar />
      </NavGuard>

      {children}

      <NavGuard>
        <Footer />
      </NavGuard>
    </>
  );
}
