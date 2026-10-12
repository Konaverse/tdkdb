import type { Metadata } from 'next';
import { Josefin_Sans } from 'next/font/google';
import SmoothScrollProvider from '@/components/animations/SmoothScrollProvider';
import CustomCursor from '@/components/ui/CustomCursor';
import '@/styles/globals.css';

const josefin = Josefin_Sans({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '600'],
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
    <html lang="en" className={josefin.variable}>
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
