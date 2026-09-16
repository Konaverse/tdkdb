import type { Project, ProjectUnit, SanityImage } from '@/lib/sanity/types';

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

/**
 * The images for the project page's scroll scenes, exactly `count` of them.
 * The galleries first, de-duplicated and without the hero (the page opens on
 * it); the hero only when the galleries run short; then round again.
 */
export function sceneImages(
  p: Pick<Project, 'heroImage' | 'rendersGallery' | 'photosGallery'>,
  count: number,
): SanityImage[] {
  const pool: SanityImage[] = [];
  const assetOf = (img?: SanityImage) => img?.asset?._ref;
  const add = (img?: SanityImage) => {
    if (!img?.asset?._ref) return;
    if (pool.some((p) => assetOf(p) === assetOf(img))) return;
    pool.push(img);
  };
  [...(p.rendersGallery?.images ?? []), ...(p.photosGallery?.images ?? [])]
    .filter((img) => assetOf(img) !== assetOf(p.heroImage))
    .forEach(add);
  if (pool.length < count) add(p.heroImage);
  if (!pool.length) return [];
  return Array.from({ length: count }, (_, i) => pool[i % pool.length]);
}

/** "1-Bed" → "1 bedroom" ("1 bed" short), "2-Bed" → "2 bedrooms"; anything
    else as written. */
export function bedroomsLabel(unitType: string, short = false): string {
  const m = /^(\d+)\s*-?\s*bed/i.exec(unitType);
  if (!m) return unitType;
  const n = Number(m[1]);
  return short ? `${n} bed` : `${n} bedroom${n === 1 ? '' : 's'}`;
}

const ORDINALS = ['Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

/** Unit "203" sits on the second floor. Non-numeric unit names have no floor. */
export function floorLabel(unit: Pick<ProjectUnit, 'floor'>): string | null {
  if (!/^\d{3,}$/.test(unit.floor)) return null;
  const n = Math.floor(Number(unit.floor) / 100);
  return ORDINALS[n] ?? `Floor ${n}`;
}

export const UNIT_STATUS_LABEL: Record<ProjectUnit['status'], string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
};
