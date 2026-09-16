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
two Sanity queries and composes, in order: `HomeLoader` (first-load intro) → `Hero` →
`ProjectsPinned` → `AboutGrid` → `Interlude` → `ContactSection`.
The Sept 2026 restructure (boards in `homepage_redesign.zip` at the repo root) has replaced
the hero, the projects section, the interlude and contact, and repainted About light (same
grid and motion, teal stat cells), and replaced the site-wide footer (the old dark
`FeaturedResidence` spotlight was removed at the user's request), and everything after the hero is on a
WHITE ground with the teal accent.

`ProjectsPinned` scrolls under Lenis, so it uses `scrub: true` and snaps by retargeting Lenis
once input stops — never ScrollTrigger's own `snap`, which fights Lenis at the pin's ends.

`Interlude.tsx` — BELOW lg (1024px) it is NOT pinned and has no second state: the render is a
sticky backdrop and the three beats stack vertically over it, revealed once each (the user
rejected vertical-scroll-drives-horizontal on mobile). From lg up: one pinned, scrubbed timeline whose pin is exactly its duration in viewport
heights (~7.3). Entrance, once on arrival: title words slide sideways into masks and the first
beat's lines wipe on (the hero's reveals, on their own nodes). Beats: the title row glides with a
long power3.inOut, the incoming title trailing and settling; paragraph lines are wiped off and
written on left to right (SplitText lines in masks, rebuilt on width change). Then the render
shrinks (scale + clip, camera pulling back inside) to a frame over a teal "TDK DESIGN & BUILD" that
drifts edge to edge on its own endless, time-based tween (NOT scroll-driven, at the user's
request; paused off screen), and "We House / Your Dream" slides in, allowed to overlap the frame's top
edge so it never clips. The photograph has its own parallax trigger; the user asked for it
explicitly here, the hero stays parallax-free. Scrub is `true` (never numeric under Lenis).

`ContactSection.tsx` — the board's Norm-Architects layout: CONTACT (Josefin light, letters
sliding into masks), an intro with one "Write to us" link to /en/contact, a drawn 2×2 grid of
details from Sanity siteSettings (email, phone, address, socials; never hardcode them), and a
full-height render (armonia/interior/6) on the right. Entrance only, once; nothing on scroll.

`FooterClient.tsx` (site-wide, every page) — the room behind the page. It stays in the flow;
its contents ([data-drift]) start 42% up behind its own top edge and scrub to 0, so the section
above leaves at full speed and the footer is uncovered moving slower, a veil lifting off it.
Dimmed armonia/interior/2 full bleed; ONE frosted container across the width holding "Stay in
contact" + its line, Index, Studio, socials, email and legal, compact at the top of a FULL-VIEWPORT
footer (the user wants the footer full height, only the container short); and "TDK DESIGN & BUILD" on one tightly tracked line along the foot, sized
by fit() to span the margins and sunk 0.26em so the bottom edge clips it. The letters and the panel are painted with aligned copies of the render
(brightened for the letters, Cloudinary-blurred for the glass) by paint(): NEVER backdrop-filter
or a clip-path wipe there, both re-rasterise on every frame of the reveal. Data from siteSettings.

`NavbarClient.tsx` (site-wide) — logo left; Contact | EN·EL | burger right, margins from the hero
(2vw left, 1.35vw right). The bar is only ever pure black or pure white — NOT a difference blend
(over photos it inverts colours). Sections, and dark regions inside them, carry data-nav="light" |
"dark"; the logo and the right cluster each read what is under them on the GSAP ticker and switch
independently. Any new section MUST declare data-nav. Contact is a button filled with the ink.
The burger opens a small WHITE dialog whose top-right corner is locked (clip-path unfolds from
it), lines turn into a black X, contents arrive by the side reveal, and the current page is teal.

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
to whole projects; the frames enter with the shared strip reveal (below) and the name block sharpens in from blur. `render(p)` is the single
writer of the strip translate, the pans, the name focus states and the index states — never
add a tween or CSS transition to any of them. TDK adaptations: Josefin, no wordmark/menu (the
navbar holds the corners), frames and names are links that open the project page through
`ProjectTransition`, Lenis glides the jumps. The brochure `ProjectModal` was removed (Sept 2026). Read the
source folder's `meta.ts` and `README.md` before changing it.

