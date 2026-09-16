// src/lib/sanity/types.ts

// --- Shared Types ---

/** A Sanity image field. The URL builder takes this shape directly. */
export interface SanityImage {
  _type?: 'image';
  _key?: string;
  asset: { _ref: string; _type?: 'reference' };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

/** A photograph the design asks for by name (see the siteImage schema). */
export type SiteImages = Record<string, SanityImage | undefined>;

export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: SanityImage;
}

import type { PortableTextBlock } from '@portabletext/types';

export type { PortableTextBlock };

// --- Project ---

export interface ProjectGallery {
  heading: string;
  images: SanityImage[];
  caption?: string;
}

export interface ProjectUnit {
  floor: string;
  unitType: string;
  sizeM2: number;
  status: 'available' | 'reserved' | 'sold';
}

export interface ConstructionUpdate {
  date: string;
  imageId: string;
  caption: string;
}

export interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  status: 'upcoming' | 'in-progress' | 'completed';
  type: 'residential' | 'commercial' | 'mixed-use';
  ctaType: 'showcase' | 'register-interest' | 'contact';
  location: string;
  year: number;
  heroImage: SanityImage;
  // Homepage horizontal reel
  homepageIntro?: string;
  homepageParagraphMid?: string;
  homepageParagraphClose?: string;
  homepageGridImage?: SanityImage;
  homepagePortraitImage?: SanityImage;
  rendersGallery?: ProjectGallery;
  photosGallery?: ProjectGallery;
  pullQuote?: string;
  description?: PortableTextBlock[]; // portableText
  features?: string[];
  specs?: { key: string; value: string }[];
  unitsHeading?: string;
  unitsNote?: string;
  units?: ProjectUnit[];
  progressPercent?: number;
  progressLabel?: string;
  constructionUpdates?: ConstructionUpdate[];
  interestFormHeading?: string;
  interestFormSubtext?: string;
  mapEmbedUrl?: string;
  neighborhoodDescription?: PortableTextBlock[]; // portableText
  relatedProjectSlugs?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  seo?: SeoMeta;
  // Multilingual (future):
  // titleEl?: string
  // pullQuoteEl?: string
  // descriptionEl?: PortableTextBlock[]
}

// --- Team Member ---

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  bio?: string;
  photo?: SanityImage;
  email?: string;
  linkedin?: string;
  order?: number;
}

// --- Site Settings ---

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  _id: string;
  companyName?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: SocialLink[];
  logo?: SanityImage;
  ogImage?: SanityImage;
  googleAnalyticsId?: string;
}
