# Architecture Decision Records — TDK Design & Build

> **Project:** tdkdb.com rebuild  
> **Created:** 2026-02-25  
> **Status:** Living document — updated as decisions evolve

---

## ADR-001: Rendering Strategy Per Page Type

### Context

The site has three distinct rendering profiles:

1. **Static pages** (About, Services index, Contact, Legal) — content changes rarely, no dynamic params.
2. **CMS-driven pages** (Projects, Insights, Service detail) — content lives in Sanity, updated by TDK via Studio. Must reflect changes within minutes, not requiring a full redeploy.
3. **The homepage** — a hybrid: the canvas/sequence engine is entirely client-side, but the Projects Reel (Scene 7) pulls live project data from Sanity.

Next.js App Router supports SSG (static generation at build), ISR (incremental static regeneration), and fully dynamic SSR. The choice per page type directly affects TTFB, cacheability, and content freshness.

### Decision

| Page | Strategy | Revalidation | Rationale |
|---|---|---|---|
| Homepage | SSG + client-side canvas | `revalidate: 60` | The page shell is static HTML. The canvas is client-only (`dynamic import, ssr: false`). The Projects Reel data comes from a server component fetch with ISR so new projects appear within 60 seconds of publishing. |
| Project detail (`/projects/[slug]`) | ISR | `revalidate: 60` | TDK updates unit statuses, progress percentages, and construction photos via Sanity. 60-second ISR means changes go live within a minute without redeploy. On-demand revalidation via webhook as a secondary trigger. |
| Insights article (`/insights/[slug]`) | ISR | `revalidate: 300` | Articles change less frequently than project data. 5-minute revalidation is sufficient. |
| Projects index, Insights index | ISR | `revalidate: 60` / `revalidate: 300` | Mirrors the detail page revalidation so index and detail stay in sync. |
| About, Services index, Contact | SSG | `revalidate: 3600` | Content changes are infrequent. 1-hour ISR catches any CMS edits without requiring a deploy, while keeping the pages effectively static for performance. |
| Service detail (`/services/[slug]`) | ISR | `revalidate: 3600` | Same logic as static pages — service descriptions change rarely. |
| Privacy Policy, Terms | SSG | No revalidation | Truly static. Changes require a deploy, which is fine for legal pages. |
| Studio (`/studio`) | Dynamic (SSR) | None | Sanity Studio is a full client-side SPA. The page component renders the Studio shell; all logic runs in the browser. |
| API routes | Dynamic | N/A | Server-side only. Contact form, interest form, and revalidation webhook execute on every request. |
| 404 | SSG | None | Static error page. |

### Consequences

- All CMS-driven pages benefit from edge caching between revalidations — TTFB is fast globally.
- The 60-second ISR window means TDK sees their Sanity changes reflected on the live site within a minute. If that's too slow for unit status updates, the `/api/revalidate` webhook provides instant on-demand revalidation as a complement.
- The homepage is the only page where client-side rendering plays a significant role (the canvas). All other pages are server-rendered with zero client-side data fetching.

---

## ADR-002: State Management Approach

### Context

The project needs to manage several categories of state:

- **Server state** (Sanity content): project data, articles, site settings
- **UI state**: loading screen progress, assembly completion, active anatomy node, mobile detection
- **Animation state**: current frame index, scroll progress, cursor position
- **Form state**: contact form and interest form field values, validation, submission status

Redux, Zustand, and Jotai are common choices. However, the site is primarily server-rendered with isolated interactive islands. There is no global client-side data that multiple unrelated components need to share across routes.

### Decision

**No global state library.** State is managed through:

1. **Server state:** Fetched in Server Components via `@sanity/client`. Data flows down as props. No client-side caching library (no React Query, no SWR). Every page gets fresh data from the ISR cache — there is no client-side navigation that would benefit from a query cache.

2. **Homepage UI state:** A single `useReducer` in the homepage `page.tsx` manages the loading/playback state machine:
   - `idle` → `loading` → `assembling` → `hero` → `scrolling` → `post-canvas`
   - This reducer is local to the homepage. No other page needs it.

3. **Animation state:** GSAP owns all animation state internally. Frame indices, scroll progress, and tween values live inside GSAP's timeline/ScrollTrigger instances — they are never mirrored into React state. React doesn't need to know the current frame number; the canvas `onUpdate` callback reads it directly from GSAP.

