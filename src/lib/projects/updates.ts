import type { Project } from '@/lib/sanity/types';

export const ALMOND_SLUG = 'almond-suites';
export const ALMOND_SPECIFICATIONS_HREF = '/documents/almond-suites-technical-specifications.pdf';

/**
 * Confirmed sales updates for launch, shared by every project query.
 * Keep these here until the same facts have been saved in Sanity.
 */
export function applyProjectUpdates(project: Project): Project {
  if (project.slug.current !== ALMOND_SLUG) return project;

  return {
    ...project,
    progressPercent: 65,
    progressLabel: 'Under construction',
    technicalSpecificationsHref: ALMOND_SPECIFICATIONS_HREF,
    units: project.units?.map((unit) =>
      ['102', '104'].includes(unit.floor.trim()) ? { ...unit, status: 'sold' } : unit,
    ),
  };
}