`ProjectTransition.tsx` (`src/components/transition/`, mounted in the (site) layout so it survives
navigation) — clicking a project on the homepage lifts its render onto a fixed layer, a white veil
rises over the page, and the render opens to full bleed (window = clip box translated/scaled from
the frame rect; picture = natural-aspect box lerped from the thumbnail's cover box to the
viewport's, same eased t, so it always covers; CustomEase `projectExpand`). The route is pushed
ONLY after the expansion (a mid-flight commit is a visible jump), with the scroll reset in the same
still moment. `ProjectHero` claims the run at first render, renders the exact URL the layer decoded
(`projectHeroUrl` ladder), and calls `handoff()`; the provider refreshes ScrollTrigger, waits for
smooth frames, then removes the layer and the hero's copy and the navbar enter. The hero image must
stay 100% × 100svh object-cover with no transform/filter/dimming on arrival, or the handoff shows.

### Projects hub

`projects/page.tsx` + `ProjectsClient.tsx` (Sept 2026) — white, editorial, no eyebrows, no
filters/tabs/cards (the old FilterTabs, ProjectCard and masonry grid are gone). A typographic
hero — "Projects", a lead, and three mono figures counted from Sanity (buildings, residences,
available) — then one entry per project: the project page's plate (content width, 16:9, render
pulling back on scroll, `RevealFrame` entrance) with the name and particulars under it on the
page grid. A plain click opens the project through `ProjectTransition`, as on the homepage;
`getProjectsForIndex()` supplies the units the figures need.

### Project page

`projects/[slug]/page.tsx` (Sept 2026 redesign) is, in order: `ProjectHero` (full bleed, settled)
→ `ProjectScenes` → `ProjectAvailability` → `ProjectStory` → `ProjectRegister`, white ground,
Josefin light, NO eyebrows and no decorative hairlines (user's request). Everything is scroll:
no galleries, lightboxes, tabs or draggable strips. `ProjectScenes` is four editorial spreads
fed exactly five images by `sceneImages()` (galleries de-duplicated, hero only as a fallback,
then cycled), stacked on the page grid with `gap-page` between them — the user wants ONE measure
of white around every picture, section heights don't matter: A aperture (content-width 16:9,
render zooms out on scroll), B side note (6-col portrait + quote/features in cols 8–12),
C diptych (8 + 4 cols, same height, renders drift at different rates inside their frames),
D plate (the aperture again — the sequence opens and closes on the same plate; it replaced a
panorama band the user found ugly). Frames never move or scale on scroll —
only the render inside them does, so the grid stays exact. Availability is a rule-less banded table with three counting figures; Story is
the description lead + percentage/bar + specs; Register is the one teal section and posts to the
unchanged `/api/project-interest`.

Rule for both, and for every section to come: the scrubbed or scroll-driven timeline and
the one-shot entrance never share a node and a property — where they would, the entrance
gets its own wrapper. In development the hero's load timeline, the projects ScrollTrigger
and `ScrollTrigger` itself are exposed on `window` (`__heroTl`, `__projectsSt`, `__ST`) for
scrubbing from the console; an occluded Chrome tab freezes rAF, so verify by scrubbing, not
by waiting.

### Design System

- **Page grid** — `--page-margin` (max(16px, 2vw), the navbar/hero edge) and `--page-gutter`
  (= margin) in `globals.css`, with utilities `px-page`, `py-page`, `gap-page`, `gap-x-gutter`,
  `-mx-page` defined in its `@layer utilities` (NOT in tailwind.config: the dev server does not
  reload config changes, which silently zeroed every margin once). 12 columns. Every project
  page section uses it; content always keeps the margin.
- **Image entrance** — every image that is not a full-bleed background enters with
  `stripReveal` (`src/lib/animations/stripReveal.ts`; `<RevealFrame>` in markup): cover strips of
  the ground colour wipe off left→right, top strip first, while the render settles from 1.1,
  firing at `top 92%`. Used by the project scenes, ProjectsPinned frames, About photos and the
  Contact photo. Do not invent per-section image entrances. Full-bleed images (hero, Interlude,
  footer) are exempt.

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
