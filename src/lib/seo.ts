import type { Metadata } from 'next';

import { displayTitle, projectScope, STATUS_LABEL } from '@/lib/projects/display';
import { imageUrl, ogImageUrl } from '@/lib/sanity/image';
import { getSiteSettings } from '@/lib/sanity/queries';
import type { PortableTextBlock, Project, SiteSettings } from '@/lib/sanity/types';

/* ───────────────────────────────────────────────────────────────────────────
   Technical SEO helpers: one origin, one way to build a page's metadata, and
   the structured data the site publishes. Copy stays in the pages; this file
   only knows URLs and shapes.
   ─────────────────────────────────────────────────────────────────────────── */

import { absoluteUrl, siteOrigin } from '@/lib/site-origin';

export { absoluteUrl, siteOrigin };

export const SITE_NAME = 'TDK Design & Build';
export const DEFAULT_LOCALE = 'en';

interface PageMeta {
  /** A plain title takes the root template; `{ absolute }` is used as written. */
  title: string | { absolute: string };
  description: string;
  /** Site-relative path of the canonical URL, e.g. `/en/about`. */
  path: string;
  /** Absolute 1200×630 image for social cards; the root default otherwise. */
  image?: string;
  noIndex?: boolean;
}

/** Title, description, canonical and social cards for one page. Open Graph
    and Twitter titles/descriptions inherit from the page's own. Next replaces
    a page's whole `openGraph` object rather than merging it with the root's,
    so the site name, locale and image are repeated here on purpose. */
export function pageMetadata({ title, description, path, image, noIndex }: PageMeta): Metadata {
  const url = absoluteUrl(path);
  const images = image ? [{ url: image, width: 1200, height: 630 }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_GB',
      ...(images ? { images } : {}),
    },
    twitter: { card: 'summary_large_image', ...(image ? { images: [image] } : {}) },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** The Site Settings share image, sized for social cards. */
export async function defaultOgImage(): Promise<string | undefined> {
  const settings = await getSiteSettings();
  return settings?.ogImage?.asset ? ogImageUrl(settings.ogImage) : undefined;
}

/** pageMetadata for a page without a picture of its own: the site's default
    share image is fetched and attached. Use from `generateMetadata`. */
export async function buildMetadata(meta: PageMeta): Promise<Metadata> {
  return pageMetadata({ ...meta, image: meta.image ?? (await defaultOgImage()) });
}

/** Plain text out of Portable Text blocks, paragraphs joined by a space. */
export function plainText(blocks: PortableTextBlock[] = []): string {
  return blocks
    .filter((b) => b._type === 'block' && Array.isArray(b.children))
    .map((b) => (b.children as { text?: string }[]).map((c) => c.text ?? '').join(''))
    .map((t) => t.trim())
    .filter(Boolean)
    .join(' ');
}

/** Cut at a word boundary with an ellipsis; search engines show ~155 chars. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).replace(/[,;:–—-]$/, '')}…`;
}

/** A description for a project page when the CMS carries none: the project's
    own text first, otherwise its facts. */
export function projectDescription(project: Project): string {
  const title = displayTitle(project);
  const text = plainText(project.description);
  if (text) return truncate(text);
  const made = projectScope(project) === 'design-build' ? 'Designed and built' : 'Designed';
  return `${title} in ${project.location}, ${STATUS_LABEL[project.status].toLowerCase()}. ${made} by ${SITE_NAME}, a design-and-build studio in Nicosia, Cyprus.`;
}

export function projectOgImage(project: Project): string | undefined {
  return project.heroImage?.asset ? ogImageUrl(project.heroImage) : undefined;
}

/* ── Structured data ─────────────────────────────────────────────────────── */

export type JsonLd = Record<string, unknown>;

/** The studio, as schema.org sees it: an organization that designs and builds
    homes. Contact details come from Site Settings, never from code. */
export function organizationJsonLd(settings: SiteSettings | null): JsonLd {
  const sameAs = (settings?.socialLinks ?? []).map((s) => s.url).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'HomeAndConstructionBusiness'],
    '@id': `${siteOrigin()}/#organization`,
    name: SITE_NAME,
    url: absoluteUrl(`/${DEFAULT_LOCALE}`),
    ...(settings?.logo?.asset ? { logo: imageUrl(settings.logo, { width: 512 }) } : {}),
    ...(settings?.ogImage?.asset ? { image: ogImageUrl(settings.ogImage) } : {}),
    ...(settings?.tagline ? { slogan: settings.tagline } : {}),
    ...(settings?.email ? { email: settings.email } : {}),
    ...(settings?.phone ? { telephone: settings.phone } : {}),
    ...(settings?.address ? { address: settings.address } : {}),
    areaServed: 'Cyprus',
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function breadcrumbsJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Serialized for an inline script: `<` is escaped so content can never
    close the tag. */
export function jsonLdString(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
