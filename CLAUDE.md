# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (next lint + prettier)
```

No test suite is configured. There is no single-test command.

## Architecture Overview

This is the **TDK Design & Build** website — a real estate developer in Greece. It is a Next.js 14 App Router project with TypeScript, Tailwind CSS, Sanity CMS, and Cloudinary. Deployed to Vercel.

### Routing

- All pages live under `src/app/[locale]/(site)/`. The `[locale]` segment is `en` or `el`.
- Middleware (`src/middleware.ts`) redirects `/` → `/en/`. Greek (`/el/`) is scaffolded but disabled.
- Sanity Studio is at `/studio` (excluded from locale middleware).
- API routes in `src/app/api/`: `contact`, `project-interest`, and `revalidate` (Sanity webhook).

### Rendering Strategy

- **Homepage** — SSG shell + `dynamic(() => import('HomepageCanvas'), { ssr: false })`. Canvas is client-only.
- **Project/Insights pages** — ISR with `revalidate: 60` (projects) / `revalidate: 300` (insights).
- **Static pages** (About, Services, Contact) — ISR with `revalidate: 3600`.
- **Studio** — fully dynamic SSR (Sanity Studio is a client-side SPA).

### Data Flow

All Sanity reads happen in **Server Components** using the public `client` from `src/lib/sanity/client.ts`. The `serverClient` (token-bearing) is **only** for API routes. GROQ queries go in `src/lib/sanity/queries.ts`; return types in `src/lib/sanity/types.ts`.

All CMS images are **Cloudinary public IDs stored as strings in Sanity** — not native Sanity image objects. Use `cloudinaryUrl()` and the preset helpers in `src/lib/cloudinary/transforms.ts` to generate URLs. Render them as plain `<img>` tags, not `next/image` (Cloudinary handles optimization). Use `next/image` only for local static assets in `/public/`.

### Animation Stack

- **GSAP** (`src/lib/animations/gsap.ts`) — single import point, registers ScrollTrigger once. Always import `{ gsap, ScrollTrigger }` from `@/lib/animations/gsap`, never directly from `gsap`.
- **Lenis** (`src/lib/animations/lenis.ts`) — smooth scroll singleton, driven by the GSAP ticker. Initialized in `SmoothScrollProvider` which wraps the root layout. `gsap.ticker.lagSmoothing(0)` is required.
- All GSAP animations go inside `useLayoutEffect` with a `gsap.context()`. Cleanup is always `ctx.revert()` — this is mandatory for React Strict Mode compatibility and route-transition cleanup.
- Never use Framer Motion. Never use Three.js.

### Homepage Canvas

The homepage uses an HTML5 `<canvas>` for a scroll-driven image sequence experience:
- **Assembly sequence**: ~120 WebP frames in `/public/sequences/assembly/`
- **Approach sequence**: ~180 WebP frames in `/public/sequences/approach/`
- Mobile / slow connections get an MP4 fallback at `/public/videos/approach-mobile.mp4` — detected client-side via `pointer: coarse` or `window.innerWidth < 1024`.
- After Scene 4, `teardownCanvas()` frees ~26MB RAM and ~8MB GPU memory (canvas resized to 1×1, arrays nulled).
- Homepage state machine (`idle → loading → assembling → hero → scrolling → post-canvas`) lives in a `useReducer` in `page.tsx`.

### Design System

CSS custom properties are defined in `src/styles/globals.css`. Tailwind config (`tailwind.config.ts`) maps them to utility classes. Key tokens:

- **Colors**: `void`, `surface`, `paper`, `stone`, `threshold`, `glass`, `border` — all reference CSS vars.
- **Accent**: teal/slate blue `#66979f` (not amber — accent was changed from `#F5A623`).
- **Fonts**: Josefin Sans (`--font-josefin`, `font-sans`) + JetBrains Mono (`--font-jetbrains`, `font-mono`).
- **Font variable for JetBrains Mono** is `--font-jetbrains`, not `--font-mono` (the design token `--font-mono` references `var(--font-jetbrains)` to avoid circular reference).
- Typography scale: `text-display-xl`, `text-display-lg`, `text-display-md`, `text-heading`, `text-body-lg`, `text-body`, `text-label`, `text-mono`.
- Tailwind `cn()` helper: `src/lib/utils/cn.ts` (clsx + tailwind-merge).

### i18n

Simple manual i18n — no `next-intl` or similar library. Config in `src/lib/i18n/config.ts`. Translation strings in `src/lib/i18n/translations.ts`. Greek content is scaffolded but not yet translated.

## Hard Rules

1. **No Three.js** — canvas uses HTML5 canvas + image sequences only.
2. **No Framer Motion** — GSAP only for all animation.
3. **No Sanity native images** — all images are Cloudinary IDs (strings) in Sanity.
4. **`SANITY_API_TOKEN` must never have `NEXT_PUBLIC_` prefix** — server-only.
5. **Email addresses come from env vars** — never hardcoded.
6. **One prompt = one component** — commit after each prompt as `feat: Phase X.Y — description`.
7. **`serverClient` is API-routes-only** — never import it in component files.

## Environment Variables

Copy `.env.example` to `.env.local`. Required vars:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`
- `SANITY_API_TOKEN` (server-only), `SANITY_REVALIDATE_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_BASE_PATH`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_FORM_TO_EMAIL`, `INTEREST_FORM_TO_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

## Key Planning Documents

Full spec documents live in the project root — read these for context before building any new feature:
- `TDK_MASTER_PLAN.md` — complete PRD
- `TDK_HOMEPAGE_EXPERIENCE.md` — homepage scene-by-scene spec
- `TDK_CURSOR_BUILD_STRATEGY.md` — sequential build prompts (current progress tracked in `HANDOFF.md`)
- `docs/ADR.md` — 11 architecture decision records
