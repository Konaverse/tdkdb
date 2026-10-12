import type { Metadata } from 'next';
import localFont from 'next/font/local';
import SmoothScrollProvider from '@/components/animations/SmoothScrollProvider';
import CustomCursor from '@/components/ui/CustomCursor';
import '@/styles/globals.css';

const josefin = localFont({
  src: './fonts/josefin-sans-latin.woff2',
  weight: '100 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-josefin',
});

export const metadata: Metadata = {
  title: 'TDK Design & Build',
  description: 'TDK Design & Build website',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${josefin.variable} ${josefin.className}`}>
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
