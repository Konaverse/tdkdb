import type { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

import { getAllProjects } from '@/lib/sanity/queries';

export const revalidate = 60; // ISR cache revalidation

export const metadata: Metadata = {
  title: 'Projects | TDK Design & Build',
  description:
    'A curated portfolio of residential and commercial projects across Cyprus — from completed developments to upcoming opportunities.',
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();

  return <ProjectsClient projects={projects} />;
}
