// src/lib/sanity/queries.ts
import { client } from './client';
import type { Project, Insight, Service, SiteSettings } from './types';

// --- PROJECT QUERIES ---

export async function getAllProjects(): Promise<Project[]> {
  const query = `*[_type == 'project'] | order(year desc) {
    _id, title, slug, status, type, ctaType, location, year, heroImageId, seo
  }`;

  try {
    const data = await client.fetch<Project[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }
}

export async function getProjectsForHomepageReel(): Promise<Project[]> {
  const query = `*[_type == 'project' && status != 'upcoming'] | order(year desc) [0...5] {
    _id, title, slug, status, ctaType, location, year, heroImageId
  }`;

  try {
    const data = await client.fetch<Project[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching homepage projects:', error);
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const query = `*[_type == 'project' && slug.current == $slug][0] {
    _id, title, slug, status, type, ctaType, location, year,
    heroImageId,
    rendersGallery { heading, images, caption },
    photosGallery { heading, images, caption },
    pullQuote, description, features, specs,
    unitsHeading, unitsNote,
    units[] { floor, unitType, sizeM2, status },
    progressPercent, progressLabel,
    constructionUpdates[] { date, imageId, caption },
    interestFormHeading, interestFormSubtext,
    mapEmbedUrl, neighborhoodDescription,
    relatedProjectSlugs,
    ctaLabel, ctaHref, seo
  }`;

  try {
    const data = await client.fetch<Project | null>(query, { slug });
    return data || null;
  } catch (error) {
    console.error(`Error fetching project by slug (${slug}):`, error);
    return null;
  }
}

// --- INSIGHT QUERIES ---

export async function getAllInsights(limit?: number): Promise<Insight[]> {
  // If limit is provided, append a slice operator [0...limit]
  const limitClause = limit ? `[0...${limit}]` : '';
  const query = `*[_type == 'insight'] | order(publishDate desc)${limitClause} {
    _id, title, slug, publishDate, excerpt, heroImageId, seo,
    author-> { _id, name, role, photoId },
    category-> { _id, title, slug }
  }`;

  try {
    const data = await client.fetch<Insight[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching all insights:', error);
    return [];
  }
}

export async function getInsightBySlug(slug: string): Promise<Insight | null> {
  const query = `*[_type == 'insight' && slug.current == $slug][0] {
    _id, title, slug, publishDate, excerpt, heroImageId, body, seo, relatedInsightSlugs,
    author-> { _id, name, role, bio, photoId, email, linkedin },
    category-> { _id, title, slug, description }
  }`;

  try {
    const data = await client.fetch<Insight | null>(query, { slug });
    return data || null;
  } catch (error) {
    console.error(`Error fetching insight by slug (${slug}):`, error);
    return null;
  }
}

export async function getRelatedInsights(
  currentSlug: string,
  categoryId: string,
  limit: number = 3,
): Promise<Insight[]> {
  // Fetch insights in the same category, excluding the current one
  const query = `*[_type == 'insight' && references($categoryId) && slug.current != $currentSlug] | order(publishDate desc) [0...$limit] {
    _id, title, slug, publishDate, excerpt, heroImageId,
    category-> { _id, title, slug }
  }`;

  try {
    const data = await client.fetch<Insight[]>(query, { currentSlug, categoryId, limit });
    return data || [];
  } catch (error) {
    console.error(`Error fetching related insights:`, error);
    return [];
  }
}

// --- SERVICE QUERIES ---

export async function getAllServices(): Promise<Service[]> {
  const query = `*[_type == 'service'] | order(title asc) {
    _id, title, slug, shortDescription, heroImageId, seo
  }`;

  try {
    const data = await client.fetch<Service[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching all services:', error);
    return [];
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const query = `*[_type == 'service' && slug.current == $slug][0] {
    _id, title, slug, shortDescription, fullDescription, heroImageId,
    process[] { step, title, description },
    faq[] { question, answer },
    relatedProjectSlugs, seo
  }`;

  try {
    const data = await client.fetch<Service | null>(query, { slug });
    return data || null;
  } catch (error) {
    console.error(`Error fetching service by slug (${slug}):`, error);
    return null;
  }
}

// --- GENERAL QUERIES ---

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const query = `*[_type == 'siteSettings'][0] {
    _id, companyName, tagline, address, phone, email,
    socialLinks[] { platform, url },
    logoId, ogImageId, googleAnalyticsId
  }`;

  try {
    const data = await client.fetch<SiteSettings | null>(query);
    return data || null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}
