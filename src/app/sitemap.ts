import type { MetadataRoute } from 'next';

import { getAllProjects } from '@/lib/sanity/queries';
import { absoluteUrl, DEFAULT_LOCALE } from '@/lib/seo';

/** Every indexable page: the four site pages and each project. Legal stubs
    are noindexed and stay out until their documents are published. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getAllProjects();
  const page = (path: string) => absoluteUrl(`/${DEFAULT_LOCALE}${path}`);

  return [
    { url: page(''), changeFrequency: 'weekly', priority: 1 },
    { url: page('/projects'), changeFrequency: 'weekly', priority: 0.8 },
    { url: page('/about'), changeFrequency: 'monthly', priority: 0.6 },
    { url: page('/contact'), changeFrequency: 'monthly', priority: 0.6 },
    ...projects.map((project) => ({
      url: page(`/projects/${project.slug.current}`),
      ...(project._updatedAt ? { lastModified: new Date(project._updatedAt) } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