4. **Cursor state:** A single `CursorProvider` context wraps the app, exposing a `setCursorState('default' | 'hover' | 'node' | 'view' | 'scroll')` function. Components set cursor state via `data-cursor` attributes or imperative calls. The cursor component reads this context and animates accordingly.

5. **Form state:** React `useState` per form. No form library — the forms are simple (5–6 fields each) and don't justify a dependency. Server-side validation in API routes is the source of truth.

### Consequences

- Zero external state management dependencies. Bundle stays small.
- The homepage state machine is the most complex piece — `useReducer` keeps transitions explicit and debuggable.
- GSAP operating outside React's render cycle is intentional: GSAP manipulates the DOM directly via `quickSetter` and `set()`, which is faster than triggering React re-renders for 60fps animation state.
- Trade-off: if a future feature requires cross-route shared state (e.g., a persistent audio player), a lightweight store like Zustand would be added at that point. Currently, no such requirement exists.

---

## ADR-003: Image Sequence Integration with Next.js App Router

### Context

The homepage canvas draws pre-rendered WebP frames onto an HTML5 `<canvas>` element, scrubbed by GSAP ScrollTrigger. This requires:

- Access to `window`, `document`, `Image()`, `requestAnimationFrame` — none of which exist during SSR.
- A `<canvas>` element created and managed imperatively.
- Large arrays of `Image` objects held in memory.

Next.js App Router server-renders by default. Any component that accesses browser APIs must be explicitly marked as client-only.

### Decision

`HomepageCanvas` is loaded via `next/dynamic` with `ssr: false`:

```typescript
const HomepageCanvas = dynamic(
  () => import('@/components/homepage/HomepageCanvas'),
  { ssr: false }
)
```

This means:
- During SSR/SSG, the canvas component is not rendered. The HTML sent to the browser contains only the loading screen, hero-still preload, and the static scroll container.
- On the client, `HomepageCanvas` mounts, runs connection/device detection, and either initializes the canvas + preloader or falls back to the mobile video path.
- The scroll container `<div>` (which defines the ~760vh height for ScrollTrigger) is rendered server-side. It's a plain `<div>` with no browser API dependencies.

The homepage `page.tsx` itself is a **Server Component** that fetches project data for the Projects Reel via Sanity. The canvas and all interactive scenes are **Client Components** imported into it.

### Consequences

- First contentful paint is the loading screen ("TDK" + progress line) — this renders from static HTML before any JS executes.
- The `hero-still.webp` preload in `<head>` ensures a meaningful visual even if JS is delayed.
- Code splitting: `HomepageCanvas` and all of `lib/homepage/` are bundled into their own chunk. Interior pages never load this code.
- The Server Component / Client Component boundary is clean: data fetching happens server-side, interactivity happens client-side, and they meet at the props boundary.

---

## ADR-004: GSAP ScrollTrigger Initialization Pattern

### Context

GSAP and ScrollTrigger are browser-only libraries. They access `window.scrollY`, `document.querySelector`, and measure DOM element positions. In Next.js App Router, server-rendering a component that imports GSAP will fail.

Additionally, ScrollTrigger instances must be cleaned up on component unmount to prevent memory leaks and stale scroll listeners — especially important during development with React Strict Mode (which double-mounts components).

### Decision

All GSAP initialization follows this pattern:

1. **Registration** happens once in `lib/animations/gsap.ts`:

```typescript
'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }
```

2. **Scene-level initialization** happens inside `useLayoutEffect` (not `useEffect`) with a GSAP Context for automatic cleanup:

```typescript
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    // All ScrollTrigger instances, tweens, and timelines
    // created inside this callback are scoped to `ctx`
  }, containerRef)

  return () => ctx.revert() // kills all GSAP instances created in this context
}, [])
```

3. **`gsap.context()`** is the cleanup mechanism. Calling `ctx.revert()` on unmount kills every ScrollTrigger, tween, and timeline created within that context. This handles React Strict Mode's double-mount and route transition cleanup automatically.

4. **`useLayoutEffect` over `useEffect`** because ScrollTrigger needs to measure DOM positions before the browser paints. `useEffect` runs after paint, which can cause a visible flash of unstyled/unpositioned content.

