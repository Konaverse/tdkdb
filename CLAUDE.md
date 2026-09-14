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
- GSAP is the animation library for all new work. Three.js and Framer Motion are gone from
  the project entirely. `SplitText` is registered in `gsap.ts` alongside ScrollTrigger.

### Homepage

The homepage (`src/app/[locale]/(site)/page.tsx`) is a small server component that fetches
three Sanity queries and composes, in order: `HomeLoader` (first-load intro) → `Hero` →
`ProjectsPinned` → `AboutGrid` → `TheDifference` → `FeaturedResidence` → `SceneContact`.
The Sept 2026 restructure (boards in `homepage_redesign.zip` at the repo root) has replaced
the hero and the projects section so far; About, the interlude, contact and the footer are
next, and everything after the hero is on a WHITE ground with the teal accent.

`Hero.tsx` — "TDK" behind the building. Two supplied plates, identical 1512 × 1300 frames
(`public/hero/hero-back.webp`, the street with the building removed; `hero-front.webp`, the
building with the sky knocked out), stacked in one full-width box at the plate's aspect with
the letters between them. **Never generate cutouts or composites of these — the user supplies
the layers.** All desktop copy lives in plate coordinates (`cqw` on the frame, which is a
container), measured off the board; the section is as tall as the plate, as the board is.
On load: the back plate wipes in as vertical stripes, T/D/K each slide one slot right into
their own mask (the slot is the glyph's advance box, the tracking a negative margin between
slots, so nothing clips), the front plate wipes down behind a soft mask driven by one CSS
variable, the social rings draw. DESIGN & / BUILD, the paragraphs (SplitText lines wiping
on left to right) and the CTA reveal on entering the viewport, once, armed after the load
sequence. Nothing moves on scroll — the user rejected parallax outright.

`ProjectsPinned.tsx` — a port of **Passage** from the user's own library
(`C:/Users/konst/Projects/magnificent_sections/src/sections/work/realestate/passage/`), which
is the motion and design they asked for. A white editorial ledger: the renders travel through
the viewport as a centred vertical filmstrip of 3:2 frames (44vw column, 10svh gaps, the
first frame centred by pure CSS padding), the previous frame still leaving above and the next
arriving below; the project's name stands large on the left over the photograph and changes
by a FOCUS PULL (opacity + blur, never a slide); each photograph pans slowly against the
travel; a stacked index lower left and a circle button lower right jump the scroll, snapped
to whole projects; the entrance sharpens everything in from blur. `render(p)` is the single
writer of the strip translate, the pans, the name focus states and the index states — never
add a tween or CSS transition to any of them. TDK adaptations: Josefin, no wordmark/menu (the
navbar holds the corners), clicks open `ProjectModal`, Lenis glides the jumps. Read the
source folder's `meta.ts` and `README.md` before changing it.

Rule for both, and for every section to come: the scrubbed or scroll-driven timeline and
the one-shot entrance never share a node and a property — where they would, the entrance
gets its own wrapper. In development the hero's load timeline, the projects ScrollTrigger
and `ScrollTrigger` itself are exposed on `window` (`__heroTl`, `__projectsSt`, `__ST`) for
scrubbing from the console; an occluded Chrome tab freezes rAF, so verify by scrubbing, not
by waiting.

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
2. **No Framer Motion** — GSAP for all animation.
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
