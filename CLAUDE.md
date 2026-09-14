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

The site is deliberately small. The **only** pages are: homepage, About, Projects index,
Project detail (`projects/[slug]`), and Contact — plus `privacy-policy` and `terms` stubs.
There is no Services section and no Insights/blog section; both were removed in Aug 2026
along with their Sanity schemas. Do not reintroduce them without being asked.

### Rendering Strategy

- **Homepage** — server component; fetches Sanity, composes client scene components.
- **Project / About pages** — ISR with `revalidate: 60`.
- **Studio** — fully dynamic SSR (Sanity Studio is a client-side SPA).

### Data Flow

All Sanity reads happen in **Server Components** using the public `client` from `src/lib/sanity/client.ts`. The `serverClient` (token-bearing) is **only** for API routes. GROQ queries go in `src/lib/sanity/queries.ts`; return types in `src/lib/sanity/types.ts`.

All CMS images are **Cloudinary public IDs stored as strings in Sanity** — not native Sanity image objects. Use `cloudinaryUrl()` and the preset helpers in `src/lib/cloudinary/transforms.ts` to generate URLs. Render them as plain `<img>` tags, not `next/image` (Cloudinary handles optimization). Use `next/image` only for local static assets in `/public/`.

### Animation Stack

- **GSAP** (`src/lib/animations/gsap.ts`) — single import point, registers ScrollTrigger once. Always import `{ gsap, ScrollTrigger }` from `@/lib/animations/gsap`, never directly from `gsap`.
- **Lenis** (`src/lib/animations/lenis.ts`) — smooth scroll singleton, driven by the GSAP ticker. Initialized in `SmoothScrollProvider` which wraps the root layout. `gsap.ticker.lagSmoothing(0)` is required.
- All GSAP animations go inside `useLayoutEffect` with a `gsap.context()`. Cleanup is always `ctx.revert()` — this is mandatory for React Strict Mode compatibility and route-transition cleanup.
- GSAP is the animation library for all new work. Three.js is gone from the project entirely.
  Framer Motion survives in exactly one place — `src/components/ui/lamp.tsx`, used by
  `HeroMinimal` — and should not spread beyond it.

### Homepage

The homepage (`src/app/[locale]/(site)/page.tsx`) is a small server component that fetches
two Sanity queries and composes, in order: `HomeLoader` (first-load intro) → `Hero`
(asymmetric split photograph) → `AboutGrid` (flat architectural grid, no pin) →
`HomepageReel` → `TheDifference` → `FeaturedResidence` → `SceneContact`.

`HomepageReel.tsx` is the heavy piece — one pinned GSAP timeline, desktop (`lg+`) only:

- It opens on a **title card**: `PROJECTS` tracked out to exactly 80% of the viewport at the
  bottom left. The tracking is computed in JS (flex `gap`, never `letter-spacing` or
  `scaleX`) so the word measures 80% at any width. The first project's leading edge then
  **bulldozes** it — each glyph is displaced by its own overlap with that edge, which stacks
  every displaced glyph right-aligned against it, and crossfades it from solid to outline.
  This is imperative geometry via `quickSetter`s inside the scrubbed timeline, NOT tweens:
  it has to stay frame-locked to the panel, and ScrollTrigger's `onUpdate` reports the raw
  progress, which runs ahead of a scrubbed timeline.
- Each project is then **one viewport** laid out on an 8 × 8 grid addressed A1–H8 with row 1
  at the top: heading A1–C2, CTA A3–C3, description D1–E3, main image A4–D8, secondary image
  F1–H4, site plan F6–H8. Column E below row 3 and the F–H row 5 band are held open on
  purpose. Placement is inline `gridColumn` / `gridRow` via the `cell()` helper, so the code
  reads in the same addressing as the design. There are no drawn gridlines — only a hairline
  outer frame, which is also what the pushed glyphs stack against.
- Projects arrive right-to-left over their predecessor, which keeps drifting left at a third
  of the speed. Arrival composes the sheet (heading masks up, description and CTA follow,
  ring draws, streets ink, marker drops last); departure shears the typeset material apart
  at four different rates behind a rising veil.
- **The two photographic plates have no animation at all** — no entrance, no exit, no
  parallax. They are on the sheet when it arrives and leave with it. This is deliberate: the
  composition assembles around two fixed points. Don't "restore" it.
- Behind each sheet, the main image runs again full-bleed as an atmospheric wash via
  `backdropImage()`. That preset is pre-blurred by **Cloudinary**, not by a CSS `filter` — a
  full-viewport blur inside a pinned, scrubbed section is a live GPU pass on every frame.
  A radial scrim puts the wash's clear point on the open column E and closes it to near-void
  behind the heading, the description and the site plan's hairline streets.

`ProjectMiniMap.tsx` draws the F6–H8 cell: an abstract rotated street grid generated
deterministically from the project slug (seeded PRNG — never `Math.random()` at render, it
must match between server and client). Pass `roads` to override the generator with real
traced geometry. Project data comes from Sanity; `homepageIntro` is the description. Below
`lg` the whole thing degrades to a plain vertical stack with no pin.

### Design System

CSS custom properties are defined in `src/styles/globals.css`. Tailwind config (`tailwind.config.ts`) maps them to utility classes. Key tokens:

- **Colors**: `void`, `surface`, `paper`, `stone`, `threshold`, `glass`, `border` — all reference CSS vars.
- **Accent**: teal/slate blue `#66979f` (not amber — accent was changed from `#F5A623`).
- **Fonts**: Josefin Sans (`--font-josefin`, `font-sans`) + JetBrains Mono (`--font-jetbrains`, `font-mono`).
- **Font variable for JetBrains Mono** is `--font-jetbrains`, not `--font-mono` (the design token `--font-mono` references `var(--font-jetbrains)` to avoid circular reference).
- Typography scale: `text-display-xl`, `text-display-lg`, `text-display-md`, `text-heading`, `text-body-lg`, `text-body`, `text-label`, `text-mono`.
- Tailwind `cn()` helper: `src/lib/utils/cn.ts` (clsx + tailwind-merge).

### i18n

There is no i18n library and no translation layer — the unused `src/lib/i18n/` scaffolding was
deleted. `[locale]` is a routing segment only; `src/middleware.ts` holds the locale list and
redirects everything to `/en`. Copy is written inline in English.

## Hard Rules

1. **No Three.js** — the dependency has been removed. Use GSAP or plain canvas.
2. **No new Framer Motion** — GSAP for all animation; the one legacy `lamp.tsx` usage is the sole exception.
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

Spec documents live in the project root. **Treat them as historical, not current** — they
describe an earlier, much larger version of the site (canvas image sequences, a Services
section, an Insights blog) that no longer exists. Verify against the code before acting on them.

- `TDK_MASTER_PLAN.md` — original PRD
- `TDK_CURSOR_BUILD_STRATEGY.md` — sequential build prompts (progress tracked in `HANDOFF.md`)
- `TDK_HERO_SECTION_V2.md` — superseded hero spec
- `docs/ADR.md` — 11 architecture decision records