5. **All components using GSAP** are Client Components (`'use client'` directive). They import from `@/lib/animations/gsap` — never directly from `gsap` or `gsap/ScrollTrigger`.

### Consequences

- Automatic cleanup prevents memory leaks from orphaned ScrollTrigger instances.
- React Strict Mode compatibility: double-mount creates two contexts, but `revert()` on the first unmount cleanly removes the first set of instances before the second mount creates new ones.
- The single import path (`@/lib/animations/gsap`) ensures plugin registration happens exactly once, regardless of how many components import GSAP.
- Trade-off: `useLayoutEffect` fires synchronously before paint, which could delay first paint if initialization is heavy. For the homepage canvas, this is acceptable because the loading screen is already visible. For interior page animations, the initialization is lightweight (a few ScrollTrigger instances) so the impact is negligible.

---

## ADR-005: Lenis Initialization and Cleanup

### Context

Lenis provides smooth scroll behavior across the entire site. It intercepts native scroll events and applies smooth interpolation. It needs to:

- Initialize once at the app level (not per-page).
- Be synchronized with GSAP ScrollTrigger so both systems agree on scroll position.
- Be destroyed on cleanup.
- Be disabled during the homepage assembly sequence (scroll is locked).

### Decision

Lenis is initialized in a `LenisProvider` component that wraps the entire app in the root layout:

```typescript
// Simplified pattern
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true })

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

Key decisions:
- **`lerp: 0.1`** — smooth but responsive. Lower values (0.05) feel too sluggish for a content-heavy site.
- **GSAP ticker drives Lenis RAF** — this ensures Lenis and GSAP are frame-synced. Without this, ScrollTrigger can read a different scroll position than what Lenis reports.
- **`lagSmoothing(0)`** — disables GSAP's lag compensation, which would conflict with Lenis's own interpolation.
- **Homepage scroll lock:** During assembly, call `lenis.stop()`. After assembly completes, call `lenis.start()`. This is cleaner than `overflow: hidden` because Lenis is already intercepting scroll — fighting it with CSS creates edge cases.
- **Studio route exclusion:** The `/studio` route does not use the site layout, so Lenis never initializes on the Studio page (Sanity Studio manages its own scroll).

### Consequences

- Consistent smooth scroll across every page without per-page initialization.
- ScrollTrigger scrub values (`scrub: 1.5`) behave predictably because Lenis provides the position data.
- On mobile, Lenis's `smoothTouch: false` (default) preserves native touch scroll momentum. Only wheel/trackpad events are smoothed.
- Cleanup: `lenis.destroy()` in the provider's unmount. In practice this only fires during hot module replacement in development — in production, the root layout never unmounts.

---

## ADR-006: Sanity Data Fetching Pattern

### Context

Every content page needs data from Sanity. Next.js App Router supports Server Components that can fetch data directly during rendering — no API layer, no client-side fetching.

The Sanity client has two variants:
- **`client`** (public, CDN-enabled, read-only) — safe for server and client components.
- **`serverClient`** (token-bearing, no CDN) — for mutations and draft previews, server-only.

### Decision

**All Sanity reads happen in Server Components** using the public `client`:

```typescript
// In a Server Component (e.g., page.tsx)
import { client } from '@/lib/sanity/client'

