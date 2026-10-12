import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NavGuard from '@/components/layout/NavGuard';
import IntroProvider from '@/components/homepage/IntroProvider';
import ProjectTransitionProvider from '@/components/transition/ProjectTransition';
import ImageLightboxProvider from '@/components/ui/ImageLightbox';
import AttributionCapture from '@/components/contact/AttributionCapture';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <IntroProvider>
      <AttributionCapture />
      <ProjectTransitionProvider>
        <ImageLightboxProvider>
          <NavGuard>
            <Navbar />
          </NavGuard>

          {children}

          <NavGuard>
            <Footer />
          </NavGuard>
        </ImageLightboxProvider>
      </ProjectTransitionProvider>
    </IntroProvider>
  );
}
