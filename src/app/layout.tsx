import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