const project = await client.fetch(PROJECT_QUERY, { slug })
```

Specific patterns:
- **Page-level fetching:** Each `page.tsx` is a Server Component that fetches its own data and passes it as props to Client Component children.
- **No client-side fetching for content.** Components that need interactivity (e.g., form submission, cursor state) are Client Components, but they receive their data as props from the server parent — never fetch from Sanity themselves.
- **`serverClient` usage is restricted** to API routes only: the revalidation webhook (validates the secret), and future draft preview functionality. It is never imported in any component file.
- **GROQ queries are co-located** in `lib/sanity/queries.ts` with TypeScript return types defined in `lib/sanity/types.ts`. This centralizes all query logic and makes type mismatches between queries and components a compile-time error.
- **ISR revalidation:** Each page's `fetch` call uses Next.js `revalidate` option (60s for projects, 300s for insights). Additionally, Sanity's webhook hits `/api/revalidate` for on-demand revalidation on publish.

### Consequences

- Zero client-side Sanity SDK in the browser bundle for content pages. The `@sanity/client` code runs server-side only.
- Data is always fresh within the ISR window — no stale cache issues, no loading spinners for content.
- The token never leaves the server. `serverClient` is imported only in `src/app/api/` route files.
- Trade-off: no real-time preview out of the box. If TDK requests live preview (seeing draft changes before publishing), `next-sanity`'s `draftMode()` can be added later. For now, the 60-second ISR is sufficient — TDK publishes in Sanity and sees the result within a minute.

---

## ADR-007: Image Optimization Strategy

### Context

The project has two fundamentally different image systems that must not be conflated:

1. **Image sequences** (assembly + approach frames): ~300 WebP files totaling ~26MB, served from `/public/sequences/` via Vercel's CDN. Drawn to canvas via `drawImage()`.
2. **Photography and renders** (project heroes, galleries, team photos, etc.): served from Cloudinary with automatic format/quality optimization.

Next.js `<Image>` component provides automatic optimization, lazy loading, and responsive srcsets — but it's designed for `<img>` elements, not canvas `drawImage()`.

### Decision

**Image sequences: raw `Image()` constructor, no Next.js optimization.**
- Loaded via `new Image()` → `img.src = '/sequences/assembly/frame-0001.webp'`
- Already optimized at build time: FFmpeg extracts at exact dimensions (1920px) and quality (`-q:v 80`) in WebP format.
- No further optimization needed or possible — these are drawn to canvas, not rendered as `<img>` elements.
- Cached forever via `Cache-Control: public, max-age=31536000, immutable`.

**Photography and renders: `cloudinaryUrl()` utility, not `next/image`.**
- All CMS images are Cloudinary IDs stored in Sanity. The `cloudinaryUrl()` function generates optimized URLs with `f_auto` (automatic WebP/AVIF), `q_auto`, and correct dimensions.
- Rendered as standard `<img>` elements with explicit `width`, `height`, and `loading="lazy"`.
- Cloudinary handles format negotiation, quality optimization, and CDN delivery — duplicating this through Next.js `<Image>` would add unnecessary complexity (double optimization) and doesn't improve the result.

**Exception: `next/image` for local static assets only.**
- The logo SVGs in `/public/images/` and any local static images use `next/image` for automatic optimization and responsive loading.
- `next.config.mjs` includes `remotePatterns` for `res.cloudinary.com` as a safety net if `next/image` is ever used with Cloudinary URLs directly.

### Consequences

- Cloudinary is the single optimization layer for all CMS photography. No conflicting optimization chains.
- Image sequences stay on the fastest possible path: static files → Vercel edge cache → `Image()` constructor → canvas. No middleware, no API routes, no processing.
- CLS prevention: all `<img>` elements have explicit `width` and `height` attributes. Cloudinary URLs include dimensions so the browser can reserve space before the image loads.
- Trade-off: we lose `next/image`'s automatic responsive `srcset` for CMS images. Cloudinary compensates: `cloudinaryUrl()` accepts a `width` parameter, and components can call it at multiple widths for responsive breakpoints if needed.

---

## ADR-008: Font Loading Strategy

### Context

The design system uses two fonts:
- **Josefin Sans** (300, 400, 600) — primary, used everywhere.
- **JetBrains Mono** (400) — secondary, numbers only.

Josefin Sans weight 300 is the most critical — it's used for all display text, the hero manifesto, philosophy statements, and scene headings. If it loads late, there's a flash of fallback font at the largest text sizes on the page.

### Decision

**Josefin Sans: loaded via `next/font/google` in the root layout.**

```typescript
import { Josefin_Sans } from 'next/font/google'

