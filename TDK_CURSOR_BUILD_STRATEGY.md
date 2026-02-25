# TDK DESIGN & BUILD – CURSOR BUILD STRATEGY
### Sequential Prompt Guide for AI-Assisted Development

> **Purpose:** This document tells you exactly what to feed Cursor, in what order, and what
> to say at each step. Follow this sequentially. Do not skip phases. Each phase builds
> on the last — if you rush ahead, Cursor will make inconsistent decisions.
>
> **How to use this document:**
> Each prompt block is what you paste (or adapt) directly into Cursor.
> Requirements listed above each block are what YOU verify before running the prompt.
> Notes below each block tell you what to check before moving on.
>
> **Source documents Cursor will reference:**
> - `TDK_MASTER_PLAN.md` — full site PRD
> - `TDK_HOMEPAGE_EXPERIENCE.md` — homepage cinematic spec
>
> **Status:** 🔲 = Not started | 🟡 = In progress | ✅ = Complete

---

## TABLE OF CONTENTS

- [Phase 0 – Project Scaffolding](#phase-0--project-scaffolding)
- [Phase 1 – PRD Orientation & Optimization](#phase-1--prd-orientation--optimization)
- [Phase 2 – Design System & Global Tokens](#phase-2--design-system--global-tokens)
- [Phase 3 – Global Components](#phase-3--global-components)
- [Phase 4 – Homepage (Scene by Scene)](#phase-4--homepage-scene-by-scene)
- [Phase 5 – Interior Pages](#phase-5--interior-pages)
- [Phase 6 – CMS Integration](#phase-6--cms-integration)
- [Phase 7 – SEO & Analytics](#phase-7--seo--analytics)
- [Phase 8 – Performance & Polish](#phase-8--performance--polish)
- [Phase 9 – QA & Launch Prep](#phase-9--qa--launch-prep)

---

## PHASE 0 – PROJECT SCAFFOLDING

**Goal:** Create the bare-bones project structure. No UI yet — just infrastructure.
**When:** Before writing a single line of component code.

---

### PROMPT 0.1 — Initialize Next.js Project

**Pre-requirements:**
- [ ] Node.js 20+ installed
- [ ] Vercel account created
- [ ] GitHub repo created (name: `tdkdb`)
- [ ] Sanity account created

```
Create a new Next.js 14 project with the App Router using TypeScript.

Requirements:
- Framework: Next.js 14+ with App Router
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS
- Package manager: pnpm
- ESLint + Prettier configured
- Include a .prettierrc with: single quotes, 2 space indent, trailing commas, 100 char print width
- Include a tsconfig.json with path aliases: @/* → ./src/*

Do not create any pages or components yet. Just the scaffold.
```

**Check before moving on:**
- `pnpm dev` runs without errors
- TypeScript compiles with zero errors
- Prettier formats on save

---

### PROMPT 0.2 — Install All Dependencies

**Pre-requirements:**
- [ ] Prompt 0.1 complete

```
Install the following dependencies for the TDK Design & Build website:

Animation:
- gsap (with ScrollTrigger, ScrollSmoother plugins)
- @studio-freight/lenis (smooth scroll)

NOTE: Do NOT install three or @types/three. The homepage uses an HTML5 canvas
with pre-rendered image sequences — no 3D library is required.

CMS:
- next-sanity
- @sanity/image-url
- @sanity/client
- sanity (for embedded studio)

Image CDN:
- next-cloudinary
- cloudinary

Email:
- resend

UI Utilities:
- clsx
- tailwind-merge

Dev tools:
- @types/node
- prettier-plugin-tailwindcss

After installing, create a /src/lib directory with empty placeholder files:
- /src/lib/sanity/client.ts
- /src/lib/sanity/queries.ts
- /src/lib/sanity/types.ts
- /src/lib/animations/gsap.ts
- /src/lib/animations/lenis.ts
- /src/lib/homepage/imageSequence.ts    ← image sequence preloader & canvas draw utility
- /src/lib/homepage/sequenceConfig.ts  ← frame counts, paths, timing config
- /src/lib/utils/cn.ts (implement the cn() utility using clsx + tailwind-merge)
```

**Check before moving on:**
- No peer dependency conflicts
- `pnpm dev` still runs
- `cn()` utility works

---

### PROMPT 0.3 — Folder Structure

**Pre-requirements:**
- [ ] Prompt 0.2 complete

```
Set up the complete folder structure for the TDK Design & Build website.
Do not create file content — just create the directories and empty index files
to establish the architecture.

CRITICAL: The site is built with i18n routing from day one, even though
Greek content is not ready at launch. English is the default locale.
Greek (/el) routes are scaffolded now and populated later.
This must be done at scaffold time — retrofitting i18n later is extremely painful.

Structure:
src/
  app/
    [locale]/               ← i18n route group (en | el)
      (site)/
        page.tsx            ← Home
        about/page.tsx
        services/page.tsx
        services/[slug]/page.tsx
        projects/page.tsx
        projects/[slug]/page.tsx   ← ALL projects — Armonia, Almond, every future project
        insights/page.tsx
        insights/[slug]/page.tsx
        contact/page.tsx
        privacy-policy/page.tsx
        terms/page.tsx
      layout.tsx            ← Locale layout (wraps all locale pages)
    studio/[[...tool]]/page.tsx
    api/
      contact/route.ts
      project-interest/route.ts    ← Handles interest form for ANY pre-sale project
      revalidate/route.ts
    layout.tsx              ← Root layout (no locale — wraps studio + root)
    not-found.tsx
    sitemap.ts
    robots.ts
  middleware.ts             ← Next.js i18n middleware (locale detection + redirect)
  i18n.ts                   ← Locale config: locales ['en', 'el'], defaultLocale 'en'
  components/
    ui/
      Button.tsx
      Badge.tsx
      Tag.tsx
    layout/
      Navbar.tsx
      Footer.tsx
      GridWrapper.tsx
    sections/
      Hero.tsx
      CTA.tsx
      project/                     ← All project page section components
        ProjectHero.tsx
        ProjectOverviewBar.tsx
        ProjectRendersGallery.tsx
        ProjectPhotosGallery.tsx
        ProjectDescription.tsx
        ProjectSpecs.tsx
        ProjectProgress.tsx
        ProjectUnitsTable.tsx
        ProjectInterestForm.tsx
        ProjectLocation.tsx
        ProjectRelated.tsx
        ProjectCTA.tsx
    animations/
      FadeUp.tsx
      TextReveal.tsx
      ScrollReveal.tsx
    homepage/              ← Homepage-only components (canvas + image sequence)
      HomepageCanvas.tsx   ← Canvas element + image sequence draw engine
      LoadingScreen.tsx    ← Loading screen with progress bar
      SceneHero.tsx        ← Manifesto text overlay (Scene 2)
      SceneAnatomy.tsx     ← Interactive building nodes (Scene 5)
      ScenePhilosophy.tsx  ← Manifesto statements (Scene 6)
      SceneProjects.tsx    ← Horizontal projects reel (Scene 7)
      SceneProcess.tsx     ← Process timeline (Scene 8)
      SceneContact.tsx     ← Contact CTA (Scene 9)
    sanity/
      PortableText.tsx
      SanityImage.tsx
  lib/
    sanity/
      client.ts
      queries.ts
      types.ts
    animations/
      gsap.ts
      lenis.ts
    cloudinary/
      transforms.ts          ← cloudinaryUrl() utility + standard presets
    homepage/
      imageSequence.ts     ← Frame preloading & canvas draw utilities
      sequenceConfig.ts    ← Frame counts, paths, scroll ranges config
    i18n/
      config.ts            ← locales, defaultLocale, locale labels
      translations.ts      ← Static UI strings (nav labels, button text, etc.) EN + EL
    utils/
      cn.ts
      formatDate.ts
      metadata.ts
  styles/
    globals.css
  types/
    index.ts
sanity/
  schemas/
    project.ts
    insight.ts
    category.ts
    teamMember.ts
    service.ts
    siteSettings.ts
    index.ts
  desk/
    structure.ts
  sanity.config.ts
public/
  fonts/
  images/
  videos/
    approach-mobile.mp4    ← Compressed mobile fallback video (generated by FFmpeg)
  sequences/
    assembly/              ← Assembly image sequence frames (frame-0001.webp … )
    approach/              ← Approach image sequence frames (frame-0001.webp … )
    hero-still.webp        ← Single frame: first frame of approach sequence
```

**Check before moving on:**
- All directories exist
- `pnpm dev` still runs
- No TypeScript errors from the empty files
- Navigating to `/en` renders the home page placeholder
- Navigating to `/el` also renders (empty for now, but route exists)
- Middleware redirects `/` to `/en` correctly

---

### PROMPT 0.4 — Environment Variables

**Pre-requirements:**
- [ ] Sanity project created (get project ID)
- [ ] Resend account + API key
- [ ] GA4 measurement ID

```
Create the following environment variable files for the project.

.env.local (gitignored, for development):
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your_write_token_here
RESEND_API_KEY=your_resend_key_here
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_agency_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_BASE_PATH=clients/tdkdb
SANITY_REVALIDATE_SECRET=your_random_secret_here
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_id
CONTACT_FORM_TO_EMAIL=info@tdkdb.com
INTEREST_FORM_TO_EMAIL=info@tdkdb.com
RESEND_FROM_EMAIL=noreply@tdkdb.com

.env.example (committed to git, no real values):
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=
RESEND_API_KEY=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_BASE_PATH=clients/tdkdb
SANITY_REVALIDATE_SECRET=
NEXT_PUBLIC_CLARITY_PROJECT_ID=
CONTACT_FORM_TO_EMAIL=
INTEREST_FORM_TO_EMAIL=
RESEND_FROM_EMAIL=

CRITICAL SECURITY RULE:
SANITY_API_TOKEN must NEVER be prefixed with NEXT_PUBLIC_.
It has write permission. If exposed in the browser bundle, anyone can write to the Sanity dataset.
Only use SANITY_API_TOKEN in server-side code: API routes and server components.

Vercel environment variable scoping:
- NEXT_PUBLIC_SITE_URL: Production = https://tdkdb.com, Preview = https://[auto-preview].vercel.app
- CONTACT_FORM_TO_EMAIL / INTEREST_FORM_TO_EMAIL: Production/Preview/Dev = info@tdkdb.com
  (or a test inbox for Development scope if preferred)
- All other vars: same across all scopes unless noted

Then update /src/lib/sanity/client.ts to initialize the Sanity client
using these environment variables. Include both a public client (for
frontend queries) and a server client (with token, for mutations).
```

**Check before moving on:**
- `.env.local` is in `.gitignore`
- Sanity client initializes without errors

---

### PROMPT 0.5 — Vercel Deployment Pipeline

**Pre-requirements:**
- [ ] GitHub repo pushed
- [ ] Vercel project connected to GitHub repo

```
Configure the project for Vercel deployment.

Create a vercel.json with:
- Build command: pnpm build
- Output directory: .next
- Framework preset: nextjs
- Region: fra1 (Frankfurt — closest to Cyprus)
- Security headers on all routes: X-Frame-Options DENY, X-Content-Type-Options nosniff,
  Referrer-Policy strict-origin-when-cross-origin,
  Permissions-Policy (camera=(), microphone=(), geolocation=()),
  Strict-Transport-Security max-age=31536000; includeSubDomains; preload

- Cache headers for image sequences (CRITICAL for performance):
  Source: /sequences/(.*)
  Headers: Cache-Control: public, max-age=31536000, immutable
  Reason: Sequence frames never change once generated. Cache forever at the edge.
  This means the 26MB of WebP frames only download once per user, ever.

- Cache headers for other static assets:
  Source: /fonts/(.*)
  Headers: Cache-Control: public, max-age=31536000, immutable

Update next.config.ts with:
- Strict mode: true
- Compiler: remove console logs in production
- i18n is handled by middleware (NOT next.config i18n — App Router uses middleware)
- Images: remotePatterns for res.cloudinary.com (for any next/image fallback use)
- Headers function that mirrors the security headers above
- Add redirects for www → non-www (pick non-www as canonical):
  { source: '/:path*', has: [{ type: 'host', value: 'www.tdkdb.com' }],
    destination: 'https://tdkdb.com/:path*', permanent: true }

Also create a /scripts/check-env.ts script that validates ALL required
environment variables are present at startup and logs a clear, named error
for any that are missing. Required vars to check:
NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_TOKEN, RESEND_API_KEY,
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_BASE_PATH,
NEXT_PUBLIC_SITE_URL, SANITY_REVALIDATE_SECRET,
NEXT_PUBLIC_CLARITY_PROJECT_ID, CONTACT_FORM_TO_EMAIL,
INTEREST_FORM_TO_EMAIL, RESEND_FROM_EMAIL
```

**Check before moving on:**
- Project deploys to Vercel preview URL
- Security headers present (check with https://securityheaders.com)

---

## PHASE 1 – PRD ORIENTATION & OPTIMIZATION

**Goal:** Feed Cursor the full PRD so it understands the entire project before writing a line of UI.
**When:** Scaffolding is complete. No UI exists yet.

---

### PROMPT 1.1 — Feed the Master Plan

**Pre-requirements:**
- [ ] Phase 0 complete
- [ ] `TDK_MASTER_PLAN.md` in the project root

```
I'm sharing our project's Master Plan document with you. Read it fully and
internalize it. This is the PRD for the entire TDK Design & Build website.

[PASTE FULL CONTENTS OF TDK_MASTER_PLAN.md HERE]

After reading, respond with:
1. A bullet list of every technical decision that has been finalized
2. A bullet list of every decision still marked as TBD or To Discuss
3. Any architectural conflicts or risks you notice
4. Your recommended order for implementing the pages (based on dependencies)

Do not write any code yet.
```

**Check before moving on:**
- Cursor's response shows it understood the stack, structure, and CMS
- Note any risks it flags — they are probably real

---

### PROMPT 1.2 — Feed the Homepage Experience Doc

**Pre-requirements:**
- [ ] Prompt 1.1 complete
- [ ] `TDK_HOMEPAGE_EXPERIENCE.md` in the project root

```
Now read the homepage-specific specification. The homepage is completely
separate from all other pages in terms of implementation — it's a cinematic
scrollytelling experience driven by image sequences on an HTML5 canvas.
All other pages follow the master plan.

[PASTE FULL CONTENTS OF TDK_HOMEPAGE_EXPERIENCE.md HERE]

After reading, respond with:
1. The image sequence preloading strategy you'll implement (prioritizing first 30 frames)
2. The GSAP ScrollTrigger patterns you'll use for each scene (assembly RAF, approach scrub, etc.)
3. The asset dependencies — what files must exist in /public/sequences/ before each scene can be built
4. Your recommended component breakdown for the homepage (HomepageCanvas vs HTML overlays)
5. Any performance risks around the image sequences and how you'd mitigate them

Do not write any code yet.
```

**Check before moving on:**
- Cursor understands the canvas + image sequence approach (NOT Three.js)
- It correctly identified GSAP ScrollTrigger scrubbing `currentFrame` (not a camera path)
- It understands the two sequences: assembly (time-based RAF) vs approach (scroll-scrubbed)

---

### PROMPT 1.3 — Architecture Decision Record

```
Based on both documents, create an Architecture Decision Record (ADR) for this project.

Save it as /docs/ADR.md

Include decisions on:
- Rendering strategy per page type (SSG, SSR, ISR, client-side)
- State management approach (no Redux — use what's appropriate)
- Image sequence integration pattern with Next.js App Router
  (canvas is client-only, must be wrapped in dynamic import with ssr: false)
- GSAP ScrollTrigger initialization pattern (how to handle SSR)
- Lenis initialization and cleanup pattern
- Sanity data fetching pattern (server components vs client)
- Image optimization strategy (WebP sequences vs Next.js Image — they are separate concerns)
- Font loading strategy for Josefin Sans
- Animation kill/cleanup strategy for route transitions
- Mobile detection and fallback strategy for the homepage canvas scene
  (canvas + image sequence on desktop, autoplay MP4 on mobile)
- Canvas memory management (when to null out image arrays after Scene 4 completes)

For each decision, include: Context, Decision, Consequences.
```

**Check before moving on:**
- ADR covers the SSR/client-side boundary for the canvas component
- The `dynamic(() => import(...), { ssr: false })` pattern for HomepageCanvas is documented
- Mobile fallback strategy is clearly defined
- Save `/docs/ADR.md` — Cursor will reference it throughout the build

---

## PHASE 2 – DESIGN SYSTEM & GLOBAL TOKENS

**Goal:** Every visual decision — color, type, spacing, easing — defined in one place before any component is built.
**When:** Phase 1 complete.

---

### PROMPT 2.1 — CSS Custom Properties & Tailwind Config

**Pre-requirements:**
- [ ] Phase 1 complete
- [ ] Josefin Sans added to `/public/fonts/` (download from Google Fonts — variable font)

```
Build the complete design token system for TDK Design & Build.

In /src/styles/globals.css, define all CSS custom properties:

Colors (from TDK_HOMEPAGE_EXPERIENCE.md Section 14):
--color-void: #0D0D0D
--color-surface: #1A1A1A
--color-paper: #F5F0E8
--color-stone: #8C8C8C
--color-threshold: #66979f
--color-glass: rgba(255, 255, 255, 0.04)
--color-border: rgba(255, 255, 255, 0.08)

Typography:
--font-primary: 'Josefin Sans', sans-serif
--font-mono: 'JetBrains Mono', monospace

Motion (from TDK_HOMEPAGE_EXPERIENCE.md Section 16):
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)
--ease-entrance: cubic-bezier(0.0, 0.0, 0.2, 1)
--ease-exit: cubic-bezier(0.4, 0.0, 1, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-cinematic: cubic-bezier(0.25, 0.46, 0.45, 0.94)
--duration-instant: 150ms
--duration-fast: 300ms
--duration-medium: 500ms
--duration-slow: 800ms
--duration-cinematic: 1200ms
--stagger-tight: 40ms
--stagger-normal: 80ms
--stagger-loose: 120ms

Spacing:
--space-unit: 8px
--section-padding: clamp(80px, 10vw, 160px)
--content-max: 1440px
--text-max: 680px

Then update tailwind.config.ts to:
- Extend theme with all these tokens as Tailwind utilities
- Add Josefin Sans and JetBrains Mono to fontFamily
- Add all color tokens to colors
- Add all easing tokens to transitionTimingFunction
- Add all duration tokens to transitionDuration
- Set the base font to Josefin Sans
- Add a custom text-selection color (threshold teal on void background)

Also add @font-face declarations for Josefin Sans (variable font from /public/fonts/)
and JetBrains Mono. Use font-display: swap.
```

**Check before moving on:**
- All CSS variables accessible in browser DevTools
- Tailwind autocomplete shows custom tokens in editor
- Fonts load correctly in browser

---

### PROMPT 2.2 — Cloudinary URL Utility

**Pre-requirements:**
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set in `.env.local`
- [ ] Cloudinary folder `clients/tdkdb/` created in agency account

```
Build the Cloudinary image URL utility.

File: /src/lib/cloudinary/transforms.ts

Requirements:

1. Main function: cloudinaryUrl(publicId, options)
   - publicId: string (e.g. "clients/tdkdb/armonia/exterior/hero")
   - options: { width?, height?, quality?, format?, crop? }
   - quality default: 'auto'
   - format default: 'auto' (serves WebP/AVIF automatically per browser)
   - crop default: 'fill'
   - Returns the full Cloudinary URL with transforms applied

2. Standard preset functions (call cloudinaryUrl internally):
   - heroImage(publicId): width 1920, q_auto, f_auto
   - projectCard(publicId): width 800, height 600, c_fill, q_auto, f_auto
   - galleryImage(publicId): width 1400, q_auto, f_auto
   - constructionPhoto(publicId): width 1000, q_auto, f_auto
   - teamPhoto(publicId): width 400, height 400, c_fill, q_auto, f_auto
   - ogImage(publicId): width 1200, height 630, c_fill, q_auto, f_auto

3. Export all as named exports.

4. Write a simple test in the same file (commented out):
   // console.log(heroImage('clients/tdkdb/armonia/exterior/hero'))
   // Expected: https://res.cloudinary.com/[cloud]/image/upload/w_1920,q_auto,f_auto,c_fill/clients/tdkdb/armonia/exterior/hero

Important notes for Cursor:
- NEVER hardcode the cloud name — always use process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- NEVER use the next/image component with Cloudinary URLs — use a standard <img> tag
  with the Cloudinary URL. The Cloudinary URL already handles all optimization.
- All Sanity image fields store Cloudinary public IDs as plain strings (not Sanity image objects).
```

**Check before moving on:**
- `cloudinaryUrl()` returns a valid URL with correct transform string
- Presets return correct dimensions
- Cloud name comes from env var (verify by checking the output URL)

---

### PROMPT 2.3 — Base Typography Styles

```
Apply the typography system globally.

In globals.css, after the CSS variables, add base styles:

1. Reset: Use a modern CSS reset (not normalize.css — write a minimal one)

2. Base body styles:
   - background: var(--color-void)
   - color: var(--color-paper)
   - font-family: var(--font-primary)
   - font-size: 16px
   - line-height: 1.6
   - -webkit-font-smoothing: antialiased
   - -moz-osx-font-smoothing: grayscale

3. Typography scale classes (use as Tailwind @layer components):
   .text-display-xl  → clamp(64px, 8vw, 120px), weight 300, line-height 1.0, letter-spacing 0.05em
   .text-display-lg  → clamp(48px, 6vw, 96px), weight 300, line-height 1.1, letter-spacing 0.05em
   .text-display-md  → clamp(36px, 4vw, 64px), weight 400, line-height 1.1
   .text-heading     → clamp(24px, 3vw, 40px), weight 600, line-height 1.2
   .text-body-lg     → 18px, weight 300, line-height 1.7
   .text-body        → 16px, weight 400, line-height 1.6
   .text-label       → 11px, weight 600, uppercase, letter-spacing 0.2em
   .text-mono        → 13px, font-family mono, weight 400

4. Text selection:
   ::selection { background: var(--color-threshold); color: var(--color-void); }

5. Scrollbar styling (thin, matches brand):
   Dark background, threshold-colored thumb, only on desktop
```

**Check before moving on:**
- All type classes visible and correct in Storybook or a test page
- Font rendering is smooth (antialiased)
- Selection color is teal on void

---

### PROMPT 2.4 — GSAP & Lenis Initialization

```
Set up GSAP and Lenis as global singletons that work correctly with
Next.js App Router (no SSR errors, proper cleanup on unmount).

In /src/lib/animations/gsap.ts:
- Import gsap and register ScrollTrigger and ScrollSmoother plugins
- Export a gsapInit() function that registers plugins only on client side
- Export the gsap instance
- Export a killAllScrollTriggers() cleanup function

In /src/lib/animations/lenis.ts:
- Create a Lenis singleton
- Export initLenis() that creates Lenis instance and connects it to GSAP ticker
- Export getLenis() to access the instance anywhere
- Export destroyLenis() for cleanup
- Lenis config: duration 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))

Create /src/components/animations/SmoothScrollProvider.tsx:
- A client component that wraps children
- Initializes Lenis on mount
- Connects Lenis RAF to GSAP ticker
- Destroys on unmount
- Respects prefers-reduced-motion: disables Lenis if user prefers reduced motion
- Does NOT scroll-jack — just smooths native scroll
  (scroll-jacking is handled per-scene in the homepage components)

Add SmoothScrollProvider to the root layout, wrapping all children.
```

**Check before moving on:**
- Scroll is visibly smoother on a test page with lots of content
- No SSR hydration errors in console
- Lenis destroys cleanly when navigating between pages

---

## PHASE 3 – GLOBAL COMPONENTS

**Goal:** Build the shared components used across all pages (except homepage-specific ones).
**When:** Phase 2 complete. Design system exists. Logo SVG files confirmed.

**Pre-requirement: Favicon files must be ready before this phase completes.**
If not already done, generate from logo SVG:
- favicon.ico (16×16 + 32×32), apple-icon.png (180×180), icon.png (32×32), icon-512.png (512×512)
- Place all in /src/app/ — Next.js App Router serves them automatically from this location
- Create /src/app/manifest.ts:
  ```typescript
  export default function manifest() {
    return {
      name: 'TDK Design & Build',
      short_name: 'TDK',
      description: 'Residential development — design, architecture, and construction. Nicosia, Cyprus.',
      start_url: '/',
      display: 'standalone',
      background_color: '#0D0D0D',
      theme_color: '#0D0D0D',
      icons: [
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    }
  }
  ```

---

### PROMPT 3.1 — Navbar

```
Build the Navbar component for TDK Design & Build.

File: /src/components/layout/Navbar.tsx

Specifications:
- Position: fixed top, full width, z-index 100
- Default state: transparent background, --color-paper text
- Scrolled state (after 80px scroll): background rgba(13,13,13,0.85),
  backdrop-filter blur(20px), border-bottom 1px solid var(--color-border)
- Transition: background fades in over 300ms --ease-smooth

Layout:
- Left: TDK logotype (SVG, links to /)
- Center: Navigation links — About, Services, Projects, Insights
  (hidden on mobile, visible from lg breakpoint)
- Right: "Contact" as a ghost button + language switcher + hamburger menu (mobile only)

Language switcher:
- Displays: "EN | EL" (two options separated by a pipe character)
- EN: always active (white text, full opacity)
- EL: present but visually disabled (--color-stone text, 40% opacity, not-allowed cursor)
  Add a tooltip on hover: "Greek coming soon"
- When Greek is activated in future: EL becomes a real link to /el/[current-path]
  The switcher reads the current locale from the [locale] route param and highlights accordingly
- Implementation: read locale from Next.js useParams() or pass as prop from server component
- Both options use text-label style, uppercase
- No border, no background — just the text with the pipe divider

Desktop link hover state:
- A thin line draws under the text from left to right (not an underline —
  a separate element that scales from scaleX(0) to scaleX(1))
- Color: --color-paper
- Duration: --duration-fast

Active page:
- The line is always visible (scaleX(1)) for the current page

Mobile menu:
- Full-screen overlay, background --color-void
- Links appear staggered (each 80ms after the previous) via GSAP
- Links are large (text-display-md size), centered
- A close button (×) in top right
- Overlay slides in from right (translateX 100% → 0)

The Navbar must be a server component wrapper with a client component
for the scroll-detection and mobile menu logic.

Use the logo as an SVG imported directly (not an img tag).
For now, use a text placeholder "TDK" as the logo — we'll replace with SVG later.
```

**Check before moving on:**
- Navbar transparent on load, blurred on scroll
- Mobile menu opens/closes with animation
- Active page link has underline
- No layout shift on scroll

---

### PROMPT 3.2 — Footer

```
Build the Footer component for TDK Design & Build.

File: /src/components/layout/Footer.tsx

Specifications:
- Background: --color-void
- Top border: 1px solid var(--color-border)
- Arrives via a curtain reveal animation (triggered by ScrollTrigger when footer enters viewport)
- The curtain: a --color-surface panel that starts covering the footer and slides up to reveal it

Layout (3-column grid on desktop, stacked on mobile):
Column 1 — Brand:
  Large TDK logotype (3x nav logo size, text placeholder for now)
  Tagline: "Design. Build. Last." in text-label style
  Address: Nafpliou 1, Lakatameia, Nicosia, Cyprus
  Email: info@tdkdb.com
  Phone: (placeholder)

Column 2 — Navigation:
  Heading: "EXPLORE" (text-label)
  Links: Home, About, Services, Projects, Insights, Contact

Column 3 — Social:
  Heading: "CONNECT" (text-label)
  Links: Instagram, LinkedIn, Facebook
  Each link has an arrow icon that animates right on hover

Bottom bar (full width, border-top):
  Left: © 2025 TDK Design & Build. All rights reserved.
  Right: Privacy Policy · Terms

All footer links: color --color-stone, hover transition to --color-paper over --duration-fast
```

**Check before moving on:**
- Curtain reveal works on scroll
- Layout correct on all breakpoints
- All links functional (even if pages don't exist yet)

---

### PROMPT 3.3 — Button Component

```
Build the Button component system.

File: /src/components/ui/Button.tsx

Variants:

1. Primary:
   - Background: --color-paper, text: --color-void
   - Hover: background --color-threshold, text --color-void
   - Transition: --duration-fast --ease-smooth
   - No border radius (rectilinear)
   - Padding: 16px 32px
   - Font: text-label style (uppercase, tracked)
   - Arrow icon that animates right on hover (translateX 4px)

2. Ghost:
   - Background: transparent, text: --color-paper
   - Border: 1px solid var(--color-border)
   - Hover: border-color --color-paper
   - Same padding and font as primary

3. Text (link-style):
   - No background, no border
   - text: --color-stone
   - Hover: text --color-paper
   - Underline sweep animation on hover

Props: variant, size (sm/md/lg), href (renders as <a> if provided, <button> otherwise),
       onClick, children, className, disabled, magnetic (boolean)

Magnetic behavior (when magnetic prop is true):
- On mouse enter: attach mousemove listener
- Calculate cursor distance from button center
- Apply translateX/Y to move button max 12px toward cursor
- On mouse leave: spring back to origin (--ease-spring, 400ms)
- Only active on desktop (pointer: fine media query)

Export as default, also export individual variants as named exports.
```

**Check before moving on:**
- All three variants render correctly
- Magnetic effect works smoothly
- Component renders as `<a>` when `href` is provided
- Disabled state is visually distinct

---

### PROMPT 3.4 — Reusable Animation Wrappers

```
Build the animation wrapper components used across all interior pages.
These are NOT used on the homepage (which has its own GSAP animations).
These use GSAP ScrollTrigger for scroll-reveal animations.

All components must:
- Be client components
- Initialize GSAP with the gsapInit() function from /src/lib/animations/gsap.ts
- Use Intersection Observer or GSAP ScrollTrigger (prefer ScrollTrigger)
- Respect prefers-reduced-motion (skip animation if true)
- Accept a className prop
- Clean up ScrollTrigger on unmount

Components to build:

1. /src/components/animations/FadeUp.tsx
   Props: children, delay (ms), duration (ms), distance (px, default 40)
   Effect: children fade in + translateY from +distance to 0
   Trigger: when element enters viewport at bottom 85%

2. /src/components/animations/TextReveal.tsx
   Props: children (must be a string), tag ('h1'|'h2'|'h3'|'p'), delay
   Effect: text is clipped — a mask slides from left to right revealing it
   Uses CSS clip-path: inset(0 100% 0 0) → inset(0 0% 0 0)
   Trigger: viewport entry

3. /src/components/animations/StaggerGroup.tsx
   Props: children (array), stagger (ms, default 80), trigger ('viewport'|'immediate')
   Effect: wraps each child in a FadeUp, with staggered delays
   Trigger: when group enters viewport (first child visible)

4. /src/components/animations/CountUp.tsx
   Props: target (number), suffix (string, e.g. '+'), duration (ms)
   Effect: number counts from 0 to target when in viewport
   Uses GSAP's built-in counter animation

5. /src/components/animations/HorizontalReveal.tsx
   Props: children, direction ('left'|'right')
   Effect: element slides in from direction, fade + translate
   Trigger: viewport entry
```

**Check before moving on:**
- All animations work correctly on a test page
- No animation fires before element is in view
- Reduced motion skips animation (element just appears)
- No memory leaks (check with React DevTools)

---

### PROMPT 3.5 — Grid & Layout Utilities

```
Build layout utility components.

1. /src/components/layout/GridWrapper.tsx
   - Centers content, applies max-width (--content-max: 1440px)
   - Applies horizontal padding: clamp(24px, 5vw, 80px)
   - Props: children, className, as (HTML element, default 'div')

2. /src/components/layout/Section.tsx
   - Wraps a page section with consistent vertical padding (--section-padding)
   - Props: children, className, id, background ('void'|'surface'|'custom')

3. /src/components/layout/Divider.tsx
   - A thin 1px horizontal line (--color-border)
   - Animates: draws from left to right via scaleX on scroll
   - Props: className, delay

4. Update /src/app/[locale]/(site)/layout.tsx to:
   - Include Navbar and Footer on all pages
   - NOT include Navbar/Footer on the homepage
     (homepage has its own embedded nav/footer within the cinematic experience)
   - Load Josefin Sans font (next/font/google, display: swap, preload: true)
   - Load JetBrains Mono (same)
   - Set CSS variables for font families
   - Include SmoothScrollProvider
```

**Check before moving on:**
- Layout renders on a test interior page
- Fonts load without FOUT (flash of unstyled text)
- Section padding is consistent
- GridWrapper centers content correctly

---

## PHASE 4 – HOMEPAGE (SCENE BY SCENE)

**Goal:** Build the cinematic homepage as specified in TDK_HOMEPAGE_EXPERIENCE.md.
**When:** All global components exist. Design system is locked. Image sequences have been
generated in Higgsfield and processed with FFmpeg (frames live in `/public/sequences/`).

> ⚠️ **Before starting Phase 4:** Confirm both image sequence folders exist and are populated:
> - `/public/sequences/assembly/frame-0001.webp` through `frame-XXXX.webp`
> - `/public/sequences/approach/frame-0001.webp` through `frame-XXXX.webp`
> - `/public/sequences/hero-still.webp`
> - `/public/videos/approach-mobile.mp4`
>
> Also feed Cursor the full `TDK_HOMEPAGE_EXPERIENCE.md` at the start of EVERY homepage session.

---

### PROMPT 4.0 — Feed Homepage Context (Run at Start of Every Homepage Session)

```
Before we build anything, re-read the homepage specification:

[PASTE FULL CONTENTS OF TDK_HOMEPAGE_EXPERIENCE.md HERE]

Also re-read the ADR at /docs/ADR.md.

Confirm you understand these critical facts:
1. The homepage uses HTML5 canvas + image sequences, NOT Three.js or any 3D library
2. Two image sequences live in /public/sequences/assembly/ and /public/sequences/approach/
3. The assembly sequence plays time-based (RAF loop) — NOT scroll-driven
4. The approach sequence is scroll-scrubbed via GSAP ScrollTrigger on video.currentTime equivalent
5. After Scene 4 (Threshold), the canvas is hidden — Scenes 5–10 are standard HTML
6. HomepageCanvas.tsx must be dynamically imported with { ssr: false } (canvas is client-only)
7. Mobile devices get an autoplay MP4 video instead of the canvas experience

Respond with confirmation only. No code yet.
```

---

### PROMPT 4.1 — Image Sequence Config & Canvas Engine

**Pre-requirements:**
- [ ] Both image sequence folders populated in `/public/sequences/`
- [ ] Frame counts recorded (run `ls public/sequences/assembly/ | wc -l` in terminal)

```
Build the image sequence configuration and canvas engine for the TDK homepage.
Reference: TDK_HOMEPAGE_EXPERIENCE.md, Sections 3 and 4.

1. /src/lib/homepage/sequenceConfig.ts
   
   Export a SEQUENCE_CONFIG object with the following shape.
   Fill in the actual frame counts from the real files in /public/sequences/:
   
   export const SEQUENCE_CONFIG = {
     assembly: {
       frameCount: 192,          // ← replace with actual count from ls command
       fps: 24,
       path: '/sequences/assembly/frame-',
       extension: '.webp',
     },
     approach: {
       frameCount: 180,          // ← replace with actual count from ls command
       fps: 24,
       path: '/sequences/approach/frame-',
       extension: '.webp',
     },
   } as const

2. /src/lib/homepage/imageSequence.ts
   
   Export two functions:
   
   a) preloadSequence(config, onProgress: (pct: number) => void): Promise<HTMLImageElement[]>
      - Creates an array of Image objects with length = config.frameCount
      - Loads first 30 frames immediately (await Promise.all)
      - Begins loading remaining frames in background (no await — fire and forget)
      - Calls onProgress(loaded / total) as each frame completes
      - Returns the array (partially populated — consumer must handle undefined frames)
      - Frame filename format: frame-0001.webp, frame-0002.webp (4-digit zero-padded)
   
   b) drawFrame(ctx: CanvasRenderingContext2D, frames: HTMLImageElement[], index: number): void
      - Clears the canvas (ctx.clearRect)
      - If frames[index] is loaded: draws it (ctx.drawImage) scaled to fill the canvas
      - If frames[index] is undefined (not yet loaded): draws the closest loaded frame before it
        (walk backward in the array until a loaded frame is found)
      - This prevents blank frames during fast scrubbing before background load is done

3. /src/components/homepage/HomepageCanvas.tsx (client component)
   
   This is the heart of the homepage. It must be exported as default
   and dynamically imported in page.tsx with { ssr: false }.
   
   Structure:
   - A full-screen <canvas> element (position: fixed, top:0, left:0, width:100vw, height:100vh, z-index:0)
   - The canvas width and height attrs must be set to actual pixel dimensions (devicePixelRatio-aware)
   - A scroll container div (position: relative, height: 760vh) — this is what the user scrolls
   - Both elements rendered inside a fragment
   
   State:
   - assemblyFrames: HTMLImageElement[]
   - approachFrames: HTMLImageElement[]
   - loadProgress: number (0–1)
   - phase: 'loading' | 'assembly' | 'hero' | 'approach' | 'threshold' | 'complete'
   
   On mount:
   - Begin preloading both sequences in parallel
   - Update loadProgress with combined progress
   - When first 30 frames of assembly are ready: set phase = 'assembly'
   
   Expose phase state to sibling components via a context or ref callback
   (other components need to know when assembly is done to show hero text).
   
   Canvas resize:
   - On window resize: recalculate canvas dimensions (account for devicePixelRatio)
   - Redraw current frame immediately after resize

4. /src/app/[locale]/(site)/page.tsx — Homepage Root
   
   Import HomepageCanvas dynamically:
   const HomepageCanvas = dynamic(() => import('@/components/homepage/HomepageCanvas'), { ssr: false })
   
   The page.tsx should have NO global layout wrapper (Navbar/Footer excluded at layout level).
   Return only:
   - <HomepageCanvas />
   - Scene 5–10 components (below the canvas scroll container)
   These stack vertically in normal document flow.
```

**Check before moving on:**
- Canvas renders full-screen with no white border or overflow
- Console shows frame loading progress (log it temporarily)
- Resize handler works (test by dragging browser window edge)
- No TypeScript errors
- `dynamic` import prevents SSR errors

---

### PROMPT 4.2 — Loading Screen & Assembly Playback (Scene 1)

**Pre-requirements:**
- [ ] Prompt 4.1 complete — canvas renders, sequences are preloading

```
Build the loading screen and the assembly sequence playback (Scene 1).
Reference: TDK_HOMEPAGE_EXPERIENCE.md, Sections 4 and 6.

1. /src/components/homepage/LoadingScreen.tsx
   
   A full-screen overlay (position: fixed, inset: 0, z-index: 100, background: --color-void).
   
   Contents (centered, both axes):
   - "TDK" in text-display-md style, letter-spacing: 0.3em, color: --color-paper
   - A thin horizontal line (1px tall, 200px wide) below the text
   - An inner span on the line that fills from left to right via scaleX transform
     (transform-origin: left center — never animate width, always scaleX)
   - No percentage text
   
   Props:
   - progress: number (0–1) — drives the scaleX of the fill line
   - onComplete: () => void — called when component should exit
   
   Behavior:
   - When progress reaches 1.0: wait 200ms, then fade out the "TDK" text (opacity 0, 400ms)
   - Then fade out the entire loading screen (opacity 0, 500ms)
   - Call onComplete() when fade finishes
   
   During loading screen: document.body.style.overflow = 'hidden' (prevent scroll)
   On unmount (loading complete): document.body.style.overflow = 'auto' (restore scroll)

2. Assembly playback in HomepageCanvas.tsx
   
   After loading completes and phase transitions to 'assembly':
   
   Implement a RAF-based playback function:
   
   function playAssembly(frames, canvas, ctx, onComplete) {
     let startTime = null
     const DURATION = 5000 // 5 seconds
     
     function tick(timestamp) {
       if (!startTime) startTime = timestamp
       const progress = Math.min((timestamp - startTime) / DURATION, 1)
       const frameIndex = Math.floor(progress * (frames.length - 1))
       
       drawFrame(ctx, frames, frameIndex)
       
       if (progress < 1) {
         requestAnimationFrame(tick)
       } else {
         onComplete()
       }
     }
     requestAnimationFrame(tick)
   }
   
   On assembly complete:
   - Set phase = 'hero'
   - Unlock scroll (overflow: auto already set by LoadingScreen)
   - Signal to SceneHero to show the manifesto text
   
   The canvas now holds the final assembly frame (= first approach frame = the hero still).
   Nothing else changes on canvas during the hero state.

3. Wire up to page.tsx
   
   HomepageCanvas manages LoadingScreen visibility via its loadProgress state.
   When loadProgress hits 1.0: LoadingScreen fades out, assembly begins.
   When assembly completes: SceneHero becomes visible (pass isAssemblyComplete prop).
```

**Check before moving on:**
- Loading screen fills its bar proportional to image loading progress
- Loading screen fades out cleanly (no pop or flash)
- Assembly plays at ~5 seconds, frames advance smoothly
- Final frame (full assembled building) remains on canvas
- Scroll is locked during assembly, unlocked after

---

### PROMPT 4.3 — Hero State & Manifesto Text (Scene 2)

```
Build the hero state with manifesto typography overlay (Scene 2).
Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 7.

Create /src/components/homepage/SceneHero.tsx (client component).

This is an HTML overlay (position: fixed, pointer-events: none, z-index: 10)
that appears after the building assembly completes. The canvas continues
showing the final assembly frame (= hero still) beneath it.

Props:
- isVisible: boolean (controlled by HomepageCanvas via isAssemblyComplete)
- scrollProgress: number (0–1, passed down from the approach ScrollTrigger)

1. Text fragments — use the positions, sizes, and content from Section 7:
   Each fragment is an absolutely positioned div.
   
   Fragment appearance animation (triggered when isVisible becomes true):
   Each fragment: opacity 0 → 1, translateY 20px → 0
   Duration: --duration-slow (800ms), --ease-smooth
   
   Staggered delays (from Section 7):
   - "DESIGNED TO LAST."        → 200ms delay
   - "NOT JUST BUILT. CRAFTED." → 400ms delay
   - "Every line has a reason." → 600ms delay (italic)
   - "TDK DESIGN & BUILD"       → 700ms delay (text-label style)
   - Scroll indicator           → 900ms delay

2. Mouse parallax on text fragments:
   - Global mousemove listener (attach only when isVisible = true, remove on false)
   - Each fragment has a data-depth attribute (values 0.01 to 0.03)
   - On mousemove: translate each fragment by (mouseX - centerX) * depth
   - Use GSAP quickSetter for performance (no layout thrashing)

3. Scroll-out behavior (driven by scrollProgress prop):
   - When scrollProgress 0 → 0.4: each fragment fades to opacity 0 and translates outward
   - Implemented as a useEffect watching scrollProgress, driving GSAP quickTo

4. Scroll indicator:
   Position: bottom center, 40px from bottom
   "SCROLL" in text-label style + vertical line below with sweeping mask animation
   Disappears (opacity 0, instant) when scrollProgress first exceeds 0.02

HomepageCanvas mounts SceneHero after assembly completes.
HomepageCanvas passes the current approach scroll progress (0–1) as a prop.
```

**Check before moving on:**
- Text appears after building assembly
- Parallax on mouse move feels subtle, not distracting
- Text fades correctly as scroll begins
- Scroll indicator disappears on first scroll

---

### PROMPT 4.4 — Approach Sequence Scroll Scrubbing (Scene 3)

```
Build the scroll-driven approach image sequence (Scene 3).
Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 8.

In HomepageCanvas.tsx, add the approach scroll system:

1. GSAP ScrollTrigger setup (add inside useEffect after sequences are loaded):

   const approachState = { frame: 0 }
   
   ScrollTrigger.create({
     trigger: '#scroll-container',       // the 760vh div
     start: 'top top',
     end: '+=150%',                      // 150vh of scroll drives the full approach
     scrub: 1.5,                         // 1.5s lag = cinematic smoothness
     onUpdate: (self) => {
       approachState.frame = self.progress * (approachFrames.length - 1)
       const i = Math.round(approachState.frame)
       drawFrame(ctx, approachFrames, i)
       
       // Pass progress to SceneHero for text fade-out
       setApproachProgress(self.progress)
     }
   })
   
   Important: Kill this ScrollTrigger in the useEffect cleanup function.

2. CSS Vignette overlay (position: fixed, pointer-events: none, z-index: 5):
   
   background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)
   
   Its opacity is driven by approach scroll progress:
   - 0% progress → opacity 0.2
   - 100% progress → opacity 0.8
   Use a separate GSAP ScrollTrigger scrub on its opacity.

3. Entrance light glow (position: fixed, pointer-events: none, z-index: 6):
   A radial warm glow that appears as the camera approaches the door.
   
   background: radial-gradient(circle at 50% 55%, rgba(245,166,35,0.15) 0%, transparent 60%)
   
   Starts opacity 0, fades in from 60% → 100% approach progress.
   Driven by the same ScrollTrigger (use a separate gsap.to with the same trigger).

4. Scroll progress sharing:
   HomepageCanvas holds approachProgress state (number 0–1).
   Pass this as a prop to SceneHero (for text fade-out).
   
   Update approachProgress in the onUpdate callback of the ScrollTrigger.
```

**Check before moving on:**
- Approach frames draw smoothly as user scrolls
- No blank frames during scrubbing (drawFrame fallback works)
- Scrubbing backward (scroll up) also works correctly
- Vignette darkens as scroll progresses
- Warm glow appears in final portion of approach
- Hero text fades in first 40% of approach

---

### PROMPT 4.5 — Threshold Transition & Canvas Teardown (Scene 4)

```
Build the threshold crossing transition and canvas cleanup (Scene 4).
Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 9.

In HomepageCanvas.tsx, add the threshold system as a continuation of the
approach ScrollTrigger (additional 20vh after the 150vh approach ends):

1. The Bloom Overlay div (position: fixed, inset: 0, z-index: 20, pointer-events: none):
   
   background: radial-gradient(
     circle at 50% 55%,
     rgba(245, 166, 35, 0) 0%,
     rgba(255, 248, 230, 0) 0%
   )
   opacity: 0
   
   Starts fully transparent. Managed via a ref (not React state — avoids re-renders).

2. Threshold ScrollTrigger (immediately after approach ends):
   
   ScrollTrigger.create({
     trigger: '#scroll-container',
     start: '+=150%',              // picks up exactly where approach ended
     end: '+=20%',                 // 20vh to complete the bloom
     scrub: 1,
     onUpdate: (self) => {
       const p = self.progress
       if (p <= 0.5) {
         // Bloom expands: 0% → 50% progress
         const intensity = p * 2  // 0 → 1
         bloomRef.current.style.background = `radial-gradient(
           circle at 50% 55%,
           rgba(245,166,35,${intensity * 0.9}) 0%,
           rgba(255,253,247,${intensity * 0.95}) 60%
         )`
         bloomRef.current.style.opacity = String(intensity)
       } else {
         // Bloom recedes: 50% → 100% progress
         const intensity = 1 - ((p - 0.5) * 2)  // 1 → 0
         bloomRef.current.style.opacity = String(intensity)
       }
     },
     onLeave: () => {
       // Bloom complete — hide canvas, show Scene 5
       canvasRef.current.style.opacity = '0'
       canvasRef.current.style.transition = 'opacity 0.3s'
       setTimeout(() => {
         canvasRef.current.style.display = 'none'  // free GPU memory
         // Null out frame arrays to free RAM
         setAssemblyFrames([])
         setApproachFrames([])
       }, 300)
       setPhase('complete')
     }
   })

3. After canvas is hidden:
   The bloom div also hides (opacity 0 from the onUpdate logic).
   Scene 5 (Anatomy) is now the first visible element.
   Normal page scroll continues from here — no more scroll-jacking.

4. Audio comment (for future enhancement):
   // AUDIO_CUE: threshold_bloom — a soft ambient chime could play here
```

**Check before moving on:**
- Bloom appears and expands as scroll reaches the threshold
- Bloom recedes correctly
- Canvas becomes invisible after threshold (check in DevTools: display none)
- Scene 5 is visible after canvas hides
- Frame arrays are cleared (check memory in DevTools performance tab)

---

### PROMPT 4.6 — Anatomy Section (Scene 5)

```
Build the interactive building anatomy section (Scene 5).

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 8.

Create /src/components/homepage/SceneAnatomy.tsx

This is a PINNED section — when it enters the viewport, it pins for 100vh of scroll,
during which the user interacts with building nodes.

Layout:
- Full screen, two columns (50/50)
- Left: text panel (position: relative, overflow hidden)
- Right: building render image + interactive nodes

Right panel:
- Use the front-facing Armonia render (standard <img>, not canvas — we're past the canvas sequences)
- File: /public/images/armonia/front-facing.webp
- Image fills the right half, object-fit: cover

Node component (for each of the 6 nodes):
- Position: absolute, placed precisely on the building render
- Visual: outer ring (24px, thin stroke, animated pulse) + inner dot (6px, filled)
- Color: --color-paper at 40% opacity (default), --color-threshold at 100% (active)
- Pulse animation: ring scales from 1.0 to 1.4 and fades, repeating, 2s loop, staggered start per node

The 6 nodes and their positions (as % of image width/height):
Node 1 – Entrance:    left: 48%, top: 72%
Node 2 – Facade:      left: 50%, top: 40%
Node 3 – Balconies:   left: 35%, top: 52%
Node 4 – Glazing:     left: 65%, top: 45%
Node 5 – Rooftop:     left: 50%, top: 18%
Node 6 – Landscape:   left: 30%, top: 82%

Left panel — default state:
- "EXPLORE THE BUILDING" in text-label style, centered vertically
- A thin line above and below the text

Left panel — node active state (on hover):
- Previous text: translateY(-100%) + opacity 0 (exits upward), duration 300ms
- New text slides in from below: translateY(100%) → 0 + opacity 0 → 1
- Content: heading (text-heading) + body (text-body-lg)
- Use the copy from TDK_HOMEPAGE_EXPERIENCE.md Section 8.2 for each node
- A thin threshold line (2px, --color-threshold) appears above the heading

Connector line:
- When a node is active: a thin SVG line draws from the node to the left edge of the screen
- The line is an SVG overlay spanning the full section
- Path draws via stroke-dashoffset animation, duration 400ms

After interaction (user has hovered 3+ nodes, or 8 seconds):
- "↓ CONTINUE" appears at bottom center in text-label style
- On next scroll: section unpins and scroll continues
```

**Check before moving on:**
- All 6 nodes are positioned correctly on the building image
- Text transitions are smooth (no jump or flash)
- Connector line draws correctly
- Section pins and unpins properly
- Works on touch (tap to activate node on mobile)

---

### PROMPT 4.7 — Philosophy Section (Scene 6)

```
Build the manifesto/philosophy scroll section (Scene 6).

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 9.

Create /src/components/homepage/ScenePhilosophy.tsx

This section is 120vh tall. Each statement occupies ~24vh of scroll.
Statements appear via clip-path reveal and disappear via opacity fade.

The 5 statements with their copy are in Section 9.2 of the spec.

Implementation:

1. Each statement is a full-screen centered div, position: absolute (within a 120vh container)
   Stack them vertically (statement 1 at top, statement 5 at 96vh)

2. For each statement:
   - Enter animation (ScrollTrigger, scrub):
     clip-path: inset(0 100% 0 0) → inset(0 0% 0 0) [text reveals left to right]
     Trigger: when statement's scroll position is reached
   - Exit animation:
     opacity: 1 → 0 [fades as next statement enters]

3. Flash images between statements:
   - Positioned absolutely, full screen, z-index below text
   - opacity: 0 by default
   - On statement transition: opacity pulses to 0.7 then back to 0, duration 500ms
   - Apply CSS filter: grayscale(1) contrast(1.1) to all flash images
   - Apply a grain texture overlay (CSS noise filter or a noise PNG at low opacity)

4. Background:
   - Deep --color-void throughout
   - A very slow gradient drift: CSS animation shifts background from
     #0D0D0D to #0F0B08 and back over 8 seconds (barely visible warmth shift)

5. The final statement "ARMONIA." should be the largest text on the entire page:
   font-size: clamp(72px, 12vw, 160px), weight 300, letter-spacing 0.1em
   "Lakatameia, Nicosia." appears beneath in text-label style, --color-stone
```

**Check before moving on:**
- Statements reveal and fade in sync with scroll
- Flash images appear between transitions
- Grain overlay is visible but subtle
- "ARMONIA." is dramatic and large

---

### PROMPT 4.8 — Projects Reel (Scene 7)

```
Build the horizontal projects reel (Scene 7).

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 10.

Create /src/components/homepage/SceneProjects.tsx

This section is 150vh. A horizontal carousel is driven by vertical scroll.
As you scroll down 150vh, the carousel slides left to show all projects.

Implementation:

1. Container setup:
   - Outer: height 150vh, position relative (ScrollTrigger scrubs this)
   - Inner (the track): position sticky, top 0, height 100vh, overflow hidden
   - Carousel: display flex, will-change: transform

2. ScrollTrigger:
   - Pin the sticky inner element
   - As scroll progresses 0% → 100% of the 150vh container:
   - Translate the carousel: translateX(0) → translateX(-totalWidth + 100vw)
   - Scrub: 1.5

3. Each project card (full-screen, 100vw × 100vh):
   Use the project structure from Section 10.2.

   IMPORTANT: Do NOT fetch from Sanity here. Sanity is not wired until Phase 6.
   Use hardcoded placeholder data for exactly two cards:

   Card 1 — Armonia:
   {
     id: 'armonia',
     name: 'ARMONIA',
     location: 'Lakatameia, Nicosia',
     year: '2024',
     type: 'Residential',
     status: 'completed',
     ctaType: 'showcase',
     heroImageId: 'clients/tdkdb/armonia/exterior/hero',
     ctaLabel: 'VIEW PROJECT →',
     href: '/en/projects/armonia',
   }

   Card 2 — Almond:
   {
     id: 'almond',
     name: 'ALMOND',
     location: 'Nicosia',
     year: '2025',
     type: 'Residential',
     status: 'in-progress',
     ctaType: 'register-interest',
     heroImageId: 'clients/tdkdb/almond/renders/hero',
     ctaLabel: 'REGISTER INTEREST →',
     href: '/en/projects/almond',
   }

   In Phase 6.3, this hardcoded array will be replaced with a Sanity query.
   Add a comment above the data: // TODO Phase 6.3 — replace with getProjectsForHomepageReel()

   Project card visual details:
   - Full-bleed image: cloudinaryUrl(heroImageId, { width: 1920, quality: 'auto', format: 'auto' })
   - Use a plain <img> tag (not next/image) with the Cloudinary URL
   - Image moves at 0.7× card speed (parallax via GSAP transform)
   - Status badge: "COMPLETED" (--color-stone) | "IN DEVELOPMENT" (--color-threshold)
   - Info panel: bottom-left, slides up 40px when card enters view
   - Info: project number ("01"), name, location, year, type
   - CTA: ghost button with label from ctaLabel, links to href

4. Project counter (top-right, fixed within the sticky container):
   Updates as active card changes: "01 / 02" → "02 / 02"
   Transition: number flips via translateY animation

5. Section heading (appears before carousel begins):
   "THE WORK" in text-label style, left-aligned
   Fades out as carousel starts
```

**Check before moving on:**
- Horizontal scroll is driven by vertical scroll correctly
- Parallax on images works
- Project counter updates
- Info panel slides up on card entry
- No horizontal scroll bar visible

---

### PROMPT 4.9 — Process Section (Scene 8)

```
Build the process timeline section (Scene 8).

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 11.

Create /src/components/homepage/SceneProcess.tsx

This section is 120vh.

1. Background:
   First and only place on the page with a very subtle paper texture.
   Use a CSS noise/grain effect (not an image — use CSS background with SVG filter)
   Color: a slightly warmer dark: #111009

2. The timeline:
   A single horizontal SVG line that draws left-to-right as scroll progresses.
   The line uses stroke-dashoffset animation tied to ScrollTrigger.
   
   5 vertical tick marks on the line at 0%, 25%, 50%, 75%, 100% of its length.
   Each tick mark: a vertical line (1px, 20px tall)
   
3. Each process step (above each tick):
   - Number: "01", "02", etc. in text-mono style, --color-threshold color
   - Title: in text-heading style
   - Description: in text-body style, max-width 180px
   
   Steps appear as the line reaches their tick position:
   opacity 0 → 1, translateY 20px → 0
   
   Step content from Section 11.2:
   01 VISION — "We begin with a conversation. Not a brief. A conversation."
   02 DESIGN — "Architecture that responds to how you want to live."
   03 ENGINEERING — "Structure, systems, and compliance resolved."
   04 BUILD — "Construction managed to the millimetre."
   05 HANDOVER — "The moment the door opens."

4. Section heading:
   "HOW WE BUILD" in text-label style, appears above the timeline
   Clip-path reveal left-to-right when section enters viewport

5. Below the process, a single sentence:
   "Every project. Every time." in text-display-md, light weight, centered.
   Appears after the timeline completes.
```

**Check before moving on:**
- Line draws as user scrolls
- Steps appear in sequence as line reaches them
- Paper texture is very subtle (not distracting)
- Final sentence appears at the right moment

---

### PROMPT 4.10 — Contact CTA & Footer (Scenes 9 & 10)

```
Build the final two scenes: Contact CTA and Footer (Scenes 9 and 10).

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Sections 12 and 13.

Scene 9 — Contact CTA:
Create /src/components/homepage/SceneContact.tsx

Layout from Section 12.2:
- Full screen, --color-void background
- Centered content (both axes)
- Headline: "LET'S BUILD SOMETHING TOGETHER."
  Split into 3 lines as shown in the spec
  Font: text-display-lg, weight 300
  Animation: word-by-word stagger clip-path reveal (60ms per word)
  Trigger: ScrollTrigger, when section enters viewport

- CTA Button: "START A CONVERSATION →"
  Uses the magnetic Button component (variant: primary, magnetic: true)
  Links to /contact
  Appears after headline (600ms delay)

- Secondary contact info:
  "Or reach us directly:" in text-label, --color-stone
  Email and phone in text-body, with hover animations
  These appear 800ms after headline

- Background architectural lines:
  An SVG of very faint floor plan lines (draw your own minimal one — 
  just a few intersecting lines suggesting a floor plan)
  Opacity: 0.03
  The SVG slowly drifts upward: CSS animation, translateY 0 → -20px, 
  duration 20s, repeat infinite, ease linear

Scene 10 — Homepage Footer:
Reuse the global Footer component (/src/components/layout/Footer.tsx)
Add it at the bottom of the homepage.
The homepage IS the only page that includes its own footer inline
(since the layout.tsx excludes footer from homepage).

Between Scene 9 and the footer, add a thin divider line (--color-border).
```

**Check before moving on:**
- Headline word-by-word reveal works
- Magnetic button snaps to cursor
- Background lines barely visible (opacity 0.03)
- Footer renders correctly
- Homepage feels complete end-to-end

---

### PROMPT 4.11 — Custom Cursor

```
Build the custom cursor system.

Reference: TDK_HOMEPAGE_EXPERIENCE.md, Section 19.

Create /src/components/ui/CustomCursor.tsx (client component)

Implementation:

1. Replace the default cursor:
   Add cursor: none to the html element in globals.css

2. The cursor element:
   A div, position: fixed, pointer-events: none, z-index: 9999
   12px × 12px circle by default
   Border: 1px solid var(--color-paper)
   Border-radius: 50%
   Background: transparent
   Transform-origin: center center

3. Cursor following:
   Track actual mouse position with mousemove
   The cursor follows with a spring delay using GSAP quickTo:
   gsap.quickTo(cursor, "x", { duration: 0.3, ease: "power3" })
   gsap.quickTo(cursor, "y", { duration: 0.3, ease: "power3" })
   This creates the trailing effect.

4. States (add/remove CSS classes based on what's under the cursor):

   Default (.cursor-default):
   - 12px, border --color-paper, transparent fill

   On link/button hover (.cursor-hover):
   - Expand to 40px over 300ms --ease-smooth
   - Fill: --color-threshold
   - Border: none

   On building nodes (.cursor-node):
   - Expand to 60px
   - Show crosshair: two 1px lines through center (::before and ::after)
   - Fill: transparent, border: --color-threshold

   On project images (.cursor-view):
   - Expand to 80px
   - Fill: --color-threshold at 90% opacity
   - Text inside: "VIEW" in text-label style, --color-void

   During scroll/camera movement (.cursor-scroll):
   - Shrink to 6px
   - Fill: --color-paper
   - No border

5. Detection:
   Use event delegation: add data-cursor="hover|node|view|scroll" 
   attributes to interactive elements.
   The cursor component listens for mouseenter on elements with these attributes.

6. Mobile: hide cursor entirely (pointer: coarse media query)

Add CustomCursor to the root layout.tsx.
```

**Check before moving on:**
- Cursor trails correctly (spring physics feel)
- All states work
- Cursor hidden on mobile/touch
- No flicker or jumpiness

---

## PHASE 5 – INTERIOR PAGES

**Goal:** Build all non-homepage pages following the master plan.
**When:** Homepage complete (or at least Scenes 1-5).
**Approach:** Each page gets its own prompt session. Feed the master plan at the start of each.

---

### PROMPT 5.0 — Feed Context for Every Interior Page Session

```
Before building this page, re-read the project PRD:

[PASTE RELEVANT SECTIONS OF TDK_MASTER_PLAN.md]
(Section 7 for the page blueprint, Sections 4 and 5 for design/branding context)

Key rules for all interior pages:
- Background: --color-void (#0D0D0D)
- Text: --color-paper (#F5F0E8)
- Font: Josefin Sans (loaded via next/font)
- Scroll animations: Use the FadeUp, TextReveal, StaggerGroup, CountUp
  components from /src/components/animations/
- No custom cursor states needed (just the default hover state)
- All pages use the global Navbar and Footer from the layout
- No canvas or scroll-jacking on any interior page
- Section padding: var(--section-padding)
- Content max-width: var(--content-max)
- ALL images use cloudinaryUrl() from /src/lib/cloudinary/transforms.ts
  NEVER use next/image with Cloudinary URLs — use a plain <img> tag
  Image public IDs come from Sanity as string fields (not Sanity image objects)
```

---

### PROMPT 5.1 — About Page

```
Build the About page following the master plan Section 6.2.

File: /src/app/[locale]/(site)/about/page.tsx

Sections (in order):
1. Hero — full-width heading "WHO WE ARE" + subheading. Background: a large
   Armonia render at 20% opacity as a background image. TextReveal animation on heading.

2. Our Story — two-column layout. Left: large pull quote. Right: narrative paragraphs.
   FadeUp on text blocks. Content: placeholder text for now, will be replaced by client.

3. Mission & Vision — full-width dark section. Two large statements side by side.
   TextReveal animation, staggered.

4. Numbers / Milestones — 3-4 stats in a row.
   Use CountUp component for each number.
   Stats (placeholders — confirm with TDK): "8+ Projects", "15+ Years", "100% Client Retention"
   Each stat: number in text-display-md (--color-threshold), label in text-label

5. Team — grid of team member cards (if TDK wants to show team).
   For now: placeholder grid, 3 columns on desktop.
   Each card: photo (placeholder), name, role, bio excerpt.
   Hover: subtle image zoom, name color shifts to --color-threshold.

6. CTA — reuse the global CTA section pattern from the homepage contact scene,
   but smaller: "Ready to build? Let's talk." + ghost button linking to /contact.

Generate metadata (title, description) for SEO using the metadata utility.
```

---

### PROMPT 5.2 — Services Index Page

```
Build the Services index page following master plan Section 6.3.

File: /src/app/[locale]/(site)/services/page.tsx

Sections:
1. Hero — "WHAT WE DO" heading. Full-width, TextReveal.

2. Services grid — 2×2 grid (or 4-column on large screens).
   For each service (Architecture & Design, Construction Management, 
   Interior Design, Project Management):
   - Large number ("01", "02"...) in text-display-lg, --color-threshold, 20% opacity
   - Service name in text-heading
   - Short description in text-body-lg
   - Arrow link: "EXPLORE →"
   - Hover: card gets a 1px --color-paper border, slight background lift to --color-surface
   - FadeUp animation on each card, stagger-loose delay

3. Process overview — simple 5-step horizontal layout (same concept as homepage process,
   but static — no scroll-draw animation here, just a visible timeline).

4. CTA — link to contact.

All service cards link to /services/[slug].
```

---

### PROMPT 5.3 — Service Detail Page (Template)

```
Build the Service detail page template following master plan Section 6.4.

File: /src/app/[locale]/(site)/services/[slug]/page.tsx

This is a dynamic route — it receives a slug and fetches the service from Sanity.

For now, build the layout with placeholder content. We'll wire Sanity later.

Sections:
1. Hero — service name (TextReveal), full-width, service hero image as background at 30% opacity
2. Description — two columns: left large pull quote, right paragraphs
3. Process/Approach — numbered list, each step has a thin teal number, heading, description
   Steps appear staggered on scroll
4. Related Projects — 2-3 project cards in a row (horizontal cards: image left, text right)
   Hover: image zooms, border appears
5. FAQ — collapsible accordion
   Each FAQ: question in text-heading, answer in text-body
   Open/close: the answer panel slides down (CSS transition on max-height via GSAP)
   Icon: + rotates to × when open
6. CTA

Build a reusable Accordion component at /src/components/ui/Accordion.tsx
```

---

### PROMPT 5.4 — Projects Index Page

```
Build the Projects index page following master plan Section 7.5.

File: /src/app/[locale]/(site)/projects/page.tsx

This page must be fully CMS-driven and scalable. Adding a new project in Sanity
must automatically create a new card here — zero developer work required.

Sections:
1. Hero — "THE WORK" heading, filter controls below

2. Filter controls:
   - Tabs: All | Residential | Commercial | Mixed-Use
   - Status toggle: All | Completed | In Progress | Upcoming
   - Text-label style, active tab has --color-threshold underline
   - Filtering is client-side (no page reload)

3. Project grid:
   - Masonry-style grid, 3 columns on desktop, 2 on tablet, 1 on mobile
   - Each project card:
     - Hero image: cloudinaryUrl(project.heroImageId, { width: 800, height: 600, crop: 'fill' })
     - Status badge: "COMPLETED" (stone) | "IN DEVELOPMENT" (threshold) | "UPCOMING" (stone)
     - On hover: image scales 1.05, dark overlay slides up with project info
     - Overlay: project name, location, year
     - CTA text driven by project.ctaType: "VIEW →" | "REGISTER INTEREST →" | "ENQUIRE →"
   - Cards fade in on load (staggered)
   - When filter changes: non-matching cards fade out + collapse, matching cards fade in

4. Build the component to accept an array of projects from Sanity.
   For now, hardcode Armonia and Almond as placeholder data.
   Sanity wiring in Phase 6.

Build /src/components/ui/ProjectCard.tsx — accepts project object, derives all
display logic from project.ctaType and project.status.
Build /src/components/ui/FilterTabs.tsx (client component).
```

---

### PROMPT 5.5 — Project Detail Page (Single Unified Template)

```
Build the single project detail page template that handles ALL projects —
Armonia, Almond, and every future project TDK ever builds.

Reference: TDK_MASTER_PLAN.md Section 7.6

CRITICAL ARCHITECTURE DECISION:
There is ONE dynamic route. NO separate armonia/page.tsx or almond/page.tsx files.
Every project is served by /src/app/[locale]/(site)/projects/[slug]/page.tsx.
The page reads Sanity data and renders or hides sections based on two fields:
  - project.ctaType ('showcase' | 'register-interest' | 'contact')
  - project.status ('completed' | 'in-progress' | 'upcoming')
This is what makes infinite scaling possible with zero developer involvement.

File: /src/app/[locale]/(site)/projects/[slug]/page.tsx

For now: build with hardcoded placeholder data matching the Sanity schema shape.
Wire to real Sanity data in Phase 6.3.
Use placeholder Cloudinary IDs throughout — e.g. 'clients/tdkdb/armonia/exterior/hero'
All images: plain <img> tag with cloudinaryUrl() — never next/image with Cloudinary URLs.

---

BUILD THESE SECTION COMPONENTS — one file per section in /src/components/sections/project/:

1. ProjectHero.tsx
   Props: title, heroImageId, status, ctaType, location, type, year, ctaLabel
   - Full-bleed image: cloudinaryUrl(heroImageId, heroImage preset)
   - Gradient overlay: bottom-to-top, transparent → rgba(0,0,0,0.75)
   - Title in text-display-xl, weight 300, white
   - Location · Type · Year in text-label, --color-stone
   - Status badge: position top-right
     'completed' → "COMPLETED" (--color-stone text, --color-surface bg)
     'in-progress' → "IN DEVELOPMENT" (--color-threshold text, dark bg)
     'upcoming' → "UPCOMING" (--color-stone text, --color-surface bg)
   - If ctaType = 'register-interest': show magnetic primary button
     Label from ctaLabel field, anchors to #interest-form

2. ProjectOverviewBar.tsx
   Props: location, type, year, totalUnits
   - 4 columns: Location | Type | Year | Total Units
   - Each: text-label (--color-stone) + text-body-lg (--color-paper) value
   - 1px vertical dividers between columns (--color-border)
   - Full width, --color-surface background, padding 32px

3. ProjectRendersGallery.tsx
   Props: heading, images (string[]), caption
   - Section heading in text-label
   - Full-width horizontal slider — one image fills the viewport width
   - Prev/next arrows (left/right, ghost style)
   - Dot indicators centered below
   - Click image → opens Lightbox component
   - Optional caption below dots in text-label, --color-stone
   - If images array is empty → return null (section does not render)

4. ProjectPhotosGallery.tsx
   Props: heading, images (string[]), caption
   - Identical layout to ProjectRendersGallery
   - Different section heading (e.g. "THE BUILD", "PROGRESS", "COMPLETED")
   - If images array is empty → return null (section does not render)
   Note: same component pattern, separate component file for clarity.
   In future this could be one GallerySlider component with a heading prop —
   but keep them separate for now to make CMS mapping explicit.

5. ProjectDescription.tsx
   Props: pullQuote, description (portableText), features (string[])
   - Two columns on desktop, single column on mobile
   - Left: pullQuote in text-display-md, weight 300, --color-paper at 60% opacity
   - Right: description rendered via PortableText component
   - Below right column: features list
     Each feature: thin → arrow (--color-threshold) + text in text-body

6. ProjectSpecs.tsx
   Props: specs ({ key: string, value: string }[])
   - Table layout: key in text-label (--color-stone), value in text-body (--color-paper)
   - Thin border-bottom (--color-border) on each row
   - If specs array is empty → return null

7. ProjectProgress.tsx
   Props: progressPercent, progressLabel, constructionUpdates ({ date, imageId, caption }[])
   - Section heading: "CONSTRUCTION PROGRESS" in text-label
   - Progress bar:
     Full-width track: 2px height, --color-surface
     Fill: --color-threshold, width = progressPercent%
     On scroll entry: animate width from 0 to final value (1.2s, ease-smooth)
   - Percentage: text-display-md, --color-threshold, below bar
   - Label: progressLabel in text-label, --color-stone
   - Construction Updates Log (reverse chronological):
     Each entry: date (text-label, --color-stone) · image (cloudinaryUrl, constructionPhoto preset) · caption (text-body)
     Alternating left/right layout on desktop, single column mobile
     FadeUp on scroll entry
   - Hidden entirely when: ctaType = 'showcase' OR status = 'completed'

8. ProjectUnitsTable.tsx
   Props: heading, units ({ floor, unitType, sizeM2, status }[]), note
   - Section heading from props in text-label
   - Table columns: Floor | Unit Type | Size | Status
   - Header row: text-label, --color-stone, border-bottom --color-border
   - Body rows: text-body
   - Every other row: --color-surface at 20% opacity background
   - Status cell:
     'available' → green dot (#4CAF50) + "Available"
     'reserved' → teal dot (--color-threshold) + "Reserved"
     'sold' → gray dot + "Sold", entire row at 40% opacity
   - Mobile: horizontal scroll on table, first column sticky
   - Note below table in text-label, --color-stone (e.g. "Pricing available on enquiry")
   - If units array is empty → return null

9. ProjectInterestForm.tsx (id="interest-form" — anchor target from hero CTA)
   Props: heading, subtext, unitTypes (string[] — derived from units array)
   - Section heading in text-display-md
   - Subtext in text-body-lg
   - Fields: Name · Email · Phone · Preferred Unit Type (select, options from unitTypes) · Message (optional textarea)
   - Input styling: no background, border-bottom only (1px --color-border)
     On focus: border-bottom --color-paper, label floats up
   - Submit: primary button, full width, "REGISTER INTEREST →"
   - Validation: Zod, client + server
   - Success: form fades out, "INTEREST REGISTERED" + checkmark animation
   - Error: field borders go threshold, error text below field
   - On submit → POST to /api/project-interest
   - GA4 event (client-side): trackProjectInterestSubmit(project.slug, unitPreference)
   - Hidden when ctaType = 'showcase' or ctaType = 'contact'

10. ProjectLocation.tsx
    Props: mapEmbedUrl, neighborhoodDescription (portableText)
    - Map iframe with CSS filter: grayscale(1) invert(0.85) for dark styling
    - Neighborhood description rendered via PortableText below map
    - If mapEmbedUrl is empty → return null

11. ProjectRelated.tsx
    Props: relatedSlugs (string[])
    - Fetch related project cards from Sanity by slugs (Phase 6 wires this)
    - For now: render placeholder cards
    - Max 3 cards, horizontal row on desktop
    - Each card: hero image, name, location, status badge, CTA label
    - If empty → return null

12. ProjectCTA.tsx
    Props: ctaType, ctaLabel (override), ctaHref (override)
    - Full-width dark section
    - Default behavior by ctaType:
      'showcase' → "START YOUR PROJECT WITH US" + primary button → /contact
      'register-interest' → "REGISTER YOUR INTEREST →" anchor → #interest-form
      'contact' → "ENQUIRE ABOUT THIS PROJECT →" + primary button → /contact
    - If ctaLabel/ctaHref overrides are set in Sanity, use those instead

---

BUILD THE LIGHTBOX COMPONENT:
File: /src/components/ui/Lightbox.tsx
- Full-screen overlay (position fixed, z-index 500, --color-void background)
- Centers image, max 90vw × 90vh
- Prev/next navigation (arrow keys + on-screen buttons)
- Close button (top right, ×)
- Image counter: "3 / 8" in text-label
- Open/close: fade in/out (opacity 0 → 1, 300ms)
- ESC key closes
- Body scroll locked when open (add overflow: hidden to body)
- Accessible: role="dialog", aria-modal, focus trap, aria-label

---

BUILD THE INTEREST FORM API ROUTE:
File: /src/app/api/project-interest/route.ts
- POST handler
- Zod validation: name, email, phone, unitPreference, message, projectSlug, projectName
- Send email via Resend:
  FROM: process.env.RESEND_FROM_EMAIL (noreply@tdkdb.com)
  TO: process.env.INTEREST_FORM_TO_EMAIL (info@tdkdb.com)
  Subject: "New Interest — [projectName]: [name]"
  Body: all form fields
- Send auto-reply to lead:
  FROM: process.env.RESEND_FROM_EMAIL
  TO: lead's email address
  Subject: "Thank you for your interest in [projectName]"
  Body: "We've received your interest and will be in touch within 48 hours."
- After sending email, create a `lead` document in Sanity using the Sanity write client
  (requires SANITY_API_TOKEN with write permission in env vars):
  {
    _type: 'lead',
    projectSlug, projectName, name, email, phone,
    unitPreference, message,
    submittedAt: new Date().toISOString(),
    status: 'new'
  }
- Rate limiting: max 3 requests per IP per hour
- Honeypot field check
- This single route handles interest forms for ALL pre-sale projects now and forever

---

ASSEMBLE IN PAGE.TSX:

/src/app/[locale]/(site)/projects/[slug]/page.tsx

import all section components above.

Placeholder project data shape (replace with Sanity in Phase 6.3):
const project = {
  title: 'ARMONIA',
  slug: 'armonia',
  status: 'completed',
  ctaType: 'showcase',
  location: 'Lakatameia, Nicosia',
  type: 'Residential',
  year: 2024,
  heroImageId: 'clients/tdkdb/armonia/exterior/hero',
  rendersGallery: {
    heading: 'THE VISION',
    images: ['clients/tdkdb/armonia/renders/01', 'clients/tdkdb/armonia/renders/02'],
    caption: '',
  },
  photosGallery: {
    heading: 'COMPLETED',
    images: ['clients/tdkdb/armonia/photography/01'],
    caption: 'Professional photography',
  },
  pullQuote: 'A building designed to outlast trends.',
  description: null,
  features: ['Underground parking', 'Rooftop terrace', 'Floor-to-ceiling glazing'],
  specs: [
    { key: 'Total Units', value: '12' },
    { key: 'Floor area', value: '58–145 m²' },
    { key: 'Parking', value: 'Underground' },
  ],
  unitsHeading: 'UNIT BREAKDOWN',
  unitsNote: '',
  units: [
    { floor: 'GF', unitType: '1-Bed', sizeM2: 58, status: 'sold' },
    { floor: 'GF', unitType: '2-Bed', sizeM2: 82, status: 'sold' },
    { floor: '1F', unitType: '2-Bed', sizeM2: 85, status: 'sold' },
    { floor: '2F', unitType: 'Penthouse', sizeM2: 145, status: 'sold' },
  ],
  progressPercent: 100,
  progressLabel: '',
  constructionUpdates: [],
  interestFormHeading: '',
  interestFormSubtext: '',
  mapEmbedUrl: '',
  relatedProjectSlugs: ['almond'],
  ctaLabel: '',
  ctaHref: '',
  seo: {
    title: 'Armonia Apartments | TDK Design & Build',
    description: 'Completed residential development in Lakatameia, Nicosia.',
    ogImageId: 'clients/tdkdb/armonia/exterior/hero',
  },
}

Section rendering logic (conditional):
<ProjectHero ... />
<ProjectOverviewBar ... />
{project.rendersGallery.images.length > 0 && <ProjectRendersGallery ... />}
<ProjectDescription ... />
{project.photosGallery.images.length > 0 && <ProjectPhotosGallery ... />}
{project.specs.length > 0 && <ProjectSpecs ... />}
{project.ctaType !== 'showcase' && project.status !== 'completed' && <ProjectProgress ... />}
{project.units.length > 0 && <ProjectUnitsTable ... />}
{project.ctaType === 'register-interest' && <ProjectInterestForm ... />}
{project.mapEmbedUrl && <ProjectLocation ... />}
<ProjectRelated ... />
<ProjectCTA ... />

generateStaticParams(): returns [] for now — Sanity wiring in Phase 6.3
generateMetadata(): uses project.seo.title and project.seo.description
```

**Check before moving on:**
- `/en/projects/armonia` renders with ctaType 'showcase' — no interest form, no progress bar
- Change placeholder ctaType to 'register-interest' → interest form appears, progress bar appears
- Change status to 'in-progress' → progress bar shows at partial width
- Renders gallery renders with slider and lightbox working
- Photos gallery renders separately from renders gallery
- Empty gallery array → that section disappears entirely
- Interest form submits to /api/project-interest and returns 200
- Resend sends email correctly (check inbox)
- Lightbox opens, navigates, closes with ESC
- Units table shows correct status colors
- Mobile: table scrolls horizontally, first column stays visible
- No TypeScript errors

---

---

### PROMPT 5.6 — Insights Index & Article Pages

```
Build the Insights (blog) pages following master plan Sections 7.9 and 7.10.

File 1: /src/app/[locale]/(site)/insights/page.tsx (Index)
File 2: /src/app/[locale]/(site)/insights/[slug]/page.tsx (Article)

INDEX PAGE:
1. Hero — featured article (full-width card, image background, title overlay)
2. Article grid — 3 columns on desktop
   Each card: image, category badge, title, excerpt, date, read time
   Hover: image zoom, title color shifts to --color-threshold
3. Category filter — text-label tabs (All, Architecture, Construction, Lifestyle, etc.)
4. Pagination — prev/next controls (not infinite scroll — simpler, better for SEO)

Build /src/components/ui/ArticleCard.tsx
Build /src/components/ui/CategoryFilter.tsx

ARTICLE PAGE:
1. Hero — article title (text-display-md), author + date + read time + category below
   No background image — just typography on --color-void (let the writing breathe)
2. Article body — rendered from Sanity Portable Text
   Build /src/components/sanity/PortableText.tsx with custom renderers for:
   - Headings (h2, h3): styled with text-heading, add anchor IDs
   - Images: full-width with caption below, lazy loaded
   - Blockquote: left border --color-threshold, italic, indented
   - Code blocks: monospace, --color-surface background
   - Inline links: --color-threshold, underline on hover
3. Table of contents — sticky sidebar on desktop (generated from h2/h3 headings)
   Active heading highlighted as user scrolls
4. Author bio card — image, name, role, short bio
5. Related articles — 3 cards
6. Share — copy link + social share (native share API on mobile)
```

---

### PROMPT 5.7 — Contact Page

```
Build the Contact page following master plan Section 7.11.

File: /src/app/[locale]/(site)/contact/page.tsx

Sections:
1. Hero — "LET'S TALK" in text-display-lg. Subtext in text-body-lg.
   No background image — pure --color-void. Typography as the design.

2. Contact form (left column on desktop, full width on mobile):
   Fields: Name, Email, Phone (optional), Project Type (dropdown), Message (textarea)
   Styling:
   - Input fields: no background, border-bottom only (1px --color-border)
   - On focus: border-bottom becomes --color-paper (1px), label floats up
   - Labels: text-label style, animate up when field has content
   - No rounded corners on anything
   - Submit button: primary variant, full width, "SEND MESSAGE →"
   
   Validation: Zod schema, validated client-side on submit + server-side in API route
   
   Success state: form slides out, "MESSAGE RECEIVED" appears with a thin check animation
   Error state: field borders turn threshold (--color-threshold), error message in text-label below field

3. Contact info (right column on desktop):
   Address, Email, Phone — each with icon (thin line SVG) and hover animation
   Office hours (placeholder)
   Social links

4. Map — use a simple styled iframe embed for Google Maps
   Apply a CSS filter: grayscale(1) invert(0.9) to make it dark-themed
   Wrap in a container with --color-surface background as fallback

Build /src/app/api/contact/route.ts:
- POST handler
- Validate with Zod (same schema as client)
- Send email via Resend FROM process.env.RESEND_FROM_EMAIL TO process.env.CONTACT_FORM_TO_EMAIL
- Send confirmation auto-reply to the user FROM process.env.RESEND_FROM_EMAIL
- Rate limiting: max 3 requests per IP per hour
- Honeypot field check (bot protection)
- Return appropriate JSON responses
```

---

### PROMPT 5.8 — 404 Page

```
Build the custom 404 page.

Reference: TDK_MASTER_PLAN.md Section 7.13.

File: /src/app/not-found.tsx
(Next.js App Router serves this automatically for any unmatched route)

Specifications:
- Full-height layout (min-height: 100svh), background: --color-void
- Navbar included at top (standard transparent variant)
- No footer — keep it minimal
- Content centered vertically and horizontally

Layout (centered column, max-width 600px):
1. Large "404" — class text-display-xl, font-weight 300, color --color-stone
2. Heading "PAGE NOT FOUND" — class text-label, color --color-stone, letter-spacing tracked
3. Body text "The page you're looking for has moved or doesn't exist."
   — class text-body, color --color-stone, margin-top 16px
4. Primary button "BACK TO HOME →" — primary variant, margin-top 48px, href="/"
5. Secondary text link "VIEW OUR PROJECTS →" — text-label style, color --color-stone,
   hover: color --color-paper, transition --duration-fast, margin-top 16px, href="/projects"

Animations (GSAP, client-side only, check useReducedMotion):
- "404" number: opacity 0 → 1, y: 20 → 0, duration 0.8s, ease --ease-smooth
- Heading + body: stagger FadeUp, delay 0.4s after 404 appears
- Button: FadeUp, delay 0.6s after 404 appears
- prefers-reduced-motion: skip all animation, render everything visible immediately

This is a server component — no 'use client' needed.
GSAP animations run in a child client component (wrap animated elements in a
client component that calls useGSAP on mount).
```

**Check before moving on:**
- Navigate to any non-existent URL (e.g. /does-not-exist) — 404 page renders
- Navbar present, no footer
- Animations play in sequence on load
- Both links navigate correctly
- prefers-reduced-motion: everything visible immediately, no animation

---

## PHASE 6 – CMS INTEGRATION

**Goal:** Wire Sanity to all dynamic pages. Replace every placeholder with real CMS data.
**When:** All page templates are built and checked with placeholder data.
**Order matters:** Schemas first → queries → wire pages → content entry → ISR.

---

### PROMPT 6.1 — Sanity Schemas

```
Build all Sanity content type schemas.

Reference: TDK_MASTER_PLAN.md Section 12.

CRITICAL RULE FOR ALL IMAGE FIELDS:
Use 'string' type — NOT Sanity's native 'image' type.
All images live in Cloudinary. Sanity only stores the public ID as a string.
Example field:
  defineField({
    name: 'heroImageId',
    title: 'Hero Image (Cloudinary ID)',
    type: 'string',
    description: 'Upload to Cloudinary under clients/tdkdb/. Paste the public ID here.\nExample: clients/tdkdb/almond/renders/hero-exterior',
  })

File: /sanity/schemas/project.ts

Core fields:
  title (string), slug (slug, source: title), status (enum: upcoming/in-progress/completed),
  type (enum: residential/commercial/mixed-use), location (string), year (number)

Template control field:
  ctaType (enum: showcase/register-interest/contact)
  description: 'Controls page rendering. showcase = completed portfolio.
  register-interest = active pre-sale with interest form. contact = generic enquiry.'

Hero:
  heroImageId (string — Cloudinary ID)

Renders Gallery (CGI renders — the vision):
  rendersGallery (object):
    heading (string, e.g. "THE VISION", "RENDERS")
    images (array of strings — Cloudinary IDs)
    caption (string, optional)

Photos Gallery (real photography — the reality):
  photosGallery (object):
    heading (string, e.g. "THE BUILD", "PROGRESS", "COMPLETED")
    images (array of strings — Cloudinary IDs)
    caption (string, optional, e.g. "Updated March 2025")
  description: 'Add progress photos while building. Replace with finished
  professional photography when complete. Leave empty to hide this section.'

Content:
  pullQuote (string)
  description (portableText)
  features (array of strings)
  specs (array of objects: { key (string), value (string) })

Units table:
  unitsHeading (string, e.g. "AVAILABLE UNITS" or "UNIT BREAKDOWN")
  unitsNote (string, e.g. "Pricing available on enquiry")
  units (array of objects: {
    floor (string, e.g. "GF", "1F", "2F"),
    unitType (string, e.g. "1-Bed", "2-Bed", "Penthouse"),
    sizeM2 (number),
    status (enum: available/reserved/sold)
  })

Construction progress (shown when status = in-progress):
  progressPercent (number, min 0, max 100)
  progressLabel (string, e.g. "Foundation Complete · Structural Work Underway")
  constructionUpdates (array of objects: { date (date), imageId (string — Cloudinary), caption (string) })

Interest form (shown when ctaType = register-interest):
  interestFormHeading (string)
  interestFormSubtext (string)

Location:
  mapEmbedUrl (string)
  neighborhoodDescription (portableText)

Relations:
  relatedProjectSlugs (array of strings)

CTA overrides (optional — defaults driven by ctaType if left empty):
  ctaLabel (string)
  ctaHref (string)

SEO:
  seo (object: { title (string), description (string), ogImageId (string — Cloudinary) })

Multilingual (commented-out — activate when Greek launches):
  // titleEl (string)
  // pullQuoteEl (string)
  // descriptionEl (portableText)

---

File: /sanity/schemas/insight.ts
  title, slug, author (reference → teamMember), publishDate (datetime),
  category (reference → category), excerpt (text, max 200 chars),
  heroImageId (string — Cloudinary), body (portableText),
  seo (object: { title, description, ogImageId }),
  relatedInsightSlugs (array of strings)
  // Commented-out: titleEl, bodyEl

---

File: /sanity/schemas/category.ts
  title, slug, description (text)

---

File: /sanity/schemas/teamMember.ts
  name, role, bio (text), photoId (string — Cloudinary), email, linkedin (url), order (number)

---

File: /sanity/schemas/service.ts
  title, slug, shortDescription (text), fullDescription (portableText),
  heroImageId (string — Cloudinary),
  process (array of objects: { step (number), title (string), description (text) }),
  faq (array of objects: { question (string), answer (portableText) }),
  relatedProjectSlugs (array of strings),
  seo (object: { title, description })

---

File: /sanity/schemas/siteSettings.ts (singleton)
  companyName, tagline, address, phone, email,
  socialLinks (array: { platform (string), url (url) }),
  logoId (string — Cloudinary), ogImageId (string — Cloudinary),
  googleAnalyticsId

---

File: /sanity/schemas/lead.ts
  CRM document — created automatically by the API route on every interest form submission.
  projectSlug (string)
  projectName (string)
  name (string)
  email (string)
  phone (string)
  unitPreference (string)
  message (text)
  submittedAt (datetime — auto-set on creation)
  status (enum: new/contacted/qualified/closed — default: 'new')
  notes (text — internal TDK notes, optional)

---

File: /sanity/schemas/index.ts
  Export all schemas as an array.

---

File: /sanity/desk/structure.ts
  Custom desk structure with clear sections:
  - Projects (grouped: In Progress · Completed · Upcoming)
  - Insights
  - Services
  - Team
  - Leads (grouped by projectSlug — shows all interest form submissions with status dropdown)
  - Site Settings (singleton — no list, just the document)

  In Progress group should always show Almond first (sort by order field or hardcode).

---

File: /sanity/sanity.config.ts
  Register all schemas, custom desk structure, and studio metadata.
  title: 'TDK Design & Build'
```

**Check before moving on:**
- Sanity Studio loads at `/studio` without errors
- All schemas appear in the studio sidebar with correct field labels
- Singleton siteSettings shows as a direct link (not a list)
- Project schema shows ctaType field with clear description
- Pre-sale fields (units, constructionUpdates) are visible in the schema
- An image field shows the Cloudinary instruction text when you click it

---

### PROMPT 6.2 — TypeScript Types & GROQ Queries

```
Build all TypeScript types and GROQ queries for Sanity data.

File: /src/lib/sanity/types.ts

Define TypeScript interfaces that exactly match the schemas.
All image fields are strings (Cloudinary IDs), NOT Sanity image objects.

export interface ProjectGallery {
  heading: string
  images: string[]
  caption?: string
}

export interface ProjectUnit {
  floor: string
  unitType: string
  sizeM2: number
  status: 'available' | 'reserved' | 'sold'
}

export interface ConstructionUpdate {
  date: string
  imageId: string
  caption: string
}

export interface Project {
  _id: string
  title: string
  slug: { current: string }
  status: 'upcoming' | 'in-progress' | 'completed'
  type: 'residential' | 'commercial' | 'mixed-use'
  ctaType: 'showcase' | 'register-interest' | 'contact'
  location: string
  year: number
  heroImageId: string
  rendersGallery?: ProjectGallery
  photosGallery?: ProjectGallery
  pullQuote?: string
  description?: any // portableText
  features?: string[]
  specs?: { key: string; value: string }[]
  unitsHeading?: string
  unitsNote?: string
  units?: ProjectUnit[]
  progressPercent?: number
  progressLabel?: string
  constructionUpdates?: ConstructionUpdate[]
  interestFormHeading?: string
  interestFormSubtext?: string
  mapEmbedUrl?: string
  neighborhoodDescription?: any // portableText
  relatedProjectSlugs?: string[]
  ctaLabel?: string
  ctaHref?: string
  seo?: { title: string; description: string; ogImageId: string }
  // Multilingual (future):
  // titleEl?: string
  // pullQuoteEl?: string
}

export interface Insight { ... }
export interface Category { ... }
export interface TeamMember { ... }
export interface Service { ... }
export interface SiteSettings { ... }

---

File: /src/lib/sanity/queries.ts

All queries use GROQ. All return typed responses. All are server-side only.

PROJECT QUERIES:

getAllProjects(): Promise<Project[]>
  Query: *[_type == 'project'] | order(year desc) {
    _id, title, slug, status, type, ctaType, location, year, heroImageId, seo
  }

getProjectsForHomepageReel(): Promise<Project[]>
  Query: *[_type == 'project' && status != 'upcoming'] | order(year desc) [0...5] {
    _id, title, slug, status, ctaType, location, year, heroImageId
  }
  Used by SceneProjects (Phase 6.3 replaces the hardcoded array)

getProjectBySlug(slug: string): Promise<Project | null>
  Query: *[_type == 'project' && slug.current == $slug][0] {
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
  }

INSIGHT QUERIES:

getAllInsights(limit?: number): Promise<Insight[]>
getInsightBySlug(slug: string): Promise<Insight | null>
  Include populated author and category
getRelatedInsights(currentSlug: string, categoryId: string, limit = 3): Promise<Insight[]>

SERVICE QUERIES:

getAllServices(): Promise<Service[]>
getServiceBySlug(slug: string): Promise<Service | null>
  Include process[], faq[], relatedProjectSlugs

GENERAL:

getSiteSettings(): Promise<SiteSettings>
  This is the singleton — fetch with [0]

All queries should:
- Use the CDN client for reads (fast, cached)
- Return null/[] rather than throwing on not found
- Be typed with generics
```

**Check before moving on:**
- All types compile with zero errors in strict mode
- No type uses Sanity's native image types — all images are strings
- getAllProjects() returns an empty array (no content yet — that's fine)
- getSiteSettings() returns null (no content yet — handle gracefully in UI)

---

### PROMPT 6.3 — Wire Sanity to All Pages

```
Replace all placeholder data with real Sanity queries across every dynamic page.
Reference: TDK_MASTER_PLAN.md Section 12, Phase 6.3.

1. Homepage SceneProjects:
   In /src/components/homepage/SceneProjects.tsx:
   - Remove the hardcoded placeholder array (see TODO comment from Phase 4.8)
   - The component now accepts a projects prop: Project[]
   - In /src/app/[locale]/(site)/page.tsx: fetch getProjectsForHomepageReel()
     server-side and pass to SceneProjects

2. Projects index page:
   /src/app/[locale]/(site)/projects/page.tsx
   - Replace placeholder with getAllProjects()
   - ISR: revalidate every 60 seconds

3. Project detail page (handles ALL projects — Armonia, Almond, every future project):
   /src/app/[locale]/(site)/projects/[slug]/page.tsx
   - Replace placeholder data object with getProjectBySlug(slug)
   - generateStaticParams(): getAllProjects() — returns ALL slugs (no exclusions needed)
   - generateMetadata(): use project.seo.title + project.seo.description
   - ISR: revalidate every 60 seconds
   - Handle not found: if project is null, call notFound()
   - The page renders/hides sections based on project.ctaType and project.status
     exactly as specced in Prompt 5.5 — no changes to section logic needed

4. Insights pages:
   - Index: getAllInsights()
   - Article: getInsightBySlug(slug), generateStaticParams(), generateMetadata()
   - Related: getRelatedInsights()

5. Services pages:
   - Index: getAllServices()
   - Detail: getServiceBySlug(slug), generateStaticParams(), generateMetadata()

6. Navbar/Footer:
   - Fetch getSiteSettings() in root layout, pass phone + email to Footer

7. ISR webhook:
   /src/app/api/revalidate/route.ts
   - POST handler, validate SANITY_REVALIDATE_SECRET header
   - project document → revalidatePath('/[locale]/projects', 'layout')
     + revalidatePath(`/[locale]/projects/${slug}`)
   - insight document → revalidatePath('/[locale]/insights', 'layout')
     + revalidatePath(`/[locale]/insights/${slug}`)
   - service document → revalidatePath('/[locale]/services', 'layout')
     + revalidatePath(`/[locale]/services/${slug}`)
   - siteSettings → revalidatePath('/', 'layout')
   Register webhook in Sanity dashboard:
   https://tdkdb.com/api/revalidate?secret=YOUR_SECRET
```

**Check before moving on:**
- Projects index renders Armonia and Almond cards from Sanity (after entering content)
- Almond page units table shows real data from Sanity
- Armonia page gallery shows real Cloudinary image IDs from Sanity
- ISR webhook returns 200 when called with correct secret
- ISR webhook returns 401 when called without secret
- generateStaticParams() for [slug] excludes 'armonia' and 'almond' correctly

---

### PROMPT 6.4 — Sanity Content Entry

```
This is not a code prompt — it's an instruction for entering real content into
Sanity Studio before Phase 7. This content must be in place before SEO or
analytics can be properly tested.

In Sanity Studio at /studio, create the following documents:

1. SITE SETTINGS (singleton):
   companyName: TDK Design & Build
   tagline: [confirm with TDK]
   address: Nafpliou 1, Lakatameia, Nicosia, Cyprus
   phone: [confirm with TDK]
   email: info@tdkdb.com
   logoId: clients/tdkdb/general/logo
   socialLinks: Instagram, LinkedIn, Facebook [URLs from TDK]

2. PROJECT — Armonia:
   title: Armonia
   slug: armonia
   status: completed
   type: residential
   ctaType: showcase
   location: Lakatameia, Nicosia
   year: 2024
   heroImageId: clients/tdkdb/armonia/exterior/hero [upload to Cloudinary first]
   rendersGallery.heading: THE VISION
   rendersGallery.images: [all render Cloudinary IDs]
   photosGallery.heading: COMPLETED
   photosGallery.images: [all finished photography Cloudinary IDs — leave empty if not yet available]
   photosGallery.caption: Professional photography
   pullQuote: [confirm with TDK]
   description: [copy from TDK]
   features: [list from TDK]
   specs: [key/value pairs from TDK]
   unitsHeading: UNIT BREAKDOWN
   unitsNote: [leave empty — Armonia is sold]
   units: [all units with status: sold]
   seo.title: Armonia Apartments | TDK Design & Build
   seo.description: [keyword-rich, ~155 chars]
   relatedProjectSlugs: ['almond']

3. PROJECT — Almond:
   title: Almond
   slug: almond
   status: in-progress
   type: residential
   ctaType: register-interest
   location: Nicosia
   year: 2025
   heroImageId: clients/tdkdb/almond/renders/hero [upload to Cloudinary first]
   rendersGallery.heading: THE VISION
   rendersGallery.images: [all render Cloudinary IDs]
   photosGallery.heading: THE BUILD
   photosGallery.images: [current construction photo Cloudinary IDs]
   photosGallery.caption: Updated [current month/year]
   pullQuote: [confirm with TDK]
   progressPercent: [current % — ask TDK]
   progressLabel: [current status — ask TDK]
   constructionUpdates: [first batch from TDK — date + photo + caption]
   unitsHeading: AVAILABLE UNITS
   unitsNote: Pricing available on enquiry
   units: [all units with real statuses from TDK]
   interestFormHeading: REGISTER YOUR INTEREST
   interestFormSubtext: We'll be in touch within 48 hours with full details.
   seo.title: Almond Apartments | Pre-Sale | TDK Design & Build
   seo.description: New build apartments in Nicosia. Register your interest today.
   relatedProjectSlugs: ['armonia']

4. At least 2 INSIGHTS articles (ask Kona-Verse to draft using AI):
   Suggested titles:
   - "Guide to buying off-plan property in Cyprus"
   - "The Lakatameia neighborhood guide"

After content entry:
- Trigger the ISR webhook to revalidate all pages
- Verify both project pages render real content
- Verify units table on Almond shows real data
- Confirm Leads section visible in Sanity Studio with status dropdown working
  (submit a test interest form submission to verify the lead document is created)
```

**Check before moving on:**
- Both project pages render from real Sanity data (not placeholders)
- Almond units table shows real floor/type/size/status from Sanity
- Armonia gallery shows real renders from Cloudinary
- At least 2 Insights articles are live
- Site Settings are saved

---

## PHASE 7 – SEO & ANALYTICS

**Goal:** Technical SEO and analytics configured correctly before launch.

---

### PROMPT 7.1 — SEO Infrastructure

```
Implement the full SEO configuration.

Reference: TDK_MASTER_PLAN.md Section 10.

1. Update /src/lib/utils/metadata.ts:
   Create a generatePageMetadata() utility that accepts:
   { title, description, image, path, locale }
   Returns a Next.js Metadata object with:
   - title: "[Page Title] | TDK Design & Build"
   - description
   - canonical URL (use NEXT_PUBLIC_SITE_URL + path)
   - Open Graph (title, description, image, url, type, locale)
   - Twitter Card (summary_large_image)
   - robots: index, follow

   OG image strategy — static Cloudinary images (NOT dynamic ImageResponse):
   - image param should always be a FULL absolute Cloudinary URL (not a relative path)
   - Use cloudinaryUrl() to generate the URL at 1200×630 for OG: cloudinaryUrl(id, { width: 1200, height: 630, crop: 'fill' })
   - Fallback for static pages with no specific image: cloudinaryUrl('clients/tdkdb/general/og/default', { width: 1200, height: 630, crop: 'fill' })
   - Project pages: use project.seo.ogImageId from Sanity
   - Insight pages: use insight.seo.ogImageId from Sanity
   - Homepage: use a specific hero render OG image (upload to clients/tdkdb/general/og/homepage)
   - All OG images must be uploaded to Cloudinary at 1200×630px before launch

2. Add metadata export to every page using generatePageMetadata().
   Static pages: hardcoded values with fallback OG image.
   CMS pages: use project.seo.title / project.seo.description / project.seo.ogImageId from Sanity.

3. Create /src/app/sitemap.ts:
   - Static pages: /, /about, /services, /projects, /insights, /contact
   - Dynamic: all project slugs, insight slugs, service slugs from Sanity
   - Priority: home 1.0, projects 0.9, insights 0.7, about/contact 0.8, services 0.8
   - changeFrequency: projects 'weekly', insights 'weekly', static 'monthly'
   - Revalidate: 86400 (24 hours)
   - Include /el/ versions of all pages once Greek is live
     For now: only /en/ routes

4. Create /src/app/robots.ts:
   - Allow all crawlers
   - Disallow: /studio, /api, /_next
   - Sitemap URL: https://tdkdb.com/sitemap.xml

5. Schema.org structured data:
   Create /src/components/seo/JsonLd.tsx — a generic client component
   that accepts a schema object and renders it as <script type="application/ld+json">

   Add these schemas:

   a) Organization — in root layout (every page):
   {
     "@type": "Organization",
     "name": "TDK Design & Build",
     "url": "https://tdkdb.com",
     "address": { "@type": "PostalAddress", "streetAddress": "Nafpliou 1",
       "addressLocality": "Lakatameia", "addressRegion": "Nicosia",
       "addressCountry": "CY" },
     "contactPoint": { "@type": "ContactPoint", "telephone": "[phone]",
       "contactType": "sales" }
   }

   b) LocalBusiness — on /contact page:
   {
     "@type": "LocalBusiness",
     "name": "TDK Design & Build",
     "@id": "https://tdkdb.com",
     "url": "https://tdkdb.com",
     "telephone": "[phone]",
     "address": { ... same as Organization ... },
     "geo": { "@type": "GeoCoordinates", "latitude": 35.1264, "longitude": 33.3156 },
     "openingHours": "Mo-Fr 09:00-18:00",
     "priceRange": "€€€"
   }

   c) RealEstateListing — on /projects/almond only:
   {
     "@type": "RealEstateListing",
     "name": "Almond Apartments",
     "description": "[project description]",
     "url": "https://tdkdb.com/en/projects/almond",
     "address": { "@type": "PostalAddress", "addressLocality": "Nicosia",
       "addressCountry": "CY" }
   }

   d) Article — on every /insights/[slug] page:
   {
     "@type": "Article",
     "headline": "[article title]",
     "author": { "@type": "Person", "name": "[author name]" },
     "datePublished": "[publishDate]",
     "publisher": { "@type": "Organization", "name": "TDK Design & Build" }
   }

   e) BreadcrumbList — on all sub-pages (/about, /services/*, /projects/*, /insights/*):
   Generate dynamically from the current path.
   Example for /projects/almond:
   Home > Projects > Almond

6. hreflang tags:
   In the root layout, add hreflang link tags for all pages:
   <link rel="alternate" hreflang="en" href="https://tdkdb.com/en/[path]" />
   <link rel="alternate" hreflang="el" href="https://tdkdb.com/el/[path]" />
   <link rel="alternate" hreflang="x-default" href="https://tdkdb.com/en/[path]" />

   For now, both EN and EL point to the same EN content (Greek pages don't exist yet).
   When Greek is live, EL href will point to the real translated page.
   This is standard practice — it won't hurt SEO to have the tags present.
```

**Check before moving on:**
- Sitemap accessible at /sitemap.xml and contains all pages
- Robots.txt accessible at /robots.txt and blocks /studio
- Organization schema visible in page source on every page
- LocalBusiness schema visible on /contact
- RealEstateListing schema visible on /projects/almond
- BreadcrumbList schema visible on sub-pages
- hreflang tags present in <head> on all pages
- All pages have unique <title> tags (verify in browser DevTools)

---

### PROMPT 7.2 — Analytics Setup

```
Implement GA4, cookie consent, and Microsoft Clarity.

Reference: TDK_MASTER_PLAN.md Section 13.

1. Create /src/components/analytics/GoogleAnalytics.tsx:
   - Uses Next.js Script component with afterInteractive strategy
   - Loads gtag.js only if user has given consent (check consent cookie)
   - GA4 measurement ID from NEXT_PUBLIC_GA_MEASUREMENT_ID env var
   - Do NOT fire any events if consent cookie is absent or declined

2. Create /src/lib/utils/analytics.ts:
   A typed event tracking utility. Only fires if consent is active.

   export function trackEvent(name: string, params?: Record<string, string | number>) {
     if (typeof window === 'undefined') return
     if (!getConsentStatus()) return
     window.gtag?.('event', name, params)
   }

   Pre-built named functions for every event in the analytics plan:
   trackContactFormSubmit(pageSource: string)
   trackProjectInterestSubmit(unitPreference: string)
   trackProjectView(projectName: string, projectStatus: string)
   trackCTAClick(ctaText: string, ctaLocation: string)
   trackInsightRead(articleTitle: string, category: string)
   trackGalleryInteract(projectName: string)
   trackPhoneClick(pageSource: string)
   trackEmailClick(pageSource: string)
   trackScrollDepth(percent: 25 | 50 | 75 | 100, pageTitle: string)
   trackUnitTableInteract(unitType: string, unitStatus: string)

3. Wire tracking calls:
   - trackProjectView() in /projects/[slug]/page.tsx (useEffect on mount)
   - trackContactFormSubmit() in contact form success handler
   - trackProjectInterestSubmit() in Almond interest form success handler
   - trackCTAClick() on all Button components that have an href
   - trackUnitTableInteract() on unit row hover in ProjectUnitsTable.tsx
   - trackGalleryInteract() on gallery image click in ProjectGallery.tsx
   - trackScrollDepth() via a custom useScrollDepth() hook added to root layout

4. Cookie consent banner:
   Create /src/components/ui/CookieBanner.tsx
   - Appears on first visit (no consent cookie present)
   - Position: fixed bottom, full width, z-index 200
   - Background: --color-surface, border-top: 1px solid var(--color-border)
   - Copy: "We use cookies to analyse traffic and improve your experience."
   - Two buttons: "Accept" (primary) | "Decline" (text variant)
   - Accept: sets cookie 'tdk_consent=granted', loads GA4, loads Clarity, hides banner
   - Decline: sets cookie 'tdk_consent=denied', hides banner, no scripts load
   - Consent cookie expires: 365 days
   - Banner never shows again after choice is made

5. Microsoft Clarity:
   Create /src/components/analytics/Clarity.tsx
   - Loads Clarity script only after consent is granted
   - Clarity project ID from NEXT_PUBLIC_CLARITY_PROJECT_ID env var
   - Add NEXT_PUBLIC_CLARITY_PROJECT_ID to .env.local and .env.example

   Add to vercel.json env vars and to check-env.ts script.

6. Add to root layout.tsx (in order):
   <GoogleAnalytics />
   <Clarity />
   <CookieBanner />

7. Legal pages:
   Create /src/app/[locale]/(site)/privacy-policy/page.tsx
   Create /src/app/[locale]/(site)/terms/page.tsx
   Placeholder content. Add a note: "Legal content to be provided by TDK."
```

**Check before moving on:**
- Cookie banner appears on first visit in incognito window
- Accepting consent: GA4 script appears in Network tab
- Declining consent: no GA4 or Clarity script in Network tab
- trackProjectInterestSubmit() fires after form submit (check GA4 Real-Time)
- trackContactFormSubmit() fires after contact form submit
- Privacy Policy and Terms pages accessible

---

## PHASE 8 – PERFORMANCE & POLISH

**Goal:** Hit performance targets. Refine every animation and interaction.

---

### PROMPT 8.1 — Performance Audit & Optimization

```
Run a performance audit and optimize the site.

1. Bundle analysis:
   Install @next/bundle-analyzer
   Run the analyzer and identify the largest chunks
   Any chunk over 100KB that can be code-split, split it

2. Image sequence optimization (homepage):
   - Verify both sequence folders are present and all frames are WebP format
   - Check total sequence sizes: assembly < 15MB, approach < 20MB
   - If over budget: re-run FFmpeg with lower quality (-q:v 65 instead of 80) and replace files
   - Verify the lazy loading strategy: first 30 frames load before assembly starts,
     rest loads in background — confirm in Network tab (no blocking)
   - Confirm canvas is set to display: none after Scene 4 (check in DevTools after scrolling through threshold)
   - Confirm frame arrays are nulled after threshold (check memory snapshot before/after)

3. Image optimization:
   - Audit all images: ensure all use next/image component
   - Add explicit width and height to all images (prevents CLS)
   - Add priority prop to above-fold images
   - Verify blur placeholders are generated for all Sanity images

4. Font optimization:
   - Josefin Sans: only load weights 300, 400, 600
   - JetBrains Mono: only load weight 400
   - Add preload link for critical fonts
   - Verify font-display: swap is set

5. Third-party scripts:
   - GA4: afterInteractive (already done)
   - Any other scripts: audit and defer

6. Run Lighthouse on:
   - Homepage (target: 85+ desktop, 70+ mobile)
   - A project detail page (target: 95+ desktop, 80+ mobile)
   - Contact page (target: 95+ desktop, 85+ mobile)

Fix the top 3 issues from each report.
```

---

### PROMPT 8.2 — Mobile Adaptation

```
Implement the mobile fallback for the homepage and audit all pages on mobile.

Homepage mobile adaptation (reference: TDK_HOMEPAGE_EXPERIENCE.md Section 22):
1. Detect mobile/touch: use a useMediaQuery hook for pointer: coarse or max-width < 1024px
2. On mobile: skip the canvas + image sequence system entirely (do not preload sequences)
3. Replace with a full-screen <video> element:
   - Source: /public/videos/approach-mobile.mp4 (compressed approach video from FFmpeg)
   - autoPlay, muted, playsInline, loop: false
   - onEnded: pause on final frame (e.currentTarget.pause())
4. Below the video hero: standard vertical scroll sections (no scroll-jacking)
   - Anatomy section: becomes a tap-through card stack (swipeable)
   - Philosophy: standard scroll reveal
   - All other sections: identical to desktop

Audit all interior pages at these widths: 375px, 428px, 768px, 1024px
Fix any layout issues found.

Key mobile rules:
- Touch targets minimum 44×44px
- No horizontal overflow on any page
- Font sizes never below 14px
- Inputs not zoomed on focus (font-size: 16px on inputs)
```

---

## PHASE 9 – QA & LAUNCH PREP

**Goal:** Ship with confidence.

---

### PROMPT 9.1 — Accessibility Audit

```
Audit and fix accessibility issues across the site.

Reference: TDK_MASTER_PLAN.md Section 17.

Run through this checklist and fix every issue:

1. Semantic HTML:
   - Every page has exactly one <h1>
   - Heading hierarchy is correct (h1 → h2 → h3, no skipping)
   - Nav elements use <nav> with aria-label
   - Main content wrapped in <main>
   - Footer in <footer>

2. Keyboard navigation:
   - Tab through every interactive element on every page
   - Focus is always visible (add a custom :focus-visible style — threshold outline)
   - Modal/lightbox traps focus correctly
   - Escape closes modals
   - Hamburger menu is keyboard accessible

3. ARIA:
   - Navbar: aria-label="Main navigation"
   - Mobile menu button: aria-expanded, aria-controls
   - Lightbox: role="dialog", aria-modal, aria-label
   - Accordion items: aria-expanded
   - Project filter tabs: role="tablist", role="tab", aria-selected
   - Building nodes in anatomy section: aria-label describing what the node is

4. Color contrast:
   - --color-paper on --color-void: verify 4.5:1 ratio (it should be ~12:1 — fine)
   - --color-stone on --color-void: check this one — it may fail
   - --color-threshold on --color-void: check for text use

5. Images:
   - Every img has a descriptive alt attribute
   - Decorative images have alt=""
   - Building render images have detailed alt text

6. prefers-reduced-motion:
   - Verify all GSAP animations skip when this is set
   - The canvas assembly sequence plays as a static hero still instead (show hero-still.webp directly, skip RAF loop)
   - No auto-playing videos without controls (mobile video respects this — add controls attribute if prefers-reduced-motion is true)

7. Forms:
   - All inputs have associated <label> elements
   - Error messages are announced by screen readers (aria-live)
   - Required fields marked with aria-required
```

---

### PROMPT 9.2 — 301 Redirects & Migration

```
Set up 301 redirects from the old WordPress site to the new site.

In next.config.ts, add a redirects() function.

Map old URLs to new URLs:
- /home → /
- /about-us → /about
- /our-services → /services
- /our-projects → /projects
- /our-buildings → /projects
- /contact-us → /contact
- /blog → /insights
- /blog/why-is-armonia-apartments-the-best-option-for-you → /insights/why-armonia-apartments
- Any other old WordPress URLs TDK can provide

All redirects: permanent: true (301)

Also:
- Ensure www.tdkdb.com redirects to tdkdb.com (or vice versa — pick one)
- Ensure HTTP redirects to HTTPS (Vercel handles this, just verify)
```

---

### PROMPT 9.3 — Performance Monitoring Setup

```
Set up production performance monitoring so issues after launch are caught immediately.

1. Vercel Speed Insights:
   Install @vercel/speed-insights
   Add <SpeedInsights /> to root layout.tsx
   This automatically collects Core Web Vitals (LCP, CLS, INP, FID, TTFB)
   from real users in production. No configuration required.

2. Vercel Analytics:
   Install @vercel/analytics
   Add <Analytics /> to root layout.tsx
   This gives page-level traffic data inside the Vercel dashboard.

3. Google Search Console — Core Web Vitals:
   After launch, verify the site is verified in GSC.
   Navigate to Core Web Vitals report.
   Set up email alerts for any "Poor" URLs (GSC > Settings > Email alerts).

4. Set up a simple uptime monitor:
   Use UptimeRobot (free tier) or Vercel's built-in checks.
   Monitor: https://tdkdb.com — alert immediately if site goes down.
   Monitor: https://tdkdb.com/en/projects/almond — the most critical page.

5. Post-launch monitoring checklist (do these in the first 48 hours after launch):
   - [ ] Check GSC for any new crawl errors
   - [ ] Check Vercel Speed Insights for initial Core Web Vitals
   - [ ] Check Microsoft Clarity for first session recordings
   - [ ] Check GA4 Real-Time for active users
   - [ ] Confirm Almond interest form is receiving test submission
   - [ ] Confirm contact form is receiving test submission
   - [ ] Check for any 404s in Vercel logs (from old WordPress URLs)
   - [ ] Verify image sequences load quickly on a real mobile device (not just emulation)
```

**Check before moving on:**
- SpeedInsights and Analytics components added to layout without errors
- UptimeRobot (or equivalent) monitoring both URLs
- GSC email alerts configured

---

### PROMPT 9.4 — Pre-Launch Checklist

Create a file /docs/LAUNCH_CHECKLIST.md and go through each item,
marking ✅ when confirmed or listing what needs fixing:

CONTENT:
- [ ] All placeholder copy replaced with real TDK copy
- [ ] All placeholder images replaced with real Cloudinary assets
- [ ] Logo SVG implemented (not text placeholder)
- [ ] Phone number confirmed and added throughout
- [ ] Email address confirmed and monitored by TDK
- [ ] Address correct
- [ ] Armonia project fully entered in Sanity (all fields, images, features)
- [ ] Almond project fully entered in Sanity (all fields, images, features)
- [ ] Almond units table populated with real floor/type/size/status data
- [ ] Almond construction progress % and label set in Sanity
- [ ] Almond construction update photos uploaded to Cloudinary + entered in Sanity
- [ ] At least 2 Insights articles published (not drafts)
- [ ] Privacy Policy content reviewed by TDK (not just placeholder)
- [ ] Terms content reviewed by TDK

TECHNICAL:
- [ ] All environment variables set in Vercel production (including CLARITY, REVALIDATE_SECRET)
- [ ] Sanity CORS origins include production URL (tdkdb.com)
- [ ] Resend domain verified for tdkdb.com (SPF, DKIM, DMARC)
- [ ] General contact form sends emails correctly — test end-to-end
- [ ] Almond interest form sends emails correctly — test end-to-end
- [ ] Almond interest form auto-reply arrives to test email within 2 minutes
- [ ] GA4 receiving events — check Real-Time in GA4 dashboard
- [ ] trackProjectInterestSubmit fires on Almond form submit (verify in GA4 Real-Time)
- [ ] trackContactFormSubmit fires on contact form submit
- [ ] Microsoft Clarity recording sessions (check Clarity dashboard after accepting consent)
- [ ] Google Search Console verified + sitemap submitted
- [ ] Robots.txt accessible and correct at /robots.txt
- [ ] Sitemap accessible at /sitemap.xml and contains all pages
- [ ] Schema.org markup valid — test with Google Rich Results Test
- [ ] hreflang tags present in page source
- [ ] No console errors in production build
- [ ] No TypeScript errors
- [ ] All 301 redirects working (test each old WordPress URL)
- [ ] ISR webhook registered in Sanity dashboard
- [ ] ISR webhook responds correctly when triggered

PERFORMANCE:
- [ ] Homepage Lighthouse: 85+ desktop
- [ ] Interior page Lighthouse: 90+ desktop
- [ ] No CLS issues
- [ ] All images optimized

LEGAL:
- [ ] Cookie consent banner working
- [ ] GA4 not loading before consent
- [ ] Privacy Policy live
- [ ] Terms live

DNS:
- [ ] Crawl existing WordPress site with Screaming Frog before touching DNS
      — export all live URLs, cross-check against 301 redirect list in next.config.ts,
      add any missing redirects before cutover
- [ ] DNS pointed to Vercel (follow Section 17.2 exact sequence in Master Plan)
- [ ] SSL certificate active (HTTPS green)
- [ ] MX records intact (email not broken — send test to info@tdkdb.com)
- [ ] www.tdkdb.com redirects to tdkdb.com (verify in browser)
- [ ] Old WordPress hosting cancelled (AFTER confirming new site works, domain renewal stays active)
```

---

## QUICK REFERENCE — WHAT TO FEED CURSOR WHEN

| Situation | What to feed |
|-----------|-------------|
| Starting any new phase | This document (the relevant phase section) |
| Starting any homepage scene | Full `TDK_HOMEPAGE_EXPERIENCE.md` |
| Starting any interior page | Sections 4, 5, 7 of `TDK_MASTER_PLAN.md` |
| Cursor seems to forget the design system | Sections 4, 5 of `TDK_MASTER_PLAN.md` |
| Cursor tries to use Three.js | "This project uses HTML5 canvas + image sequences, not Three.js. Never install or import three." |
| Cursor tries to use next/image with Cloudinary | "Use a plain <img> tag with cloudinaryUrl() — next/image is not for Cloudinary URLs" |
| Cursor tries to use Sanity image type | "All project images are Cloudinary IDs stored as strings in Sanity — see Section 12 of Master Plan" |
| Cursor tries to use Framer Motion | "This project uses GSAP only for all animations. Do not install framer-motion." |
| Cursor forgets animation patterns | Section 8 of `TDK_MASTER_PLAN.md` |
| Cursor hardcodes image paths instead of Cloudinary | Re-paste Prompt 2.2 and Section 3 of Master Plan |
| Debugging image sequence performance | Re-paste TDK_HOMEPAGE_EXPERIENCE.md Sections 2, 3, 4, 5 |
| Working on any project page | Re-paste TDK_MASTER_PLAN.md Section 7.6 + Prompt 5.5 |
| Adding a new project in Sanity | Re-paste Section 12.5 of Master Plan — Sanity workflow |
| Cursor forgets i18n routing | Re-paste Prompt 0.3 — all routes are under /src/app/[locale]/ |
| Cursor tries to add routes under (site)/ directly | "All routes must be under [locale]/(site)/ — see Prompt 0.3 folder structure" |
| Adding a new Sanity query | Re-paste Prompt 6.2 types + queries file |
| Cursor uses localStorage for consent | "Use cookies for consent state, not localStorage — see Prompt 7.2" |
| After launch: site seems slow | Check Vercel Speed Insights + Prompt 9.3 monitoring setup |

---

## GOLDEN RULES FOR WORKING WITH CURSOR

1. **One prompt = one component or one concern.** Never ask Cursor to build two unrelated things in the same prompt. It will mix them up.

2. **Always verify before continuing.** Every prompt has a "Check before moving on" section. Don't skip it. A bug found now is 10× cheaper than one found in Phase 8.

3. **Feed context liberally.** Cursor's context window is long but not infinite. If you're in a long session, re-paste the relevant spec section. It costs nothing.

4. **Name things exactly as the spec says.** Component names, file paths, CSS variable names, event names — they are all final. Consistency between files is what makes the codebase work.

5. **Don't let Cursor choose the animation library.** It will reach for Framer Motion. The answer is always GSAP. Every time. If you see `import { motion }` in generated code, stop and correct it.

6. **Don't let Cursor choose the homepage rendering approach.** It will suggest Three.js or WebGL. The answer is HTML5 canvas + pre-rendered image sequences. The canvas component must always be dynamically imported with `{ ssr: false }`.

7. **Don't let Cursor use Sanity's native image type.** It will default to Sanity image objects and `@sanity/image-url`. All project images are Cloudinary IDs stored as plain strings. Use `cloudinaryUrl()` and a plain `<img>` tag.

8. **All routes live under `[locale]/(site)/`.** Cursor will sometimes place new pages directly under `(site)/` or `app/`. Always correct this — i18n routing is the foundation of the architecture.

9. **Commit after every prompt.** Small commits = easy rollbacks. `feat: Phase 3.3 — Button component system`

10. **The homepage is a special case.** Every other page is standard Next.js server components + GSAP scroll reveals. The homepage is a canvas application driven by image sequences. Treat them as completely different codebases that happen to live in the same repo.

---

> **This document is the build bible.**
> Follow it in sequence. Update it when decisions change.
> The goal is a site that makes people say: *"This is smooth. This is creative. This is amazing."*
