// src/lib/sanity/types.ts

// --- Shared Types ---

export interface SeoMeta {
  title: string;
  description: string;
  ogImageId?: string;
}

export interface PortableTextBlock {
  _type: string;
  style?: string;
  children?: unknown[];
  [key: string]: unknown;
}

// --- Project ---

export interface ProjectGallery {
  heading: string;
  images: string[];
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
  heroImageId: string;
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

// --- Category ---

export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
}

// --- Team Member ---

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  bio?: string;
  photoId?: string; // Cloudinary ID
  email?: string;
  linkedin?: string;
  order?: number;
}

// --- Insight ---

export interface Insight {
  _id: string;
  title: string;
  slug: { current: string };
  author?: TeamMember; // Reference populated via query
  publishDate?: string; // datetime ISO string
  category?: Category; // Reference populated via query
  excerpt?: string;
  heroImageId?: string; // Cloudinary ID
  body?: PortableTextBlock[]; // portableText
  seo?: SeoMeta;
  relatedInsightSlugs?: string[];
  // Multilingual (future):
  // titleEl?: string
  // bodyEl?: PortableTextBlock[]
}

// --- Service ---

export interface ServiceProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface ServiceFAQItem {
  question: string;
  answer: PortableTextBlock[];
}

export interface Service {
  _id: string;
  title: string;
  slug: { current: string };
  shortDescription?: string;
  fullDescription?: PortableTextBlock[];
  heroImageId?: string; // Cloudinary ID
  process?: ServiceProcessStep[];
  faq?: ServiceFAQItem[];
  relatedProjectSlugs?: string[];
  seo?: SeoMeta;
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
  logoId?: string; // Cloudinary ID
  ogImageId?: string; // Cloudinary ID
  googleAnalyticsId?: string;
}
