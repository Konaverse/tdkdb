// src/lib/sanity/queries.ts
import { client } from './client';
import type { Project, SiteImages, SiteSettings, TeamMember } from './types';

// --- PROJECT QUERIES ---

export async function getAllProjects(): Promise<Project[]> {
  const query = `*[_type == 'project'] | order(year desc) {
    _id, title, slug, status, type, ctaType, location, year, heroImage, seo
  }`;

  try {
    const data = await client.fetch<Project[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }
}

/** The projects hub: everything the index entries state, counts included. */
export async function getProjectsForIndex(): Promise<Project[]> {
  const query = `*[_type == 'project'] | order(year desc) {
    _id, title, slug, status, type, ctaType, location, year, heroImage, pullQuote,
    units[] { floor, unitType, sizeM2, status }
  }`;

  try {
    const data = await client.fetch<Project[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching projects for index:', error);
    return [];
  }
}

export async function getProjectsForHomepageReel(): Promise<Project[]> {
  const query = `*[_type == 'project'] | order(year desc) [0...5] {
    _id, title, slug, status, type, ctaType, location, year, heroImage,
    features,
    homepageIntro, homepageParagraphMid, homepageParagraphClose,
    homepageGridImage, homepagePortraitImage
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
    heroImage,
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

// --- GENERAL QUERIES ---

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const query = `*[_type == 'siteSettings'][0] {
    _id, companyName, tagline, address, phone, email,
    socialLinks[] { platform, url },
    logo, ogImage, googleAnalyticsId
  }`;

  try {
    const data = await client.fetch<SiteSettings | null>(query);
    return data || null;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

/**
 * The photographs the design asks for by name, as a map: `images['about-hero']`.
 * One query per page that needs them; a missing key renders nothing rather
 * than breaking the page.
 */
export async function getSiteImages(): Promise<SiteImages> {
  const query = `*[_type == 'siteImage']{ 'key': key.current, image }`;

  try {
    const rows = await client.fetch<{ key: string; image: SiteImages[string] }[]>(query);
    return Object.fromEntries((rows || []).map((r) => [r.key, r.image]));
  } catch (error) {
    console.error('Error fetching site images:', error);
    return {};
  }
}

// --- TEAM QUERIES ---

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const query = `*[_type == 'teamMember'] | order(order asc, name asc) {
    _id, name, role, bio, photo, email, linkedin, order
  }`;

  try {
    const data = await client.fetch<TeamMember[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}
