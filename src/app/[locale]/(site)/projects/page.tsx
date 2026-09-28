import type { Metadata } from 'next';
import ProjectsClient from './ProjectsClient';

import { getProjectsForIndex } from '@/lib/sanity/queries';

export const revalidate = 60; // ISR cache revalidation

export const metadata: Metadata = {
  title: 'Projects | TDK Design & Build',
  description:
    'The residences TDK Design & Build has drawn and built, and the houses it has drawn for others to build — completed, under construction, and what is available now.',
};

export default async function ProjectsPage() {
  const projects = await getProjectsForIndex();

  return <ProjectsClient projects={projects} />;
}