const josefin = Josefin_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  display: 'swap',
  variable: '--font-josefin',
})
```

**JetBrains Mono: loaded via `next/font/google`, deferred.**

```typescript
import { JetBrains_Mono } from 'next/font/google'

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
})
```

Key decisions:
- **`next/font/google`** self-hosts the fonts — no external requests to Google Fonts at runtime. The font files are bundled and served from Vercel's CDN.
- **`display: 'swap'`** shows text immediately in the fallback font, then swaps once the custom font loads. For body text this is fine. For display text, the layout shift is minimal because `next/font` preloads the font file in the initial HTML.
- **CSS variables** (`--font-josefin`, `--font-mono`) are applied to `<html>` and referenced in Tailwind config. This decouples font loading from component code.
- **Latin subset only** — Josefin Sans supports Greek characters in its full set, but we load Latin only for now. When Greek content launches, the subset expands to `['latin', 'greek']`.
- **JetBrains Mono is Priority 3** in the loading waterfall — it's only used for step numbers and counters that appear below the fold. It loads after Josefin Sans without blocking anything.

### Consequences

- Zero external font requests. No CORS issues, no Google Fonts CDN dependency.
- Josefin Sans 300 is available on first paint in most cases (preloaded by `next/font`).
- If fonts take long to load (slow connection), `display: 'swap'` ensures text is readable immediately in the system fallback.
- Adding Greek later is a one-line change (`subsets: ['latin', 'greek']`).
- Total font payload: ~60KB for Josefin Sans (3 weights, latin subset) + ~15KB for JetBrains Mono (1 weight). Well within budget.

---

## ADR-009: Animation Cleanup on Route Transitions

### Context

The site uses GSAP ScrollTrigger extensively. When the user navigates between pages (e.g., homepage → project detail), all ScrollTrigger instances from the previous page must be killed. Orphaned instances cause:

- Memory leaks (event listeners on scroll, resize).
- Ghost animations that fire on scroll positions that no longer correspond to any visible element.
- Measurement errors (ScrollTrigger tries to measure elements that have been unmounted).

Next.js App Router uses client-side navigation by default (no full page reload), so component unmount is the only cleanup opportunity.

### Decision

**Every component that creates GSAP instances wraps them in `gsap.context()`:**

```typescript
useLayoutEffect(() => {
  const ctx = gsap.context(() => {
    ScrollTrigger.create({ ... })
    gsap.to('.element', { ... })
  }, containerRef) // scoped to this component's DOM subtree

  return () => ctx.revert()
}, [])
```

Additional safety measures:

- **`ScrollTrigger.refresh()`** is called after route transitions complete (via Next.js `usePathname` change detection in the layout). This recalculates all active triggers for the new page's DOM.
- **Lenis `scrollTo(0)`** on route change — resets scroll position so new page ScrollTriggers start from the correct position.
- **The homepage canvas has explicit teardown** beyond `ctx.revert()`: frame arrays are nulled, the canvas element's context is cleared, and any pending `requestAnimationFrame` callbacks are cancelled via their stored IDs.

### Consequences

- No orphaned GSAP instances survive route transitions.
- `gsap.context()` + `ctx.revert()` is GSAP's official React cleanup pattern — it handles all edge cases including React Strict Mode double-mount.
- The homepage canvas teardown is the most aggressive because it holds the most memory (~26MB of decoded images). All other pages have lightweight cleanup (a few ScrollTrigger instances, some tweens).
- Trade-off: `useLayoutEffect` fires synchronously, which means cleanup and re-initialization happen before the browser paints the new page. This is correct behavior (prevents visual artifacts) but means complex pages have a brief initialization delay.

---

## ADR-010: Mobile Detection and Homepage Fallback

### Context

The homepage image sequence experience requires:
- Preloading ~26MB of WebP frames.
- A `<canvas>` element drawing frames at 60fps.
- GSAP ScrollTrigger scrubbing through frames on scroll.

On mobile devices:
- The 26MB download is prohibitive on cellular connections.
- Touch scroll momentum (rubber-banding) conflicts with frame scrubbing.
- Canvas rendering is GPU-constrained on older devices.

The Master Plan specifies: mobile gets an autoplay MP4 video instead of canvas.

### Decision

**Detection runs on mount in `HomepageCanvas` (client-side only):**

```typescript
const isMobile =
  window.matchMedia('(pointer: coarse)').matches ||
  window.innerWidth < 1024

const connection = (navigator as any).connection
const isSlowConnection =
  connection?.effectiveType === '2g' ||
  connection?.effectiveType === '3g' ||
  connection?.saveData === true
