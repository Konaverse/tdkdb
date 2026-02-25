import type { Metadata } from 'next';
import { Josefin_Sans, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

const josefin = Josefin_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
  variable: '--font-josefin',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
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
    <html lang="en" className={`${josefin.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
