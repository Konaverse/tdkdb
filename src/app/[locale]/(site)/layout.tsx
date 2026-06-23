import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NavGuard from '@/components/layout/NavGuard';
import IntroProvider from '@/components/homepage/IntroProvider';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntroProvider>
      <NavGuard>
        <Navbar />
      </NavGuard>

      {children}

      <NavGuard>
        <Footer />
      </NavGuard>
    </IntroProvider>
  );
}
