// src/lib/sanity/queries.ts
import { client } from './client';
import type { Project, SiteSettings, TeamMember } from './types';

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

/** The projects hub: everything the index entries state, counts included. */
export async function getProjectsForIndex(): Promise<Project[]> {
  const query = `*[_type == 'project'] | order(year desc) {
    _id, title, slug, status, type, ctaType, location, year, heroImageId, pullQuote,
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
    _id, title, slug, status, type, ctaType, location, year, heroImageId,
    features,
    homepageIntro, homepageParagraphMid, homepageParagraphClose,
    homepageGridImageId, homepagePortraitImageId
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

// --- TEAM QUERIES ---

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  const query = `*[_type == 'teamMember'] | order(order asc, name asc) {
    _id, name, role, bio, photoId, email, linkedin, order
  }`;

  try {
    const data = await client.fetch<TeamMember[]>(query);
    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}
