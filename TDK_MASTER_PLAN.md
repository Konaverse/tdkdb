# TDK DESIGN & BUILD – WEBSITE MASTER PLAN

> **Purpose:** Single source of truth for rebuilding tdkdb.com from a basic WordPress site
> into a world-class, motion-driven architecture & development website.
> PRD for Cursor-based AI development.
>
> **Status:** 🔲 = Not started | 🟡 = In discussion | ✅ = Finalized

---

## TABLE OF CONTENTS

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Image Pipeline](#3-image-pipeline)
4. [Design Concept & Art Direction](#4-design-concept--art-direction)
5. [Branding Guidelines Kit](#5-branding-guidelines-kit)
6. [Site Structure & Information Architecture](#6-site-structure--information-architecture)
7. [Page-by-Page Blueprint](#7-page-by-page-blueprint)
8. [Motion & Animation System](#8-motion--animation-system)
9. [Responsive Design System](#9-responsive-design-system)
10. [SEO Strategy & Technical Configuration](#10-seo-strategy--technical-configuration)
11. [Content Strategy & Copywriting Direction](#11-content-strategy--copywriting-direction)
12. [Sanity CMS Architecture](#12-sanity-cms-architecture)
13. [Analytics & Tracking Setup](#13-analytics--tracking-setup)
14. [Performance & Core Web Vitals](#14-performance--core-web-vitals)
15. [Email & Contact System](#15-email--contact-system)
16. [Deployment & Hosting](#16-deployment--hosting)
17. [Domain, DNS & Migration Plan](#17-domain-dns--migration-plan)
18. [Accessibility (a11y)](#18-accessibility-a11y)
19. [Multilingual Strategy](#19-multilingual-strategy)
20. [Project Phases & Timeline](#20-project-phases--timeline)
21. [Cursor AI Development Guidelines](#21-cursor-ai-development-guidelines)
22. [Sanity Studio — TDK Handoff Guide](#22-sanity-studio--tdk-handoff-guide-)

---

## 1. PROJECT OVERVIEW & GOALS ✅

### 1.1 About TDK Design & Build

- **What they do:** Residential development company — design, architecture, and construction
- **Location:** Nicosia, Cyprus (Nafpliou 1, Lakatameia)
- **Current projects:**
  - **Armonia Apartments** — completed, sold out. Showcase project only.
  - **Almond Project** — under construction, pre-sale active. Primary lead gen focus.
- **Target audience:** Cypriot and international homebuyers, property investors

### 1.2 Why the Rebuild

- Current site is a basic WordPress.com blog-style page
- No motion, no structure, no SEO foundation
- Doesn't reflect the quality of TDK's work
- Need a site that wins clients on first impression and scales as new projects launch

### 1.3 Primary Goals

1. **Motion-first experience** — cinematic, architectural, alive
2. **Mobile-first responsiveness** — flawless on every device
3. **SEO dominance** — rank for development/architecture keywords in Cyprus (EN + EL)
4. **CMS-powered scalability** — every future project publishable without developer involvement
5. **Lead generation** — Almond pre-sale interest form, general contact, every page nudges

### 1.4 Success Metrics

- Almond "Register Interest" form submissions (primary conversion)
- General contact form submissions (primary conversion)
- Organic search traffic to project pages
- Homepage Lighthouse score > 80 desktop / > 65 mobile
- Interior pages Lighthouse score > 90 desktop

---

## 2. TECH STACK & ARCHITECTURE ✅

### 2.1 Frontend

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Animation:** GSAP + ScrollTrigger, Lenis for smooth scroll
- **Homepage visual:** HTML5 Canvas + image sequences (NOT Three.js — never)

### 2.2 CMS

- **Sanity.io** — headless CMS for all content: projects, insights, team, services, site settings
- **Sanity Studio** — embedded at `/studio`
- **Scalability principle:** Adding a new project in Sanity = automatic appearance on homepage
  reel, projects index, and its own detail page. Zero developer involvement.

### 2.3 Backend / API

- **Next.js API Routes** — form handling, email sending
- **Resend** — transactional email (contact form, Project interest form)

### 2.4 Hosting & Infrastructure

- **Vercel Pro** — deployment, edge functions. Region: fra1 (Frankfurt)
- **Domain:** tdkdb.com
- **Image CDN:** Cloudinary (agency account, `clients/tdkdb/` folder)
- **Sequence CDN:** Vercel Edge Network (static files in `/public/sequences/`)

### 2.5 Third-Party Services

| Service                  | Purpose                      | Status         |
| ------------------------ | ---------------------------- | -------------- |
| Sanity.io                | Headless CMS                 | ✅             |
| Cloudinary               | Image CDN & optimization     | ✅             |
| Resend                   | Transactional email          | ✅             |
| Google Analytics 4       | Analytics                    | ✅             |
| Google Search Console    | SEO monitoring               | ✅             |
| Vercel Analytics         | Performance monitoring       | ✅             |
| Microsoft Clarity (free) | Heatmaps & recordings        | 🟡 Recommended |
| Higgsfield AI            | Generate cinematic sequences | ✅             |

---

## 3. IMAGE PIPELINE ✅

### 3.1 Two Separate Image Systems

**System A — Cloudinary (all photography & renders)**
Used for: project hero images, gallery photos, Almond construction updates,
floor plan images, team photos, blog/insights images, service images.
Account: Kona-Verse agency Cloudinary, `clients/tdkdb/` folder.
Never mix this with the sequence files.

**System B — Vercel CDN (image sequences only)**
Used for: homepage canvas sequences (`/public/sequences/assembly/` and `/public/sequences/approach/`).
These are FFmpeg-extracted WebP frames from Higgsfield videos.
They live in `/public/` and are served as static assets by Vercel.
Do NOT upload to Cloudinary — they are too numerous and work differently.

### 3.2 Cloudinary Folder Structure

```
clients/tdkdb/
  armonia/
    exterior/
    interior/
    floor-plans/
  almond/
    renders/          ← CGI renders → rendersGallery
    construction/     ← Progress photos → photosGallery (while in-progress)
    photography/      ← Finished photos → photosGallery (when complete)
    floor-plans/
  general/
    team/
    about/
  insights/
    [article-slug]/
```

### 3.3 Cloudinary URL Utility

```typescript
// /src/lib/cloudinary/transforms.ts

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'avif';
    crop?: 'fill' | 'fit' | 'scale';
  } = {},
): string {
  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options;

  const transforms = [
    width && `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    `f_${format}`,
    (width || height) && `c_${crop}`,
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

// Standard presets:
// Hero:    cloudinaryUrl(id, { width: 1920, quality: 'auto', format: 'auto' })
// Card:    cloudinaryUrl(id, { width: 800, height: 600, crop: 'fill' })
// Gallery: cloudinaryUrl(id, { width: 1400, quality: 'auto', format: 'auto' })
// Update:  cloudinaryUrl(id, { width: 1000, quality: 'auto', format: 'auto' })
```

`f_auto` automatically serves WebP/AVIF per browser. Better than Next.js Image
for large volumes of photography because it's handled at the CDN layer.

### 3.4 Sanity Image Convention

All image fields in Sanity use a `cloudinaryId: string` field — NOT Sanity's native `image` type.

```typescript
defineField({
  name: 'heroImageId',
  title: 'Hero Image (Cloudinary ID)',
  type: 'string',
  description:
    'Upload to Cloudinary under clients/tdkdb/. Paste the public ID here.\nExample: clients/tdkdb/almond/renders/hero',
});
```

### 3.5 TDK Content Manager Workflow

1. Upload image to Cloudinary → `clients/tdkdb/[folder]/`
2. Copy the public ID (e.g., `clients/tdkdb/almond/renders/hero-exterior`)
3. Paste into the relevant Sanity field
4. Publish → site updates automatically via ISR

---

## 4. DESIGN CONCEPT & ART DIRECTION ✅

### 4.1 Philosophy

**Cinematic Architectural Minimalism.** Dark, considered, unhurried.
Every element has a reason. Motion is narrative, not decoration.

### 4.2 Color Palette

| Token               | Hex                      | Usage                          |
| ------------------- | ------------------------ | ------------------------------ |
| `--color-void`      | `#0D0D0D`                | Primary background             |
| `--color-surface`   | `#1A1A1A`                | Cards, secondary backgrounds   |
| `--color-paper`     | `#F5F0E8`                | Primary text                   |
| `--color-stone`     | `#8C8C8C`                | Secondary text, labels         |
| `--color-threshold` | `#66979f`                | Accent — ONE element at a time |
| `--color-glass`     | `rgba(255,255,255,0.04)` | Overlays                       |
| `--color-border`    | `rgba(255,255,255,0.08)` | Lines, dividers                |

### 4.3 Typography

- **Primary:** Josefin Sans (300, 400, 600) — geometric, architectural
- **Mono:** JetBrains Mono (400) — numbers, counters, step labels only
- Display weights: always 300 (Light)
- Labels: always uppercase + tracked

### 4.4 Photography Direction

- Served from Cloudinary with `f_auto,q_auto` — never raw uploads
- Style: dark, dramatic, architectural. No lifestyle shots.
- Almond construction photos: honest and progress-focused
- No stock photography anywhere

---

## 5. BRANDING GUIDELINES KIT 🟡

### 5.1 Logo

_(Confirm: SVG files needed — light and dark variants)_

### 5.2 Iconography

- Lucide React (line icons) as base
- Custom SVG only where Lucide falls short

### 5.3 Spacing & Grid

- Base unit: 8px
- Grid: 12-column
- Max content width: 1440px
- Section padding: `clamp(80px, 10vw, 160px)`

---

## 6. SITE STRUCTURE & INFORMATION ARCHITECTURE ✅

### 6.1 Sitemap

```
tdkdb.com/
├── /                            ← Cinematic homepage
├── /about
├── /services
│   ├── /services/architecture-design
│   ├── /services/construction-management
│   └── /services/interior-design
├── /projects
│   └── /projects/[slug]         ← ALL projects (Armonia, Almond, future)
│                                  One unified template, CMS-driven
├── /insights
│   └── /insights/[slug]
├── /contact
├── /privacy-policy
├── /terms
└── /sitemap.xml

Greek routes (added when TDK is ready — no hard deadline):
/el/, /el/about, /el/projects/almond, etc.
```

### 6.2 Navigation

- **Primary Nav:** Home · About · Services · Projects · Insights · Contact
- **Language switcher:** EN | EL — EL present but disabled until Greek is ready
- **Mobile Nav:** Full-screen overlay, staggered reveal
- **Footer Nav:** Full sitemap + social links + contact info

### 6.3 URL Strategy

- Clean, lowercase, hyphenated slugs
- No dates in blog URLs
- Canonical URLs on all pages
- hreflang: `en` now, `el` when Greek launches

---

## 7. PAGE-BY-PAGE BLUEPRINT ✅

### 7.1 HOME PAGE

Full spec in `TDK_HOMEPAGE_EXPERIENCE.md`.

Scene summary:

1. Assembly → Hero → Approach → Threshold (canvas, Scenes 1–4)
2. Anatomy → Philosophy → Projects Reel → Process → Contact CTA → Footer (HTML, Scenes 5–10)

**Projects Reel — two real cards:**

- **Armonia:** "COMPLETED" badge → `VIEW PROJECT →` → `/projects/armonia`
- **Almond:** "IN DEVELOPMENT" badge → `REGISTER INTEREST →` → `/projects/almond`

Both cards are CMS-driven. Future projects appear automatically when added in Sanity.

---

### 7.2 ABOUT PAGE

Sections: Hero · Our Story · Mission & Vision · Team · Numbers/Milestones · Certifications · CTA

---

### 7.3 SERVICES INDEX

Sections: Hero · Services Grid · Process Overview · CTA

---

### 7.4 SERVICES DETAIL (Template)

Sections: Hero · Description · Process steps · Related Projects (from Sanity) · FAQ (accordion) · CTA

---

### 7.5 PROJECTS INDEX

**Fully CMS-driven.** New project in Sanity = new card appears automatically.

Sections:

1. Hero — "THE WORK" headline + filter controls
2. Project Grid — filterable by status (completed / in-progress / upcoming)
   and type (residential / commercial)
3. Cards: Cloudinary hero image, project name, location, year, status badge
4. Hover: image zoom + overlay CTA

---

### 7.6 PROJECT DETAIL PAGE — SINGLE UNIFIED TEMPLATE ✅

**One template. Every project. Forever.**
All content is CMS-driven. The template reads Sanity fields and renders
or hides sections accordingly. Adding a new project in Sanity = a new page
at `/projects/[slug]` with zero developer work.

Two Sanity fields control the page behavior:

`ctaType`:

- `showcase` → Completed portfolio project. Hides progress, units table, interest form.
  Bottom CTA: "Start your project with us →" → `/contact`
- `register-interest` → Active pre-sale. Shows all sections including form.
  Bottom CTA: repeats "Register Interest →" anchor link.
- `contact` → Generic. Hides progress + form. CTA: "Enquire →" → `/contact`

`status`:

- `completed` → Progress bar full (100%), units table heading "UNIT BREAKDOWN",
  all unit statuses reflect sold-out state, construction progress section hidden
- `in-progress` → Progress bar shows real %, units show live statuses
- `upcoming` → Progress bar hidden, units table hidden

---

**SECTION 1 — HERO**

- Full-bleed image (`heroImageId` — Cloudinary)
- Building name — from Sanity `title` field
- Status badge — driven by `status`: "COMPLETED" (stone) | "IN DEVELOPMENT" (teal) | "UPCOMING" (stone)
- Location + type + year/expected completion — Sanity fields
- Gradient overlay bottom-to-top for text legibility
- CTA button — if `ctaType = register-interest`: "REGISTER INTEREST →" (anchors to form)

---

**SECTION 2 — PROJECT OVERVIEW BAR**
4 columns: Location | Type | Year | Total Units
All values from Sanity. Thin vertical dividers.

---

**SECTION 3 — RENDERS GALLERY**

- Section heading — set in Sanity (e.g. "THE VISION", "RENDERS", "ARCHITECTURAL RENDERS")
- Full-width horizontal slider — `rendersGallery.images[]` (Cloudinary IDs)
- Optional caption — set in Sanity (e.g. "Architectural renders by Studio XYZ")
- Click any image → full-screen lightbox
- If `rendersGallery.images` is empty → section does not render

---

**SECTION 4 — DESCRIPTION**

- Pull quote — Sanity field (large, light weight, semi-transparent)
- Body — rich text (Sanity Portable Text)
- Features list — Sanity array, each item shown with a thin arrow prefix

---

**SECTION 5 — PHOTOS GALLERY**

- Section heading — set in Sanity (e.g. "THE BUILD", "PROGRESS", "COMPLETED", "THE RESULT")
- Full-width horizontal slider — `photosGallery.images[]` (Cloudinary IDs)
- Optional caption — set in Sanity (e.g. "Updated March 2025", "Professional photography")
- Click any image → full-screen lightbox
- If `photosGallery.images` is empty → section does not render
- This gallery shows whatever TDK uploads: construction progress shots while in-progress,
  finished professional photography when complete. TDK updates via Sanity at any time.

---

**SECTION 6 — SPECS**

- Specs table — Sanity array of `{ key, value }` pairs
  e.g. "Total Units: 12", "Floor area: 58–145 m²", "Parking: Underground"
- Hidden if specs array is empty

---

**SECTION 7 — CONSTRUCTION PROGRESS**
_(Hidden when `ctaType = showcase` or `status = completed`)_

- Progress bar — width driven by `progressPercent` (0–100), set in Sanity
- Percentage number — animated in on scroll entry
- Progress label — Sanity text field (e.g. "Foundation Complete · Structural Work Underway")
- **Construction Updates Log** — reverse chronological, fully CMS-driven:
  Each entry: `date` + `imageId` (Cloudinary) + `caption`
  TDK adds new entries in Sanity → appears on page automatically via ISR

---

**SECTION 8 — UNITS TABLE**

- Section heading — Sanity text field (e.g. "AVAILABLE UNITS" or "UNIT BREAKDOWN")
- Table columns: Floor | Unit Type | Size (m²) | Status
- Each row is a unit entry in Sanity: `{ floor, unitType, sizeM2, status }`
- Status display: Available (green dot) · Reserved (teal dot) · Sold (gray, row dimmed)
- TDK updates any unit's status in Sanity → table updates via ISR automatically
- Note below table — Sanity text field (e.g. "Pricing available on enquiry")
- If units array is empty → section does not render

---

**SECTION 9 — REGISTER INTEREST FORM**
_(Hidden when `ctaType = showcase` or `ctaType = contact`)_

- Section heading + subtext — Sanity text fields
- Fields: Name, Email, Phone, Preferred Unit Type (dropdown auto-populated from units array), Message (optional)
- On submit: email to TDK via Resend + auto-reply confirmation to lead
- GA4 event: `project_interest_submit` with `project_slug` param
  (not almond-specific — works for any pre-sale project)

---

**SECTION 10 — LOCATION**

- Map embed — coordinates or embed URL from Sanity
- Neighborhood description — Sanity rich text field

---

**SECTION 11 — RELATED PROJECTS**

- `relatedProjectSlugs[]` in Sanity — TDK picks which projects appear
- Renders up to 3 project cards
- If empty → section does not render

---

**SECTION 12 — BOTTOM CTA**

- CTA text and button — driven by `ctaType` but overridable via Sanity text field
- `showcase`: "Start your project with us →" → `/contact`
- `register-interest`: "Register your interest →" (anchor to form above)
- `contact`: "Enquire about this project →" → `/contact`

---

**ADDING A NEW PROJECT — THE FULL WORKFLOW:**

1. Upload all images to Cloudinary under `clients/tdkdb/[project-slug]/`
   - `renders/` → for renders gallery
   - `photography/` or `construction/` → for photos gallery
2. Open Sanity Studio → New Project
3. Fill in all fields, paste Cloudinary IDs, set `ctaType` and `status`
4. Publish
5. Project appears on homepage reel, projects index, and `/projects/[slug]`
   Zero developer involvement. Ever.

---

### 7.9 INSIGHTS INDEX

CMS-driven. Sections: Featured article hero · Article grid · Category filter · Pagination

### 7.10 INSIGHTS ARTICLE

Sections: Title/meta hero · Article body (Sanity Portable Text) · Author bio · Related articles · Share · CTA

### 7.11 CONTACT PAGE

Sections: Hero · Contact form (name, email, phone, type dropdown, message) · Contact info · Map

### 7.12 LEGAL

- Privacy Policy (GDPR-compliant — written properly, not boilerplate)
- Terms & Conditions
- Cookie consent banner — GDPR CMP. GA4 does NOT fire before consent.

---

### 7.13 404 PAGE

File: `/src/app/not-found.tsx`

The 404 must match the site's premium aesthetic — not a default Next.js error page.

Sections:

1. Full-height dark layout (`--color-void` background)
2. Large "404" in `text-display-xl`, weight 300, `--color-stone` (subtle, not alarming)
3. Heading: "PAGE NOT FOUND" in `text-label`, `--color-stone`, tracked
4. Body: "The page you're looking for has moved or doesn't exist." in `text-body`, `--color-stone`
5. Primary button: "BACK TO HOME →" → `/`
6. Secondary text link: "VIEW OUR PROJECTS →" → `/projects`
7. Navbar included (standard, transparent)
8. No footer — keep it minimal

Animation: 404 number fades in first (800ms), then heading + body stagger up (FadeUp, 400ms delay), then button (600ms delay).
`prefers-reduced-motion`: skip animation, show everything immediately.

---

## 8. MOTION & ANIMATION SYSTEM ✅

### 8.1 Libraries

- **GSAP + ScrollTrigger** — all scroll animations, canvas scrubbing, counters
- **Lenis** — smooth scroll on all pages
- **No Framer Motion** — GSAP only, always

### 8.2 Animation Tokens

| Token                  | Value                                  | Usage                  |
| ---------------------- | -------------------------------------- | ---------------------- |
| `--ease-smooth`        | `cubic-bezier(0.16, 1, 0.3, 1)`        | Standard transitions   |
| `--ease-entrance`      | `cubic-bezier(0.0, 0.0, 0.2, 1)`       | Elements arriving      |
| `--ease-exit`          | `cubic-bezier(0.4, 0.0, 1, 1)`         | Elements leaving       |
| `--ease-spring`        | `cubic-bezier(0.34, 1.56, 0.64, 1)`    | Magnetic buttons       |
| `--ease-cinematic`     | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Page-level transitions |
| `--duration-fast`      | `300ms`                                | Hover states           |
| `--duration-medium`    | `500ms`                                | Panel slides           |
| `--duration-slow`      | `800ms`                                | Section entrances      |
| `--duration-cinematic` | `1200ms`                               | Hero animations        |

### 8.3 Reduced Motion

All GSAP animations check `prefers-reduced-motion`.
Homepage: skip assembly, show hero-still.webp directly.
No auto-playing videos without controls when reduced motion is active.

---

## 9. RESPONSIVE DESIGN SYSTEM ✅

### 9.1 Breakpoints

| Name  | Min Width | Notes                       |
| ----- | --------- | --------------------------- |
| `xs`  | 0px       | Small phones                |
| `sm`  | 480px     | Large phones                |
| `md`  | 768px     | Tablets                     |
| `lg`  | 1024px    | Canvas experience threshold |
| `xl`  | 1280px    | Desktops                    |
| `2xl` | 1536px    | Large screens               |

### 9.2 Homepage Mobile Strategy

`pointer: coarse` OR viewport < 1024px → autoplay MP4 video, no canvas.
Do not preload image sequences on mobile — skip entirely.
All Scenes 5–10: identical content, adapted single-column layout.

### 9.3 Image Strategy

- All photography: Cloudinary with `f_auto,q_auto` — automatic format optimization
- Homepage sequences: static WebP, Vercel CDN
- All `<img>` tags: explicit `width` and `height` to prevent CLS
- Lazy loading on all below-fold images

---

## 10. SEO STRATEGY & TECHNICAL CONFIGURATION ✅

### 10.1 Target Keywords

#### English — Primary

| Keyword                           | Intent        | Target Page      |
| --------------------------------- | ------------- | ---------------- |
| "architecture company Cyprus"     | Commercial    | Home, About      |
| "development company Nicosia"     | Commercial    | Home             |
| "residential development Cyprus"  | Commercial    | Projects         |
| "construction company Cyprus"     | Commercial    | Services         |
| "apartments for sale Nicosia"     | Transactional | Almond           |
| "new build apartments Lakatameia" | Transactional | Almond           |
| "pre-sale apartments Cyprus"      | Transactional | Almond           |
| "off-plan property Cyprus"        | Transactional | Almond, Insights |

#### Greek — Primary (when Greek launches)

| Keyword                               | Target Page      |
| ------------------------------------- | ---------------- |
| "κατασκευαστική εταιρεία Λευκωσία"    | Home, About      |
| "νέα διαμερίσματα Λευκωσία"           | Almond           |
| "αρχιτεκτονική εταιρεία Κύπρος"       | Home, About      |
| "διαμερίσματα προς πώληση Λακατάμεια" | Almond           |
| "αγορά διαμερίσματος Κύπρος"          | Almond, Insights |

#### Long-Tail (English — Insights content)

- "buying off-plan apartments Cyprus guide"
- "guide to buying property in Nicosia"
- "Lakatameia neighborhood guide Nicosia"
- "what to look for in a development company Cyprus"
- "pre-sale property rights Cyprus buyers guide"

### 10.2 On-Page SEO Checklist

- [ ] Unique `<title>` per page (50–60 chars)
- [ ] Meta descriptions (150–160 chars)
- [ ] One H1 per page, correct heading hierarchy
- [ ] Alt text on all Cloudinary images (descriptive, keyword-aware)
- [ ] Internal linking (every page links to 2–3 others)
- [ ] Schema.org: Organization, LocalBusiness, RealEstateListing (Almond), Article, BreadcrumbList
- [ ] Open Graph + Twitter Card tags — strategy: static OG image per page (not dynamic generation)
  - Homepage: a hero render of Armonia or Almond uploaded to Cloudinary, full absolute URL in metadata
  - Project pages: `seo.ogImageId` from Sanity → Cloudinary URL (full absolute, not relative)
  - Insights: `seo.ogImageId` from Sanity → Cloudinary URL
  - Static pages (About, Contact, Services): one shared fallback OG image (TDK logo on dark background)
  - All OG images: 1200×630px minimum, uploaded to `clients/tdkdb/general/og/`
- [ ] Canonical URLs on all pages
- [ ] hreflang: `en` now, `el` added when Greek launches

### 10.3 Technical SEO

- [ ] XML sitemap (auto-generated, submitted to GSC)
- [ ] Robots.txt — allow all except `/studio`
- [ ] 301 redirects from old WordPress URLs
- [ ] HTTPS enforced (Vercel SSL)
- [ ] SSG for static pages, ISR (60s) for project pages
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

### 10.4 Local SEO

- Google Business Profile — optimize for "development company Lakatameia"
- NAP consistency across all listings
- LocalBusiness schema on every page
- List Almond project on Cyprus property directories

### 10.5 SEO Content Plan

**At launch (Month 1):**

- "Guide to buying off-plan property in Cyprus" (targets Almond pre-sale buyers directly)
- "The Lakatameia neighborhood guide" (local SEO, long-tail)
- "What makes a quality residential development in Cyprus" (trust-building)

**Month 2–4:** 2 articles/month on Cyprus architecture + property topics

**Month 5–6:** 3–4 articles/month + Greek versions of top performers

---

## 11. CONTENT STRATEGY ✅

### 11.1 Brand Voice

Architectural authority with human warmth. Confident, specific, slightly poetic.
Never corporate. Never casual.

✅ "The balconies are not additions. They are extensions of the living floor."
❌ "Our state-of-the-art balconies provide exceptional outdoor living spaces."

### 11.2 Content Responsibilities

| Content                     | Owner                       | Deadline       |
| --------------------------- | --------------------------- | -------------- |
| Armonia page copy + specs   | TDK                         | Before Phase 5 |
| Almond page copy + specs    | TDK                         | Before Phase 5 |
| Almond unit table data      | TDK                         | Before Phase 5 |
| About page narrative        | TDK + Kona-Verse            | Before Phase 5 |
| Service descriptions        | TDK + Kona-Verse            | Before Phase 5 |
| First 3 Insights articles   | Kona-Verse (AI-assisted)    | Launch week    |
| Greek copy — all pages      | AI first draft, TDK reviews | No deadline    |
| Almond unit status updates  | TDK (via Sanity)            | Ongoing        |
| Almond construction updates | TDK (via Sanity)            | Monthly        |

### 11.3 Media Assets Required

- [ ] Logo SVG — light + dark variants
- [ ] Armonia renders — all angles, max resolution
- [ ] Almond renders — all available now; more via Sanity later
- [ ] Almond construction site photos (first batch)
- [ ] Team photos (if team section included)
- [ ] Drone footage (if available)

---

## 12. SANITY CMS ARCHITECTURE ✅

### 12.1 Project Schema (Scalable)

```typescript
project {
  // Core identity
  title: string
  slug: slug
  status: enum ['upcoming', 'in-progress', 'completed']
  type: enum ['residential', 'commercial', 'mixed-use']
  location: string
  year: number

  // Template control — drives page rendering
  ctaType: enum ['showcase', 'register-interest', 'contact']

  // Hero
  heroImageId: string

  // Renders Gallery — CGI renders, the vision
  rendersGallery: {
    heading: string               // e.g. "THE VISION", "RENDERS"
    images: string[]              // Cloudinary IDs
    caption: string               // optional
  }

  // Photos Gallery — real photography, the reality
  // Progress shots while building, finished photography when complete
  photosGallery: {
    heading: string               // e.g. "THE BUILD", "PROGRESS", "COMPLETED"
    images: string[]              // Cloudinary IDs
    caption: string               // optional, e.g. "Updated March 2025"
  }

  // Content
  pullQuote: string
  description: portableText
  features: string[]
  specs: { key: string, value: string }[]

  // Units table
  unitsHeading: string            // e.g. "AVAILABLE UNITS" or "UNIT BREAKDOWN"
  unitsNote: string               // e.g. "Pricing available on enquiry"
  units: {
    floor: string
    unitType: string              // e.g. "2-Bed", "Penthouse"
    sizeM2: number
    status: enum ['available', 'reserved', 'sold']
  }[]

  // Construction progress (shown when status = in-progress)
  progressPercent: number         // 0–100
  progressLabel: string           // e.g. "Structural work underway"
  constructionUpdates: {
    date: date
    imageId: string               // Cloudinary ID
    caption: string
  }[]

  // Interest form (shown when ctaType = register-interest)
  interestFormHeading: string
  interestFormSubtext: string

  // Location
  mapEmbedUrl: string
  neighborhoodDescription: portableText

  // Relations
  relatedProjectSlugs: string[]

  // CTA override (optional — defaults driven by ctaType if left empty)
  ctaLabel: string
  ctaHref: string

  // SEO
  seo: { title: string, description: string, ogImageId: string }

  // Multilingual (commented out until Greek launches)
  // titleEl: string
  // pullQuoteEl: string
  // descriptionEl: portableText
}
```

### 12.2 Insights Schema

```typescript
insight {
  title: string
  slug: slug
  author: reference → teamMember
  publishDate: datetime
  category: reference → category
  excerpt: text
  heroImageId: string              // Cloudinary ID
  body: portableText
  seo: { title, description, ogImageId }
  relatedInsightSlugs: string[]
  // titleEl: string               // Greek — uncomment when ready
  // bodyEl: portableText
}
```

### 12.3 Supporting Schemas

```typescript
teamMember { name, role, bio, photoId (Cloudinary), email, linkedin, order }

service {
  title, slug, shortDescription, fullDescription (portableText),
  heroImageId, process: { step, title, description }[],
  faq: { question, answer }[], relatedProjectSlugs, seo
}

category { title, slug, description }

siteSettings (singleton) {
  companyName, tagline, address, phone, email,
  socialLinks: { platform, url }[],
  logoId (Cloudinary), ogImageId (Cloudinary),
  googleAnalyticsId
}
```

### 12.4 Studio Configuration

- Embedded at `/studio`
- Custom desk structure: Projects · Insights · Services · Team · Settings
- Cloudinary ID fields have helper descriptions explaining the workflow
- ISR revalidation: 60s for projects, 300s for insights

### 12.5 Scalability Workflow

**Adding a new project (zero developer involvement):**

1. Upload all images to Cloudinary:
   - `clients/tdkdb/[slug]/renders/` → for renders gallery
   - `clients/tdkdb/[slug]/construction/` or `photography/` → for photos gallery
2. Open Sanity Studio → New Project
3. Fill all fields, set `ctaType` and `status`, paste Cloudinary IDs
4. Publish → ISR revalidates within 60s → project appears on homepage reel,
   projects index, and `/projects/[slug]`

**Ongoing updates (e.g. Almond):**

- New progress photos: upload to Cloudinary `clients/tdkdb/almond/construction/` → add IDs to `photosGallery.images[]`
- Construction log entry: add to `constructionUpdates[]` (date + photo + caption)
- Unit sold/reserved: change that unit's `status` in Sanity
- Progress milestone: update `progressPercent` + `progressLabel`
- Project complete: change `status` to `completed`, `ctaType` to `showcase`,
  swap `photosGallery` images — remove construction shots, add finished photography IDs from `clients/tdkdb/almond/photography/`,
  update `photosGallery.heading` to "COMPLETED" or "THE RESULT"

**When Almond sells out (complete transition workflow):**

1. In Sanity — Project: Almond:
   - Change `status`: `in-progress` → `completed`
   - Change `ctaType`: `register-interest` → `showcase`
   - Change `unitsHeading`: "AVAILABLE UNITS" → "UNIT BREAKDOWN"
   - Clear `unitsNote` (remove "Pricing available on enquiry")
   - Update `progressPercent` to 100
   - Update `progressLabel` to "Construction Complete"
   - Update `photosGallery.heading` from "THE BUILD" to "COMPLETED"
   - Swap `photosGallery.images` — remove construction shots,
     add finished professional photography IDs
   - Update `photosGallery.caption` to "Professional photography"
2. Upload finished photography to Cloudinary:
   `clients/tdkdb/almond/photography/`
3. Publish → ISR revalidates within 60s
4. Result: interest form disappears, progress bar disappears,
   CTA changes to "Start your project with us",
   photos gallery shows finished photography

---

## 13. ANALYTICS & TRACKING ✅

### 13.1 GA4 Events

| Event                     | Trigger               | Parameters                       |
| ------------------------- | --------------------- | -------------------------------- |
| `page_view`               | Every page            | `page_title`, `page_location`    |
| `contact_form_submit`     | General contact form  | `page_source`                    |
| `project_interest_submit` | Project interest form | `unit_preference`                |
| `project_view`            | Project detail page   | `project_name`, `project_status` |
| `cta_click`               | Any CTA button        | `cta_text`, `cta_location`       |
| `insight_read`            | Article page view     | `article_title`, `category`      |
| `gallery_interact`        | Photo slider/gallery  | `project_name`                   |
| `unit_table_interact`     | Almond units table    | `unit_type`, `unit_status`       |
| `phone_click`             | Click-to-call         | `page_source`                    |
| `email_click`             | Mailto link           | `page_source`                    |
| `scroll_depth`            | 25/50/75/100%         | `page_title`                     |

### 13.2 Conversions

- `project_interest_submit` (primary)
- `contact_form_submit` (primary)
- `phone_click` (secondary)

### 13.3 Additional Tools

- **Microsoft Clarity** (free) — heatmaps from day 1. Priority: Almond page + homepage.
- **Vercel Analytics** — Core Web Vitals in production
- **Google Search Console** — keyword rankings, crawl errors, indexing

---

## 14. PERFORMANCE & CORE WEB VITALS ✅

### 14.1 Targets

| Page            | Lighthouse Desktop | Lighthouse Mobile | LCP    | CLS   |
| --------------- | ------------------ | ----------------- | ------ | ----- |
| Homepage        | > 80               | > 65              | < 3s   | < 0.1 |
| Almond          | > 90               | > 75              | < 2.5s | < 0.1 |
| All other pages | > 90               | > 80              | < 2.5s | < 0.1 |

Homepage targets are lower due to image sequence preloading — this is acceptable.
The experience justifies it. Interior pages must hit 90+ without exception.

### 14.2 Image Sequence Performance Strategy

The homepage loads ~26MB of WebP frames. Managed as follows:

**Step 1 — Preload hero still before JS runs:**

```html
<link rel="preload" as="image" href="/sequences/hero-still.webp" />
```

The hero still is the first approach frame — it renders immediately on any connection.

**Step 2 — Staged loading:**

- First 30 assembly frames: block on these before starting assembly
- Frames 31–N: background load during assembly playback
- All approach frames: background load during assembly

**Step 3 — Connection speed detection:**

```typescript
const connection = (navigator as any).connection;
const isSlowConnection =
  connection?.effectiveType === '2g' ||
  connection?.effectiveType === '3g' ||
  connection?.saveData === true;

// On slow connection or mobile: serve MP4 video instead of canvas
```

**Step 4 — Hard timeout (8 seconds):**
If sequences haven't loaded within 8s:

- Skip loading screen
- Show hero still as static image
- Unlock scroll immediately
- Sequences continue loading in background silently
- ScrollTrigger activates once approach frames are ready

**Step 5 — Vercel edge caching:**

```json
// vercel.json
{
  "headers": [
    {
      "source": "/sequences/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

Frames never change once generated. Cache forever, invalidate by renaming files.

### 14.3 Cloudinary Performance

Standard transforms on all images: `f_auto,q_auto,w_[size]`

- `f_auto` — serves WebP/AVIF automatically per browser
- `q_auto` — Cloudinary determines optimal quality
- `w_[size]` — correct dimensions, never oversized

### 14.4 General Optimization

- SSG for all static pages; ISR (60s) for project + insights pages
- Code splitting per route
- Josefin Sans: latin subset only, weights 300/400/600, `font-display: swap`
- Preload Josefin Sans 300 (most used weight) in `<head>`
- No third-party scripts before cookie consent (GA4 behind gate)
- Remove all `console.log` in production build

---

## 15. EMAIL & CONTACT SYSTEM ✅

### 15.1 General Contact Form

Fields: Name, Email, Phone (optional), Project Type (dropdown), Message
Emails to: `info@tdkdb.com` (TDK's Titan inbox) via Resend
Auto-reply: confirmation to sender
From (Resend sending address): `noreply@tdkdb.com`
Note: `noreply@tdkdb.com` requires no real inbox — just Resend's DKIM record in Cloudflare DNS.
All notification emails send FROM `noreply@tdkdb.com` TO `info@tdkdb.com`.

### 15.2 Project Interest Form

Fields: Name, Email, Phone, Preferred Unit Type (dropdown from Sanity units), Message (optional)
Emails to: `info@tdkdb.com` with clear subject: "[Project Name] — New Interest: [Lead Name]"
Auto-reply to lead: "Thank you for your interest in [Project]. We'll be in touch within 48 hours."
From (Resend sending address): `noreply@tdkdb.com`
GA4 event: `project_interest_submit`

**Lead storage in Sanity:**
Every interest form submission is also saved as a Sanity document (type: `lead`) in addition to sending email. This gives TDK a simple CRM inside Sanity Studio — they can see all leads, filter by project, and track follow-up status without digging through email.

```typescript
lead {
  projectSlug: string
  projectName: string
  name: string
  email: string
  phone: string
  unitPreference: string
  message: string
  submittedAt: datetime
  status: enum ['new', 'contacted', 'qualified', 'closed']
  notes: string    // internal TDK notes
}
```

In Sanity Studio: Leads section in desk structure, grouped by project.
New leads appear with status `'new'`. TDK updates status as they follow up.

### 15.3 Infrastructure

- Resend sends FROM `noreply@tdkdb.com` — requires only a DKIM CNAME record in Cloudflare, no inbox
- Combined SPF record in Cloudflare covers both Titan (incoming) and Resend (outgoing):
  `v=spf1 include:spf.titan.email include:amazonses.com ~all`
  (Resend uses Amazon SES — do NOT create two separate SPF records, one combined record only)
- DKIM: Titan provides its own CNAME records; Resend provides separate CNAME records — both added to Cloudflare
- DMARC TXT on `_dmarc.tdkdb.com`: `v=DMARC1; p=quarantine; rua=mailto:info@tdkdb.com`
- Honeypot fields on all forms (anti-spam)
- Rate limiting on all API routes
- Client-side + server-side validation
- Form destination email controlled via env var (`CONTACT_FORM_TO_EMAIL`) — never hardcoded

---

## 16. DEPLOYMENT & HOSTING ✅

- **Platform:** Vercel Pro — region: fra1 (Frankfurt)
- **CI/CD:** GitHub (Kona-Verse org) → Vercel (Kona-Verse team) auto-deploy on push to `main`
- **Preview deployments:** All PRs get a Vercel auto-generated preview URL

| Environment | Branch           | URL                                                                         |
| ----------- | ---------------- | --------------------------------------------------------------------------- |
| Production  | `main`           | tdkdb.com                                                                   |
| Staging     | `staging`        | `tdk-staging.vercel.app` (pre-DNS) → `staging.tdkdb.com` (post-DNS cutover) |
| Development | feature branches | Auto Vercel preview URLs                                                    |

**Note on staging subdomain:** `staging.tdkdb.com` requires a CNAME record in Cloudflare pointing to Vercel.
This subdomain is only available after DNS has been migrated to Cloudflare (Phase 9).
Before that point, use the Vercel auto-generated URL for staging review.

---

## 17. DOMAIN, DNS & MIGRATION ✅

### 17.1 Infrastructure Context

| Item             | Status             | Detail                                                              |
| ---------------- | ------------------ | ------------------------------------------------------------------- |
| Domain registrar | WordPress.com      | tdkdb.com registered and renewed here (~€12/year)                   |
| Current hosting  | WordPress.com      | ~€140/year — cancel AFTER cutover confirmed                         |
| Email            | Titan (standalone) | `info@tdkdb.com` — billed separately, survives hosting cancellation |
| New DNS manager  | Cloudflare         | Free. Nameservers pointed here from WordPress.com dashboard         |
| New site hosting | Vercel             | Next.js app, Kona-Verse GitHub org → Kona-Verse Vercel team         |
| Form sending     | Resend             | FROM `noreply@tdkdb.com` TO `info@tdkdb.com`                        |

**Key facts:**

- WordPress.com stays as domain **registrar** — no domain transfer needed, ever
- Only the **nameservers** change (WordPress.com's → Cloudflare's)
- Titan is **standalone** billing — cancelling WordPress hosting does NOT cancel email
- TDK cost after migration: ~€12/year domain + ~€48/year Titan = ~€60/year (was €140/year)

---

### 17.2 DNS Cutover — Exact Sequence

**PHASE A — Setup Cloudflare (WordPress site still live, zero user impact)**

1. Add `tdkdb.com` to Cloudflare — Cloudflare auto-imports all existing DNS records
2. Verify Titan MX records imported correctly (cross-check against Titan dashboard)
3. Add ALL new records in Cloudflare before touching nameservers:

**Vercel (site):**

```
Type: A      Name: @    Value: 76.76.21.21           Proxy: DNS only (grey cloud)
Type: CNAME  Name: www  Value: cname.vercel-dns.com  Proxy: DNS only (grey cloud)
```

**Resend (form email sending — add domain in Resend dashboard first, it generates these):**

```
Type: CNAME  Name: resend._domainkey  Value: [from Resend dashboard]
```

**Combined SPF (one record covering both Titan and Resend — never two SPF records):**

```
Type: TXT  Name: @  Value: v=spf1 include:spf.titan.email include:amazonses.com ~all
```

**DMARC:**

```
Type: TXT  Name: _dmarc  Value: v=DMARC1; p=quarantine; rua=mailto:info@tdkdb.com
```

**Google Search Console domain verification:**

```
Type: TXT  Name: @  Value: google-site-verification=[from GSC dashboard]
```

**Staging subdomain (add now while you're here — will work after nameservers switch):**

```
Type: CNAME  Name: staging  Value: cname.vercel-dns.com  Proxy: DNS only
```

4. Verify Resend domain in Resend dashboard (it checks for the CNAME above)

**PHASE B — Switch nameservers**

5. WordPress.com dashboard → Domains → tdkdb.com → Name Servers
6. Replace WordPress.com nameservers with Cloudflare's two assigned nameservers
7. Save — propagation is typically minutes to a few hours via Cloudflare
8. Verify propagation at `dnschecker.org` — confirm MX → Titan, A → Vercel

**PHASE C — Post-cutover verification**

9. Vercel SSL certificate auto-provisions (Let's Encrypt, usually <5 minutes)
10. `tdkdb.com` loads the new Next.js site ✓
11. `www.tdkdb.com` redirects to `tdkdb.com` ✓ (configured in Vercel project settings + next.config.ts)
12. Send test email to `info@tdkdb.com` — arrives in Titan inbox ✓
13. Submit contact form — Resend delivers to `info@tdkdb.com` ✓
14. Submit interest form — Resend delivers to `info@tdkdb.com`, lead appears in Sanity ✓
15. Submit new sitemap to Google Search Console
16. Cancel WordPress.com **hosting plan** (NOT domain registration — keep that)
17. Monitor 404s for 2 weeks post-launch

---

### 17.3 Vercel Domain Configuration

In Vercel project → Domains, add both:

- `tdkdb.com` → primary (canonical)
- `www.tdkdb.com` → set as redirect to `tdkdb.com`

Vercel handles SSL for both automatically. The www → root redirect is also enforced in `next.config.ts` (see Prompt 0.5).

---

### 17.4 Key 301 Redirects (in next.config.ts)

| Old WordPress URL                                       | New URL                          |
| ------------------------------------------------------- | -------------------------------- |
| /home                                                   | /                                |
| /about-us                                               | /about                           |
| /our-services                                           | /services                        |
| /our-projects                                           | /projects                        |
| /our-buildings                                          | /projects                        |
| /contact-us                                             | /contact                         |
| /blog                                                   | /insights                        |
| /blog/why-is-armonia-apartments-the-best-option-for-you | /insights/why-armonia-apartments |

All redirects: `permanent: true` (HTTP 301)

---

## 18. ACCESSIBILITY ✅

- WCAG 2.1 AA minimum
- Semantic HTML, one H1 per page, correct heading hierarchy
- Keyboard navigable — custom threshold focus ring
- ARIA labels: nav, mobile menu, anatomy nodes, project filters, unit status indicators
- Color contrast: `--color-paper` on `--color-void` ~12:1 (passes)
- Alt text on all Cloudinary images
- `prefers-reduced-motion`: skip all GSAP, show hero still directly
- Cookie consent — GA4 not loaded before opt-in
- All form inputs: associated `<label>`, ARIA error announcements
- Almond units table: accessible with keyboard navigation and screen reader status labels

---

## 19. MULTILINGUAL STRATEGY ✅

### 19.1 Decision

**English launches now. Greek when TDK is ready — no deadline.**

Greek is architected into the codebase from day one but not populated.
No pressure on TDK for translation timelines.

### 19.2 Implementation

**At launch:**

- URLs: no prefix (English is default + canonical)
- Language switcher in nav: "EN | EL" — EL present, visually disabled/grayed
- Sanity schemas: Greek fields commented out (present, not exposed in Studio)
- hreflang: `<link rel="alternate" hreflang="en" href="https://tdkdb.com/..." />`

**When Greek is ready:**

- Enable `/el/` routes via Next.js i18n config
- Activate Greek fields in Sanity Studio
- Add hreflang `el` tags
- Enable EL switcher in nav
- Submit `/el/` sitemap to GSC

**Greek copy workflow:**

1. Claude generates first draft from English copy
2. TDK reviews and corrects (native Greek speakers)
3. Kona-Verse implements in Sanity
4. Publish

### 19.3 Priority Pages for Greek

1. Almond project page (highest commercial value)
2. Homepage
3. Contact page
4. Top 3 Insights articles

---

## 20. PROJECT PHASES & TIMELINE ✅

### Pre-Build — BLOCKING (must be done before writing any code)

**SEQUENCES** _(Phase 4 is completely blocked without these):_

Higgsfield generation brief (use these exact parameters):

- **Assembly sequence:** Building materializing piece by piece from architectural elements.
  Dark, dramatic, no people. Style: "architectural visualization, cinematic, luxury residential
  building, photorealistic, dark dramatic lighting, Nicosia Cyprus, night"
  Duration: 6–8 seconds. Aspect ratio: 16:9.
- **Approach sequence:** Cinematic camera push toward the building entrance, ground level.
  Same building as assembly. Style: "architectural visualization, cinematic approach shot,
  luxury residential building exterior, dusk to night, dramatic, photorealistic"
  Duration: 10–12 seconds. Aspect ratio: 16:9.
- If Higgsfield account is Kona-Verse's: note credit cost as a project expense
- Re-generate if output doesn't match dark aesthetic — do not use outputs with people or daylight

- [ ] Higgsfield account ready (Kona-Verse account or create one)
- [ ] Assembly sequence generated and downloaded (MP4, 16:9, 6–8s)
- [ ] Approach sequence generated and downloaded (MP4, 16:9, 10–12s)
- [ ] FFmpeg installed locally
- [ ] Assembly frames extracted:
      `ffmpeg -i assembly.mp4 -vf fps=30 -q:v 80 public/sequences/assembly/frame-%04d.webp`
- [ ] Approach frames extracted:
      `ffmpeg -i approach.mp4 -vf fps=30 -q:v 80 public/sequences/approach/frame-%04d.webp`
- [ ] hero-still.webp created (first frame of approach sequence):
      `ffmpeg -i approach.mp4 -vframes 1 public/sequences/hero-still.webp`
- [ ] Mobile fallback MP4 generated from approach sequence:
      `ffmpeg -i approach.mp4 -vcodec libx264 -crf 28 -vf scale=1080:-2 public/videos/approach-mobile.mp4`
      (Mobile devices get this compressed MP4 instead of the canvas — no sequences loaded on mobile)
- [ ] Frame counts confirmed and recorded in `sequenceConfig.ts`
- [ ] Total size checked: assembly < 15MB, approach < 20MB, approach-mobile.mp4 < 8MB
      If over budget: re-run with `-q:v 65` (sequences) or `-crf 32` (mobile MP4)

**ASSETS** _(Phase 3 is blocked without logo):_

- [ ] Check WordPress.com site for existing logo — if present in any format (PNG, JPG), download it
      and vectorize using Illustrator or vectorizer.ai before exporting as SVG
- [ ] Logo SVG confirmed — light variant (white/light on dark background)
- [ ] Logo SVG confirmed — dark variant (dark on light, for any light-background contexts)
- [ ] Favicon files generated from logo SVG: - `favicon.ico` (16x16 + 32x32 combined) - `icon-16.png`, `icon-32.png`, `apple-icon.png` (180x180), `icon-512.png` - Place all in `/src/app/` — Next.js App Router serves them automatically
- [ ] `manifest.ts` created at `/src/app/manifest.ts`:
      name: "TDK Design & Build", short_name: "TDK",
      theme_color: "#0D0D0D", background_color: "#0D0D0D", display: "standalone"
- [ ] Armonia front-facing render identified and saved as:
      `/public/images/armonia/front-facing.webp`
      (Used in the Anatomy section with interactive hotspot nodes — must be a PNG/WebP
      with transparent or clean background, front elevation angle)

**CLOUDINARY:**

- [ ] Cloudinary folder `clients/tdkdb/` created in agency account
- [ ] Armonia exterior renders uploaded to `clients/tdkdb/armonia/exterior/`
- [ ] Armonia interior renders uploaded to `clients/tdkdb/armonia/interior/`
- [ ] Almond renders uploaded to `clients/tdkdb/almond/renders/`
- [ ] Almond construction photos (first batch) uploaded to `clients/tdkdb/almond/construction/`

**CONTENT FROM TDK** _(Phase 5 blocked without these):_

- [ ] TDK primary inbox confirmed: `info@tdkdb.com` (Titan — standalone subscription)
- [ ] Almond unit data confirmed: floor / type / size / status for every unit
- [ ] Almond current progress % and label confirmed
- [ ] Armonia copy confirmed: pull quote, description, features, specs
- [ ] Almond copy confirmed: pull quote, description, features, specs

**INFRASTRUCTURE:**

- [ ] Vercel Pro account active (Kona-Verse team), project created, region set to fra1
- [ ] GitHub repo created in Kona-Verse org
- [ ] Sanity project created — project ID noted for env vars
- [ ] Cloudflare account set up — `tdkdb.com` added, existing DNS records imported and verified
- [ ] Resend account active — `tdkdb.com` domain added (generates DKIM records for Cloudflare)
      ⚠️ Cloudflare must exist before Resend domain verification can complete
- [ ] All DNS records added to Cloudflare (Titan MX, combined SPF, Resend DKIM, DMARC, GSC TXT)
- [ ] Resend domain verified in Resend dashboard (checks for DKIM CNAME in Cloudflare)
- [ ] GA4 property created — measurement ID noted
- [ ] Microsoft Clarity project created — project ID noted
- [ ] Google Search Console — GSC TXT verification record added to Cloudflare, domain verified
- [ ] Sanity CORS origins configured in Sanity project settings:
      http://localhost:3000 · https://[vercel-preview-url].vercel.app · https://tdkdb.com · https://www.tdkdb.com

### Phase 0 — Scaffolding (Week 1)

- [ ] Next.js 14 + TypeScript + Tailwind + pnpm
- [ ] Dependencies installed: GSAP, Lenis, Sanity, next-cloudinary, Resend
- [ ] Folder structure created (incl. `/src/lib/cloudinary/`, `/src/lib/homepage/`)
- [ ] Env vars: Sanity, Cloudinary, Resend, GA4
- [ ] Vercel deployment pipeline
- [ ] `vercel.json` with security headers + sequence cache headers

### Phase 1 — PRD Orientation (Week 1)

- [ ] Feed Master Plan + Homepage Experience doc to Cursor
- [ ] ADR at `/docs/ADR.md`

### Phase 2 — Design System (Week 1–2)

- [ ] CSS custom properties + Tailwind config
- [ ] Typography scale
- [ ] `cloudinaryUrl()` utility

### Phase 3 — Global Components (Week 2)

- [ ] Navbar (with EN|EL switcher — EL disabled) + Footer
- [ ] Button system (magnetic)
- [ ] Animation wrappers (FadeUp, TextReveal, StaggerGroup, CountUp)
- [ ] Custom cursor
- [ ] Grid + layout utilities

### Phase 4 — Homepage (Week 2–4)

- [ ] Canvas engine + sequence config + loading screen
- [ ] Assembly playback RAF (Scene 1)
- [ ] Hero text overlay (Scene 2)
- [ ] Approach scroll scrubbing (Scene 3)
- [ ] Threshold bloom + canvas teardown (Scene 4)
- [ ] Anatomy interactive (Scene 5)
- [ ] Philosophy scroll (Scene 6)
- [ ] Projects Reel — Armonia + Almond (Scene 7)
- [ ] Process timeline (Scene 8)
- [ ] Contact CTA (Scene 9)
- [ ] Footer (Scene 10)
- [ ] Mobile video fallback

### Phase 5 — Interior Pages (Week 4–6)

- [ ] About page
- [ ] Services index + detail template
- [ ] Projects index (CMS-driven, scalable)
- [ ] Project detail page — unified template (handles Armonia, Almond,
      and all future projects via ctaType + status fields)
- [ ] Insights index
- [ ] Insights article template
- [ ] Contact page + both forms

### Phase 6 — CMS Integration (Week 6–7)

- [ ] Sanity schemas (all content types incl. new project fields)
- [ ] Sanity Studio customization + Cloudinary field descriptions
- [ ] GROQ queries for all pages
- [ ] ISR configuration (60s projects, 300s insights)
- [ ] Content entry: Armonia, Almond (units, current renders, progress), first articles

### Phase 7 — SEO & Analytics (Week 7–8)

- [ ] Meta tags + OG tags on all pages
- [ ] Schema.org: Organization, LocalBusiness, RealEstateListing (Almond), Article, BreadcrumbList
- [ ] XML sitemap
- [ ] Robots.txt
- [ ] 301 redirects
- [ ] hreflang (EN)
- [ ] GA4 direct — all events configured and verified in Real-Time
- [ ] Microsoft Clarity installed
- [ ] GSC submission

### Phase 8 — Performance & Polish (Week 8–9)

- [ ] Lighthouse audit — fix top issues on all pages
- [ ] Image sequence strategy: preload hint, connection detection, timeout, cache headers
- [ ] Cloudinary transform audit (all images using f_auto, q_auto)
- [ ] Mobile QA: iPhone 13, Samsung Galaxy A54, iPad
- [ ] Cross-browser: Chrome, Safari, Firefox, Edge
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Animation polish pass
- [ ] Cookie consent CMP (GDPR)

### Phase 9 — QA & Launch (Week 9–10)

- [ ] Pre-launch checklist (content, technical, legal, DNS)
- [ ] Staging review + TDK sign-off (on Vercel preview URL)
- [ ] DNS cutover — follow Section 17.2 exact sequence
      (Cloudflare nameservers → verify Titan MX intact → Vercel SSL → test forms → cancel WP hosting)
- [ ] Go live
- [ ] Post-launch monitoring: 404s, analytics, GSC indexing
- [ ] Add `staging.tdkdb.com` CNAME in Cloudflare after cutover

### Post-Launch Growth

- [ ] Microsoft Clarity review — heatmaps on Almond page after 2 weeks
- [ ] 2–4 Insights articles/month
- [ ] Monthly analytics review + keyword ranking check
- [ ] Almond unit status updates (TDK via Sanity — ongoing)
- [ ] Almond construction updates (TDK via Sanity — monthly)
- [ ] Greek language rollout when TDK is ready
- [ ] Future project pages added via CMS as TDK develops new projects

---

## 21. CURSOR AI DEVELOPMENT GUIDELINES ✅

### 21.1 Source Documents

Always have in the project root:

- `TDK_MASTER_PLAN.md` — this document
- `TDK_HOMEPAGE_EXPERIENCE.md` — homepage full spec
- `TDK_CURSOR_BUILD_STRATEGY.md` — sequential Cursor prompts

### 21.2 Hard Rules for Cursor

1. **No Three.js** — homepage uses HTML5 canvas + image sequences
2. **No Framer Motion** — GSAP only, always
3. **No Sanity native images** — all images are Cloudinary IDs stored as strings
4. **`dynamic(() => import(...), { ssr: false })`** — always for HomepageCanvas
5. **One prompt = one component** — never combine unrelated concerns
6. **Commit after every prompt** — `feat: Phase X.Y — description`
7. **`SANITY_API_TOKEN` must NEVER have `NEXT_PUBLIC_` prefix** — it has write permission and must remain server-side only. If exposed in the browser bundle, anyone can write to the Sanity dataset.
8. **Email addresses must never be hardcoded** — always use env vars (`CONTACT_FORM_TO_EMAIL`, `INTEREST_FORM_TO_EMAIL`)

### 21.3 Naming Conventions

- Components: PascalCase (`ProjectCard.tsx`)
- Utilities: camelCase (`cloudinaryUrl.ts`)
- CSS variables: `--color-void`, `--ease-smooth`
- Sanity field names: `camelCase` with `Id` suffix for Cloudinary (`heroImageId`)
- Cloudinary paths: `clients/tdkdb/[project]/[folder]/[filename]`

### 21.4 Code Standards

- TypeScript strict mode
- All Sanity queries: GROQ with typed responses
- All images: `cloudinaryUrl()` utility — never hardcoded Cloudinary URLs
- All animations: `useReducedMotion` check
- No inline styles

---

## APPENDIX

### A. Cloudinary Folder Map

```
clients/tdkdb/
  armonia/
    exterior/
    interior/
    floor-plans/
  almond/
    renders/          ← CGI renders → rendersGallery
    construction/     ← Progress photos → photosGallery (while in-progress)
    photography/      ← Finished photos → photosGallery (when complete)
    floor-plans/
  general/
    team/
    about/
  insights/
    [article-slug]/
```

### B. Content Inventory (From Current WordPress Site)

- Pages: Home, About, Services, Our Projects, Our Buildings, Contact Us, Blog
- Existing article: "Why is Armonia Apartments the best option for you?"
- Assets: Armonia renders (exterior + interior), company logo

### C. Asset Checklist

- [ ] Logo SVG — light + dark variants (vectorize from existing PNG if needed)
- [ ] Favicon files — ico, 16px, 32px, 180px (Apple), 512px — generated from logo
- [ ] OG fallback image — 1200×630px, TDK logo on dark background → `clients/tdkdb/general/og/default`
- [ ] Armonia renders — all angles, max resolution → Cloudinary
- [ ] Almond renders — all available → Cloudinary
- [ ] Almond construction site photos (first batch) → Cloudinary
- [ ] Team photos (if team section included) → Cloudinary
- [ ] Drone footage (if available)
- [ ] Higgsfield sequences processed and in `/public/sequences/`

### D. Pre-Launch Checklist

**Content:** All placeholder copy replaced · All Cloudinary images uploaded and IDs in Sanity · Armonia + Almond fully published · Almond units table complete · 2+ Insights articles live · OG images uploaded for all pages

**Technical:** All env vars in Vercel production (all scopes) · Sanity CORS includes production URL · Resend domain verified · Contact + interest forms tested end-to-end · Forms deliver to `info@tdkdb.com` ✓ · GA4 receiving events · Microsoft Clarity active · GSC verified + sitemap submitted · 301 redirects tested · Favicons rendering correctly · Manifest.json present · www → naked domain redirect working

**Legal:** Cookie consent working · GA4 not loading pre-consent · Privacy Policy live · Terms live

**DNS:** Cloudflare managing DNS · Nameservers switched from WordPress.com · Titan MX intact (test by emailing info@tdkdb.com) · Vercel SSL active · www redirect configured · WordPress hosting cancelled (domain renewal still active) · Domain auto-renewal confirmed in WordPress.com account

---

---

## 22. SANITY STUDIO — TDK HANDOFF GUIDE ✅

This section documents what TDK needs to know to manage their own content after launch. Kona-Verse delivers a 30-minute walkthrough session on launch day.

**Sanity Studio is at:** `tdkdb.com/studio` (not a subdomain — embedded in the Next.js app)

### 22.1 The Four Things TDK Will Do Regularly

**A. Update Almond unit status (when a unit is reserved or sold)**

1. Open `tdkdb.com/studio`
2. Go to Projects → Almond
3. Scroll to "Units" section
4. Find the unit row, click it
5. Change Status dropdown: Available → Reserved → Sold
6. Click Publish
7. Site updates within 60 seconds

**B. Add a construction update (monthly)**

1. Upload the new photo to Cloudinary: `clients/tdkdb/almond/construction/[date]-[description]`
2. Copy the public ID
3. Open Sanity → Projects → Almond
4. Scroll to "Construction Updates"
5. Click "Add item"
6. Fill in: Date, paste Cloudinary ID, write Caption
7. Click Publish

**C. Update the construction progress bar**

1. Open `tdkdb.com/studio` → Projects → Almond
2. Find "Progress Percent" field — update the number (0–100)
3. Update "Progress Label" text (e.g. "Structural Work Complete · Interior Fit-Out Underway")
4. Click Publish

**D. Publish a new Insights article**

1. Open Sanity → Insights → New Insight
2. Fill in all fields
3. Upload article image to Cloudinary → `clients/tdkdb/insights/[article-slug]/`
4. Paste Cloudinary ID into Hero Image field
5. Write body content using the rich text editor
6. Set status to Published
7. Click Publish → appears on site within 5 minutes

### 22.2 What TDK Should NEVER Do in Sanity

- Do not delete the Armonia or Almond project documents
- Do not change project slugs after launch (breaks URLs and SEO)
- Do not leave required fields empty before publishing
- Do not upload images directly to Sanity — always use Cloudinary first

### 22.3 Cloudinary Access for TDK

**Decision:** Kona-Verse handles all Cloudinary uploads on TDK's behalf (TDK sends photos via WhatsApp/email, Kona-Verse uploads and provides the public ID). TDK does not have direct Cloudinary access unless they request a training session.

If TDK requests direct access in the future: create a Cloudinary sub-account or restricted user with access to `clients/tdkdb/` folder only.

### 22.4 Infrastructure TDK Manages Independently

- **Domain renewal:** tdkdb.com is registered at WordPress.com. TDK must renew it annually (~€12/year). Confirm auto-renewal is ON in WordPress.com account. Do not cancel the WordPress.com account — only the hosting plan was cancelled. The domain registration must stay active.
- **Email:** `info@tdkdb.com` runs on Titan (billed separately at ~€4/month). Renew independently of domain.
- **Sanity Studio access:** Login at `tdkdb.com/studio` with Sanity credentials provided at handoff

### 22.5 Who to Contact for Help

- For Sanity/content questions: Kona-Verse
- For Cloudinary uploads: Kona-Verse (send photos, receive Cloudinary ID back)
- For new project launches: always Kona-Verse (Sanity entry is TDK, but first setup of a new project type should be reviewed)
- For domain/DNS issues: Kona-Verse (Cloudflare access is Kona-Verse managed)
- For email issues (Titan): contact Titan support directly at titan.email

---

> **The north star:** A site that makes a Cypriot family looking for their first home say
> "this is who I trust to build it" — and makes TDK's competitors look like they're
> still working from a WordPress template.