```

**If `isMobile || isSlowConnection`:**
- Canvas is never initialized.
- No image sequences are preloaded (zero wasted bandwidth).
- An `<video>` element plays `approach-mobile.mp4` (< 8MB, compressed via FFmpeg) with `autoPlay muted playsInline`.
- The video plays once and pauses on the final frame.
- No scroll-jacking — standard scroll behavior throughout.
- All Scenes 5–10 render identically (adapted to single-column layout).
- The loading screen is either skipped or shows a simplified version (no frame-count progress).

**If desktop with good connection:**
- Full canvas experience as specified.

**Edge case — desktop with slow connection:**
The `isSlowConnection` check catches this. A desktop user on 3G tethering gets the video path, not the 26MB sequence path. This is the correct trade-off: a 8MB video looks better than a canvas that takes 30+ seconds to load its frames.

**No SSR detection.** Device detection happens client-side only because:
- `navigator.connection` doesn't exist during SSR.
- `window.matchMedia` doesn't exist during SSR.
- The `HomepageCanvas` component is already `ssr: false` (ADR-003), so this is consistent.
- The server renders the static shell (loading screen + scroll container), and the client decides which path to take.

### Consequences

- Mobile users never download a single sequence frame. Their experience is a compressed 8MB video — fast, smooth, no jank.
- The detection is conservative: `pointer: coarse` catches tablets, `< 1024px` catches small laptops, `saveData` catches users who've explicitly asked for less data.
- Trade-off: users on an iPad Pro (large screen, `pointer: coarse`) get the video path even though the device could handle canvas. This is acceptable — touch scroll scrubbing on iPad is unreliable even on powerful hardware.
- The breakpoint (1024px) aligns with the Tailwind `lg` breakpoint and the Master Plan's "canvas experience threshold."

---

## ADR-011: Canvas Memory Management

### Context

The homepage canvas holds ~300 decoded `Image` objects in two arrays:
- `assemblyFrames[]`: ~120 images, ~10MB decoded.
- `approachFrames[]`: ~180 images, ~16MB decoded.

After Scene 4 (Threshold), the canvas is hidden and Scenes 5–10 are standard HTML. The decoded image data is no longer needed. Holding it wastes ~26MB of RAM for the rest of the user's session — significant on mobile-class hardware (though mobile doesn't use canvas, a 2-in-1 laptop with 4GB RAM would feel this).

### Decision

**After Scene 4 completes, execute a full canvas teardown:**

```typescript
function teardownCanvas() {
  // 1. Null frame arrays to release decoded image memory
  assemblyFrames.length = 0
  approachFrames.length = 0
  assemblyFrames = null
  approachFrames = null

  // 2. Clear canvas context
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 3. Resize canvas to 1x1 to release GPU texture memory
  canvas.width = 1
  canvas.height = 1

  // 4. Hide canvas via CSS (display: none removes it from the render tree)
  canvas.style.display = 'none'

  // 5. Cancel any pending RAF
  if (rafId) cancelAnimationFrame(rafId)

  // 6. Kill the canvas-related GSAP context
  canvasGsapCtx.revert()
}
```

This is triggered by the Scene 4 ScrollTrigger's `onLeave` callback.

Key decisions:
- **Setting `canvas.width = 1`** is critical. Simply hiding the canvas with CSS doesn't free the GPU-allocated texture buffer. Resizing to 1x1 forces the browser to release the previous texture (which at 1920×1080 RGBA is ~8MB of GPU memory).
- **Nulling array references** allows the garbage collector to reclaim the decoded image data. Setting `.length = 0` first clears the array contents (removing references to individual Image objects), then nulling the variable removes the array itself.
- **GSAP context revert** kills the assembly RAF tween, approach ScrollTrigger, vignette tween, entrance light tween, and threshold bloom tween — all in one call.
- **The teardown is irreversible.** If the user scrolls back up past Scene 5, they see an empty space where the canvas was (or a static `hero-still.webp` background). This is acceptable because backward scroll through Scenes 1–4 is not a designed user path — the narrative is forward-only. The Anatomy section (Scene 5) has its own unpin logic that doesn't invite backward scrolling into the canvas zone.

### Consequences

- ~26MB of RAM returned to the browser after Scene 4. Scenes 5–10 run in a lean memory environment.
- ~8MB of GPU texture memory freed by the canvas resize.
- Lighthouse memory audits will show the expected pattern: spike during Scenes 1–4, clean drop after Scene 4, stable for Scenes 5–10.
- Trade-off: the teardown makes Scenes 1–4 non-replayable without a page reload. If analytics later show users frequently scroll back to the top, we could retain `hero-still.webp` as a static background behind the canvas position and add a "replay" interaction. For now, the memory savings justify the one-way design.
