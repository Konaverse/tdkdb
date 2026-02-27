import type { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'Projects | TDK Design & Build',
  description:
    'A curated portfolio of residential and commercial projects across Cyprus — from completed developments to upcoming opportunities.',
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
