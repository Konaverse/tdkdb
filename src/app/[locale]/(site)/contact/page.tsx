import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact | TDK Design & Build',
  description:
    'Get in touch with TDK Design & Build to discuss your next project. Architecture, construction, and interior design in Cyprus.',
};

export default function ContactPage() {
  return <ContactClient />;
}
