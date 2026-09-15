import type { Project } from '@/lib/sanity/types';

/** Display names where the CMS title is shorter than the one the boards
    carry. Rename the title in Sanity to retire an entry. */
const DISPLAY_TITLES: Record<string, string> = {
  armonia: 'Armonia Apartments',
};

export const STATUS_LABEL: Record<Project['status'], string> = {
  upcoming: 'Upcoming',
  'in-progress': 'Under construction',
  completed: 'Completed',
};

export function displayTitle(p: Pick<Project, 'title' | 'slug'>): string {
  return DISPLAY_TITLES[p.slug.current] ?? p.title;
}

export function projectHref(locale: string, slug: string): string {
  return `/${locale}/projects/${slug}`;
}
