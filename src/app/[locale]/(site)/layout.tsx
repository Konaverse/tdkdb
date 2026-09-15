import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NavGuard from '@/components/layout/NavGuard';
import IntroProvider from '@/components/homepage/IntroProvider';
import ProjectTransitionProvider from '@/components/transition/ProjectTransition';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntroProvider>
      <ProjectTransitionProvider>
        <NavGuard>
          <Navbar />
        </NavGuard>

        {children}

        <NavGuard>
          <Footer />
        </NavGuard>
      </ProjectTransitionProvider>
    </IntroProvider>
  );
}
