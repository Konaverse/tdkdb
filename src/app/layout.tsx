import type { Metadata } from 'next';
import localFont from 'next/font/local';
import SmoothScrollProvider from '@/components/animations/SmoothScrollProvider';
import CustomCursor from '@/components/ui/CustomCursor';
import { defaultOgImage, SITE_NAME, siteOrigin } from '@/lib/seo';
import '@/styles/globals.css';

const josefin = localFont({
  src: './fonts/josefin-sans-latin.woff2',
  weight: '100 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-josefin',
});

const DEFAULT_TITLE = 'TDK Design & Build — Architects and builders in Nicosia, Cyprus';
const DEFAULT_DESCRIPTION =
  'TDK is a design-and-build studio in Nicosia. The architects who draw a residence are the same people who build it and hand over the keys. Residences in Nicosia and Limassol; Almond Suites in Strovolos is now under construction.';

/** Site-wide defaults: every page inherits the origin, the title template,
    the social card and the indexing rules, and overrides only its own copy. */
export async function generateMetadata(): Promise<Metadata> {
  const image = await defaultOgImage();
  return {
    metadataBase: new URL(siteOrigin()),
    title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: 'summary_large_image', ...(image ? { images: [image] } : {}) },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${josefin.variable} ${josefin.className}`}>
      <head>
        {/* Every photograph comes from Sanity's CDN; open the connection early. */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
      </head>
      <body>
        <noscript>
          <style>
            {'[data-hero-copy], [data-image-entrance] { visibility: visible !important; }'}
          </style>
        </noscript>
        <CustomCursor />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
