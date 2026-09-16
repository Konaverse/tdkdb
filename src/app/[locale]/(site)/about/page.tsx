import type { Metadata } from 'next';

import AboutClient from './AboutClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About | TDK Design & Build',
  description:
    'TDK Design & Build is a family studio in Nicosia. The architect who draws a residence and the manager who builds it work under one roof — and hand over the keys.',
};

export default function AboutPage() {
  return <AboutClient />;
}
