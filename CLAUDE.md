# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `MEMORY.md` first for the latest user decisions, completed work, verification
and external limitations. `HANDOFF.md` points to the current continuation documents.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint (next lint + prettier)
pnpm test:forms   # Isolated enquiry delivery checks; no external emails
pnpm test:crm     # Isolated Brevo contact/deal/queue recovery checks
```

`tools/check-form-delivery.cjs` exercises the real enquiry handlers with isolated
mail and CMS substitutes. Browser QA helpers are local, ignored files under `.tmp/`.

### Enquiries and Brevo CRM

Keep Resend as the enquiry success authority. Brevo is enabled only through the
server-only `BREVO_ENABLED` flag; `BREVO_API_KEY` and `CRON_SECRET` stay private.
The confirmed routing sends ALL website enquiries to Almond Pipeline/New Inquiry
while preserving their actual property/service interest. `src/lib/crm/` owns the
contact upsert, associated deal/notes and durable private Sanity receipts. New
form requests use retry-stable UUIDs and separate Resend idempotency keys for the
notification and acknowledgement. Do not make CRM or archive failure return a
false failure after the studio email was accepted.

CRM delivery is checkpointed under a revision-checked lease. Brevo deal/note POSTs
with unknown outcomes must be reconciled by their stable markers or reviewed,
never blindly repeated. `/api/crm/retry` is an authenticated, uncached daily worker
with explicit operator recovery actions. New enquiry/lead IDs intentionally use
dotted private namespaces to protect customer data from anonymous CMS reads.
Contact blacklist/marketing consent flags are never overwritten. Use
`docs/brevo-crm.md` for configuration, approved Preview validation and recovery.
This integration must not be deployed to Production without explicit approval.

## Architecture Overview

This is the **TDK Design & Build** website — a residential developer in Cyprus.
It uses Next.js 14 App Router, TypeScript, Tailwind CSS and Sanity CMS.

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

CMS images are **Sanity image fields**, uploaded in the Studio (Cloudinary was removed in Sept 2026). Build URLs with `imageUrl()` / `imageSrcSet()` and the presets in `src/lib/sanity/image.ts`, and render plain `<img>` tags, not `next/image`. Photographs the DESIGN asks for by name (About's plates, the interlude) are `siteImage` documents keyed by slug: a server component fetches `getSiteImages()` and passes them down. Explicit local-asset exceptions are the hero plates, logo, user-requested Modular footer photograph, eight Almond apartment interiors and three replacement About process photographs. The latter eleven use optimized responsive WebPs under `public/images/requested/` and a typed manifest in `src/lib/content/requested-images.ts`; CMS uploads were unavailable in the editing environment. Project images can carry optional `alt` and `caption` metadata; `ImageFootnote` renders the caption inside the photograph.

**Sanity ids must not contain a dot.** A document whose `_id` has a dot is private to authenticated clients, so `siteImage.about-hero` returned nothing for the site's public client while the token saw it. Use `siteImage-about-hero`.

### Animation Stack

- **GSAP** (`src/lib/animations/gsap.ts`) — single import point, registers ScrollTrigger once. Always import `{ gsap, ScrollTrigger }` from `@/lib/animations/gsap`, never directly from `gsap`.
- **Lenis** (`src/lib/animations/lenis.ts`) — desktop smooth scroll singleton, driven by the GSAP ticker. `SmoothScrollProvider` leaves touch-only devices on native scrolling and respects changes to pointer/reduced-motion preferences. `gsap.ticker.lagSmoothing(0)` is required on desktop. Use the shared `lockPageScroll()` for overlays; a Lenis-only stop cannot lock native phone scrolling.
- All GSAP animations go inside `useLayoutEffect` with a `gsap.context()`. Cleanup is always `ctx.revert()` — this is mandatory for React Strict Mode compatibility and route-transition cleanup.
- GSAP is the animation library for all new work. Three.js and Framer Motion are gone from
  the project entirely. `SplitText` is registered in `gsap.ts` alongside ScrollTrigger.

Font-dependent hero copy has `data-hero-copy`: CSS hides it before hydration, and
the page reveals it only after character masks are ready. Reduced motion and the
root noscript fallback show resting text. Use `whenFontsReady` to initialize cached
fonts synchronously and cancel pending work on unmount. `nearViewport` prepares
below-fold About, Projects and footer text shortly before it reaches the screen;
create it inside a GSAP context so deferred work is owned by that context.
`RevealFrame` likewise hides `data-image-entrance` until its white entrance cover
is installed, preventing a photograph from appearing and then wiping in again.

Mobile motion uses masked words instead of individual characters and a shorter
image-cover entrance without a simultaneous image scale. About and project image
drift is desktop-only. `ScrollTrigger.config({ ignoreMobileResize: true })` prevents
mid-gesture refreshes from browser toolbars; the provider refreshes changed layout
after scrolling/resizing settles, excluding open dialogs, focused fields and zoom.
Use `ArrowIcon` for link arrows so mobile fonts cannot substitute emoji glyphs.

### Image lightbox

`ImageLightboxProvider` lives in the site layout. Editorial `RevealFrame`s opt in
with `lightbox` (one page gallery) or a group name. Custom image frames declare
`data-lightbox="page"` and include `LightboxTrigger`. Keep project-page image links
as navigation: do not place lightbox buttons over them. Hub hero portraits use their
own group, and the footer photograph is a separate one-image group.

The native modal dialog shows uncropped, responsive Sanity images or bundled WebPs.
Its dimensions and offset follow `visualViewport` through resize/scroll listeners,
with a `100dvh` CSS fallback, so browser toolbars and zoom cannot strand controls.
Fit every photograph inside the same responsive 16:9 landscape frame with `contain`.
Reserve a fixed two-line caption area so cycling portrait/landscape images or captions
never changes the frame dimensions or control positions.
Desktop arrows are rectangular controls beside the image; mobile and coarse-pointer
devices use transparent arrows inside it. Support swipe, keyboard arrows, Escape,
focus trapping, scroll/focus restoration, reduced motion and preview fallback.
Triggers stay disabled until the provider is active. Only adjacent large images
are prefetched after opening; no gallery decoding work happens during route entry.
Close and restore scrolling on navigation. Native cursor styles stay visible inside
the top-layer dialog, where the custom cursor cannot render.

### Production fonts and mail diagnostics

Load the committed Josefin Sans variable WOFF2 through `next/font/local` in the
root layout. `src/app/fonts/OFL.txt` holds its license. Keep `--font-josefin` and
the font class on `<html>`; builds must not depend on sandbox font substitutes or
Google Fonts access. The variable font supports normal weights 100 through 700.

Production compilation preserves `console.error` and `console.warn`. Keep the
Resend rejection name, status and message in server logs, without credentials or
submitted enquiry bodies. Whitespace in mail environment values is trimmed.

### Homepage

The homepage (`src/app/[locale]/(site)/page.tsx`) is a small server component that fetches
two Sanity queries and composes, in order: `HomeLoader` (first-load intro) → `Hero` →
`FeaturedProject` (Almond Suites, primary Register interest CTA) → `ProjectsPinned` → `AboutGrid` → `Interlude` → `ContactSection`.
The Sept 2026 restructure (boards in `homepage_redesign.zip` at the repo root) has replaced
the hero, the projects section, the interlude and contact, and repainted About light (same
grid and motion, teal stat cells), and replaced the site-wide footer (the old dark
`FeaturedResidence` spotlight was removed at the user's request), and everything after the hero is on a
WHITE ground with the teal accent.

`FeaturedProject.tsx` overlays availability on the left, the selling line in the center,
and progress on the right of the desktop photograph. The overlay fades on mouse hover
and keyboard focus; touch keeps it visible. Below lg, only the selling line overlays
the image, with concise copy and the Register interest CTA stacked to fit one viewport.
`AboutGrid` has no eyebrow on desktop or mobile; preserve its open left columns.

`ProjectsPinned` scrolls under Lenis, so it uses `scrub: true` and snaps by retargeting Lenis
once input stops — never ScrollTrigger's own `snap`, which fights Lenis at the pin's ends.
This applies to desktop. Mobile keeps the filmstrip with native CSS sticky positioning,
stable `100svh` stage geometry and no automatic snap, blur or inner-image pan. Measure
frame height and the computed CSS gap, never the changing `window.innerHeight`.
Only the first mobile strip image gets a separate entrance. Responsive sources avoid
decoding a desktop-sized photograph for every phone frame. MatchMedia owns breakpoint
cleanup so switching screen sizes cannot leave duplicate pins/listeners.

`Interlude.tsx` — BELOW lg (1024px) it is NOT pinned and has no second state: the render is a
sticky backdrop and the three beats stack vertically over it, revealed once each (the user
rejected vertical-scroll-drives-horizontal on mobile). From lg up: one pinned timeline with
`scrub: true` owns the title row, image pullback, nested glass and masked character rises.
The photograph has its own parallax node and trigger. After the beats, the render shrinks
to a centered frame, capped by viewport height to keep the original paragraph visible below.
"WE HOUSE" sits to the left and "YOUR DREAM" to the right, both centered vertically on the
image. The cyan background wordmark is removed. `InterludeGlass.tsx` adds three successively
smaller, concentric clear panes: the first opens from the image edges, then each inner pane
opens from its parent's settled edges after the previous one finishes. The sequence runs
between 40% and 78% of the pullback so all panes finish before the image visually settles.
Canvas redraws four narrow refracted crops of the actual photograph
only at the rims; centers are fully transparent, with no blur or frost. Samples
follow crop, scale, dimming and parallax. All scrubbed motion reverses with scroll. Rebuild
splits on width change, remove listeners on cleanup, and show the final panes without their
entrance under reduced motion. The hero stays parallax-free.

`ContactSection.tsx` — the editorial CONTACT heading, its original introductory
paragraph in the same position, a working enquiry form replacing the old details grid,
and the full-height Armonia interior/6 render on the right. The Write to us link is removed.
`src/components/contact/ContactForm.tsx` is shared with the Contact page, submits to
`/api/contact`, and handles field errors, delivery errors, retry and confirmation.
Entrance only, once; reduced motion leaves content visible.

`FooterClient.tsx` and its CSS module (site-wide) — the user-supplied footer.png reference:
a white four-column index (TDK, Company, Get in touch, Legal), a teal Register interest
rectangular button with white text leading to Almond Suites, then one huge TDK DESIGN & BUILD line filled with the
photograph that continues full width beneath it. The requested Modular 2-bedroom
1_4 - Sunset.jpg is bundled unchanged as public/images/footer-modular-sunset.jpg and
imported by Footer.tsx; all contact details still come from siteSettings. Fit the actual
wordmark to the page margins and align both image copies on resize. Text uses the shared
masked character rise on its index columns only, once, reverting splits on completion.
The large image-filled wordmark stays unsplit and visible immediately, with no entrance.
The white content and letter shapes scroll normally while the room starts raised and
travels more slowly. One scroll offset drives the photograph and wordmark background
together; image overscan covers the entire range. Reduced motion keeps the image static.
Two-column mobile
layout, visible focus states, reduced motion supported. On phones and touch tablets,
the photograph and its matching letter fill stay static; desktop keeps parallax.
Filled button labels use
.button-label for a small optical correction to Josefin’s glyph alignment.

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
On load: the back and building plates reveal together in fourteen paired tiles,
then T/D/K each slide one slot right into
their own mask (the slot is the glyph's advance box, the tracking a negative margin between
slots, so nothing clips), and the social rings draw. DESIGN & / BUILD, the paragraphs
(masked per-character rises) and the CTA reveal on entering the viewport, once, armed after the load
sequence. Nothing moves on scroll — the user rejected parallax outright.

`ProjectsPinned.tsx` — a port of **Passage** from the user's own library
(`C:/Users/konst/Projects/magnificent_sections/src/sections/work/realestate/passage/`), which
is the motion and design they asked for. A white editorial ledger: the renders travel through
the viewport as a centred vertical filmstrip of 3:2 frames (44vw column, 10svh gaps, the
first frame centred by pure CSS padding), the previous frame still leaving above and the next
arriving below; the project's name stays at its original clamp(1.9rem, 3.4vw, 4.2rem) size
on the left over the photograph, on one line, shrinking only to fit. White difference blending
keeps it visible across the paper and photograph. The name changes
by a FOCUS PULL (opacity + blur, never a slide); each photograph pans slowly against the
travel; a stacked index lower left jumps the scroll, snapped to whole projects.
Project numbering and the circular next button are removed. The frames enter with the
shared image reveal (below) and the name block sharpens in from blur. `render(p)` is the single
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
stay 100% × 100dvh object-cover with no transform/filter/dimming on arrival, or the handoff shows.

### About page

`about/page.tsx` + `AboutClient.tsx` (Sept 2026, from the user's two boards) — light, editorial,
on the page grid: a headline with a photograph set INSIDE the line (two sets of line breaks,
sm and up vs phones, never wrapping — a wrap strands the picture), a full-width plate, the
"one team" statement with the extended editorial `AboutProcess` (Build / Draw / Hand over), the second board's
spread (small text columns against a large plate, a staggered row with captions, a pull quote
held in the margin), then a near-full-viewport plate (92svh) with the
page's closing statement laid out INSIDE it — heading left, paragraph right, over a bottom
scrim — and a close that links to Contact. There is deliberately NO team section: the user
asked for it removed (the bios are still in Sanity; `portraitUrl()` with Cloudinary `g_auto`
remains in transforms for whenever portraits are wanted again). NO invented numbers: the old
page claimed 15 years and 8 deliveries; the dataset says 2 buildings.

All eight About photographs use the shared `ImageFootnote` inside their frames.
Keep captions outside image pan nodes so they stay in place while photographs drift.

`AboutProcess.tsx` uses a left Build portrait capped at 75svh height with slower text on
the right, a small faster Draw portrait on the right with text left, and a medium central
Hand over photo with a blended overlapping heading and its paragraph to the right.
`AboutClient` owns the outer parallax through a desktop-only matchMedia context, separate
from inner-image pan and RevealFrame entrances. Smaller screens stack and disable outer
parallax; reduced motion is static. The three replacement images are chosen from TDK assets.

### Contact page

`contact/page.tsx` + `ContactClient.tsx` (Sept 2026) — white and editorial, the hub's
typographic hero ("Contact" + a lead), then the form at six columns with the studio's details
beside it and one `RevealFrame` photograph under them, all on the page grid. Fields are solid
blocks (as in the project page's register section) with smooth focus fill and drawn border
edges shared through `FormControls.module.css`; validation notes are
teal and tied to their field by aria-describedby. The page is a server component that passes
Sanity `siteSettings` in — email, phone, address and socials are NEVER hardcoded (the old page
had them in markup). The Google Maps embed was dropped (a generic Nicosia pin behind a dark
filter); `/api/contact` is unchanged.

The homepage, Contact and project forms share `TDKSelect`: a rectangular branded dropdown
portalled to the viewport to avoid clipping, with keyboard navigation, typeahead, outside
click, reset support and a hidden input for native FormData. Animate border/fill and menu
entrances with CSS; respect reduced motion. Keep the existing delivery and retry behavior.

### Projects hub

`projects/page.tsx` + `ProjectsClient.tsx` — white, editorial, no eyebrows, filters,
tabs or cards. A full-viewport hero centers the first 3:4 project portrait on both
axes; further portraits continue right and clip at the viewport edge. Projects sits
bottom-left and the lead bottom-right with page-grid padding. No hero counts.
Keep the separate designed-and-built and design-only ledgers below. Each entry has
the project plate with a `RevealFrame` entrance, name and particulars. A plain click
opens the project through `ProjectTransition`, as on the homepage.

### Project page

`projects/[slug]/page.tsx` (Sept 2026 redesign) is, in order: `ProjectHero` (full bleed, settled)
→ `ProjectScenes` → `ProjectAvailability` → `ProjectStory` → `ProjectRegister`, white ground,
Josefin light, NO eyebrows and no decorative hairlines (user's request). The page remains
scroll-based with editorial spreads; image clicks open the shared lightbox. `ProjectScenes` is four editorial spreads
fed exactly five images by `sceneImages()` (galleries de-duplicated, hero only as a fallback,
then cycled), stacked on the page grid with `gap-page` between them — the user wants ONE measure
of white around every picture, section heights don't matter: A aperture (content-width 16:9,
render zooms out on scroll), B side note (6-col portrait + quote/features in cols 8–12),
C diptych (8 + 4 cols, same height, renders drift at different rates inside their frames),
D plate (the aperture again — the sequence opens and closes on the same plate; it replaced a
panorama band the user found ugly). Almond adds eight apartment interiors between C and D
in four staggered spreads with the same RevealFrame entrance and inner-image drift.
Project scene photographs carry bottom-left inside-image descriptions in Josefin Sans.
Project heroes have no status eyebrow or exterior footnote. The technical specifications
link still opens its PDF; omit the visible helper line and Pricing available on inquiry note.
Frames never move or scale on scroll —
only the render inside them does, so the grid stays exact. Availability is a rule-less banded table with three counting figures; Story is
the description lead + percentage/bar + specs; Register is the one teal section and posts to
`/api/project-interest`. Inline name/email validation, a busy state and retry preserve entered
details. Successful delivery remains successful even if the analytics event fails.

The homepage and Contact page share `ContactForm` and `/api/contact`. Both API handlers
use `src/lib/contact/delivery.ts`: require the configured Resend key, sender and recipient,
escape submitted HTML, set the visitor as notification reply-to, and return success only
after Resend accepts the studio's email. A rejected or failed acknowledgement does not
undo delivery. CONTACT_FORM_TO_EMAIL and INTEREST_FORM_TO_EMAIL can fall back to one
another if only one studio recipient is configured. Project enquiries are archived as
the existing Sanity `lead` type with status `new`; archive failures are logged without
turning an accepted notification into a failed submission. `npm run test:forms` exercises
the actual handlers with isolated provider/CMS substitutes, without sending test messages.

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
  `imageReveal` (`src/lib/animations/imageReveal.ts`; `<RevealFrame>` in markup): ONE cover of
  the ground colour lifts away upward (scaleY, origin top), so the picture is raised from its
  base, while the render settles from 1.05 anchored on its bottom edge, firing at `top 92%`.
  It replaced the staggered strips (Sept 2026), which the user found too loud. Used by the
  project scenes, ProjectsPinned frames, the projects hub plates, About photos and the Contact
  photo. Do not invent per-section image entrances. Full-bleed images (hero, Interlude,
  footer) are exempt.

CSS custom properties are defined in `src/styles/globals.css`. Tailwind config (`tailwind.config.ts`) maps them to utility classes. Key tokens:

- **Colors**: `void`, `surface`, `paper`, `stone`, `threshold`, `glass`, `border` — all reference CSS vars.
- **Accent**: teal/slate blue `#66979f` (not amber — accent was changed from `#F5A623`).
- **Fonts**: Josefin Sans (`--font-josefin`, `font-sans`) throughout, including figures,
  image footnotes and the loader. Do not load or use monospace fonts.
- Typography scale: `text-display-xl`, `text-display-lg`, `text-display-md`, `text-heading`, `text-body-lg`, `text-body`, `text-label`.
- Tailwind `cn()` helper: `src/lib/utils/cn.ts` (clsx + tailwind-merge).

### i18n

There is no i18n library and no translation layer — the unused `src/lib/i18n/` scaffolding was
deleted. `[locale]` is a routing segment only; `src/middleware.ts` holds the locale list and
redirects everything to `/en`. Copy is written inline in English.

## Hard Rules

1. **No Three.js** — the dependency has been removed. Use GSAP or plain canvas.
2. **No Framer Motion** — GSAP for all animation.
3. **No Cloudinary** — use Sanity images and `src/lib/sanity/image.ts`, with the explicit local-asset exceptions listed above.
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
