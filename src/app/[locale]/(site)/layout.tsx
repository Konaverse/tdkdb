import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NavGuard from '@/components/layout/NavGuard';
import IntroProvider from '@/components/homepage/IntroProvider';
import ProjectTransitionProvider from '@/components/transition/ProjectTransition';
import ImageLightboxProvider from '@/components/ui/ImageLightbox';
import AttributionCapture from '@/components/contact/AttributionCapture';
import JsonLd from '@/components/seo/JsonLd';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import CookieBanner from '@/components/consent/CookieBanner';
import MetaPixel from '@/components/analytics/MetaPixel';
import { getSiteSettings } from '@/lib/sanity/queries';
import { organizationJsonLd } from '@/lib/seo';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <ConsentProvider>
      <IntroProvider>
        <AttributionCapture />
        <JsonLd data={organizationJsonLd(settings)} />
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
        {/* Consent-gated: nothing from Meta loads until the banner's Accept. */}
        <MetaPixel />
        <CookieBanner />
      </IntroProvider>
    </ConsentProvider>
  );
}
