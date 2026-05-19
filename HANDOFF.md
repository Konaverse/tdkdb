# TDK Design & Build — Chat Handoff Document

> **Purpose:** Feed this to a new Claude Code session so it picks up exactly where the previous session left off.
> **Last updated:** 2026-03-06 (Ready for new Hero Homepage Implementation)

---

## 1. REQUIRED DOCUMENTS — Feed These First

Before doing anything, read these three documents **in this exact order**:

1. **TDK_MASTER_PLAN.md** — The full PRD for the website
2. **TDK_HOMEPAGE_EXPERIENCE.md** — Full homepage spec (scene by scene)
3. **TDK_CURSOR_BUILD_STRATEGY.md** — Sequential build prompts (current progress tracked here)

All three live in the project root:
`C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\`

---

## 2. WHAT'S DONE — Completed Phases

### Phase 0 — Project Scaffolding ✅
Next.js 14 + TypeScript + Tailwind + pnpm. All deps, routing, env vars, vercel.json.

### Phase 1 — PRD Orientation ✅
Architecture Decision Record at `docs/ADR.md` (11 decisions).

### Phase 2 — Design System & Global Tokens ✅
CSS custom properties, Tailwind config, typography scale, GSAP + Lenis singletons, SmoothScrollProvider.

### Phase 3 — Global Components ✅
Navbar, Footer, Button (primary/ghost/text), animation wrappers (FadeUp, TextReveal, CountUp, StaggerGroup, HorizontalReveal, Divider), Section, GridWrapper.

### Phase 4 — Homepage (Scene by Scene) — IN PROGRESS

| Prompt | Scene | Status |
|---|---|---|
| 4.0 | Feed Homepage Context | ✅ |
| 4.1 | Image Sequence Config & Canvas Engine | ✅ |
| 4.2 | Loading Screen & Assembly Playback (Scene 1) | ✅ |
| 4.3 | Hero State & Manifesto Text (Scene 2) | ✅ |
| 4.4 | Approach Sequence Scroll Scrubbing (Scene 3) | ✅ |
| 4.5 | Threshold Crossing Transition & Canvas Cleanup (Scene 4) | ✅ |
| 4.6 | Philosophy Section (Scene 5) | ✅ |
| 4.7 | Projects Reel (Scene 6) | ✅ |
| 4.8 | Contact CTA & Footer (Scenes 7 & 8) | ✅ |
| 4.9 | Custom Cursor | ✅ |

### Phase 5 — Interior Pages ✅ (all stubs implemented, customisation deferred)

| Prompt | Page | Status |
|---|---|---|
| 5.1 | About | ✅ |
| 5.2 | Services Index | ✅ |
| 5.3 | Service Detail + Accordion | ✅ |
| 5.4 | Projects Index + ProjectCard + FilterTabs | ✅ |
| 5.5 | Project Detail + 12 section components + Lightbox + Interest API | ✅ |
| 5.6 | Insights Index + Detail + ArticleCard + CategoryFilter + PortableText | ✅ |
| 5.7 | Contact Page + Contact API | ✅ |
| 5.8 | 404 Page | ✅ |

---

## 3. WHERE TO START

### 🚀 Next Up: Phase 7 — SEO & Analytics
Hero V2 is built (`HeroSection.tsx`). The homepage renders: `HeroSection → ScenePhilosophy → SceneProjects → SceneContact → Footer`.
Next is **Phase 7.1 (SEO Infrastructure)**: set up `generatePageMetadata()` utility and apply it to all static and dynamic pages.


### Phase 6 — Sanity CMS & Backend Integration ✅

| Prompt | Phase | Status |
|---|---|---|
| 6.1 | Sanity Schemas | ✅ |
| 6.2 | TypeScript Types & GROQ Queries | ✅ |
| 6.3 | Wire Sanity to All Pages | ✅ |
| 6.4 | Sanity Content Entry | ✅ (Almond & Insights pinned for later) |
| Bugfixes | Global Server Layout Nav/Footer | ✅ |

### Phase 7 — SEO & Analytics — IN PROGRESS

**Next Steps:**
We have successfully resolved the production link routing issues caused by client/server layout conflicts!
We are now fully clear to initiate **Phase 7.1 (SEO Infrastructure)**.
This involves setting up the `generatePageMetadata()` utility and applying it to all static and dynamic pages.

---

## 4. HOMEPAGE ARCHITECTURE — Current State

### File Map

| File | Role |
|---|---|
| `src/app/[locale]/(site)/page.tsx` | SSG shell — imports all scene components + Footer |
| `src/components/homepage/HeroSection.tsx` | V2 hero — 400vh pinned, 4-state cinematic (IsoLevelWarp + WireframeMesh + MotionPath) |
| `src/components/homepage/ScenePhilosophy.tsx` | 3D InfiniteGallery depth tunnel ✅ |
| `src/components/homepage/SceneProjects.tsx` | Horizontal projects reel ✅ |
| `src/components/homepage/SceneContact.tsx` | Contact CTA ✅ |

### Hero Architecture (V2 — HeroSection.tsx)

- `src/components/homepage/HeroSection.tsx` — 400vh pinned, client-only (`dynamic({ ssr: false })`)
- 4 states driven by scroll progress: **Iso** → **Wireframe** → **MotionPath** → **Exit**
- Background: `IsoLevelWarp` (isometric wave grid, Three.js R3F, `dynamic({ ssr: false })`)
- Overlay: `WireframeMesh` (`src/components/ui/WireframeMesh.tsx`)
- MotionPathPlugin registered in `gsapInit()` in `src/lib/animations/gsap.ts`
- `@keyframes ray-drift` defined in `src/styles/globals.css`
- Amber (`rgba(212,165,116,…)`) + teal (`rgba(102,151,159,…)`) atmosphere per project card

### ScenePhilosophy Architecture (rebuilt — Phase 4.7)

- Full-screen `h-screen` section — NOT scroll-driven
- Background: `InfiniteGallery` (`src/components/ui/InfiniteGallery.tsx`) — Three.js R3F depth-tunnel, cloth-shader planes, `dynamic({ ssr: false })`
- 5 Cloudinary philosophy images cycle through the 3D tunnel
- Statements cycle every 4600ms with 600ms opacity fade (useState/useEffect, no GSAP)
- Statement 5 "ARMONIA." at `clamp(72px, 12vw, 160px)` weight 300 with location subtitle
- Progress dots bottom-center; threshold teal for active dot
- Dark scrim `bg-black/55` for text legibility

### SceneProjects Architecture (Phase 4.8)

- 150vh container, CSS `sticky top-0 h-screen`, 2-card horizontal carousel
- Strip: `200vw` wide, `will-change: transform`
- GSAP timeline scrub 1.5, `start: 'top top'`, `end: 'bottom bottom'`, `invalidateOnRefresh: true`
- Parallax: images are 130% wide (`left: -15%`); card 1 image x: 0→+15vw; card 2 image x: -15vw→0
- Slot-machine counter top-right flips "01" → "02" at tl position 0.4
- Card info fades/slides in sequence; ghost CTA button per card


### SceneContact Architecture (Phase 4.10)

- `h-screen bg-void overflow-hidden`
- SVG floor-plan background: `opacity-[0.03]`, infinite yoyo upward drift (`y: -20, 20s, repeat: -1`)
- Headline: `["LET'S", "BUILD", "SOMETHING", "TOGETHER."]` — each word in `overflow-hidden` wrapper, clip-path reveal with 0.06s stagger on `top 70%` entry
- `<Button href="/en/contact" variant="primary" size="lg" magnetic>` — enters at delay 0.5
- Secondary info line (email + phone): `text-label tracking-[0.2em] text-stone`, delay 0.8
- `page.tsx` adds `1px var(--color-border)` divider then `<Footer />` below SceneContact

### GSAP Rules (critical)

- Always import `{ gsap, ScrollTrigger }` from `@/lib/animations/gsap` — never from `gsap` directly
- All GSAP inside `useLayoutEffect` with `gsap.context()` → cleanup `ctx.revert()`
- **`%` in ScrollTrigger offsets is relative to the trigger element's height, not the viewport.** Use `px` or `window.innerHeight * N` for viewport-relative offsets.
- CSS sticky preferred over `pin: true` for sections within React trees (avoids spacer node reconciliation error)
- SVG `strokeDashoffset` animation: use inline `style={{ strokeDasharray: N, strokeDashoffset: N }}` and animate directly as CSS property — never use `attr: { strokeDashoffset }` (GSAP attr plugin camelCase conversion is unreliable for this property)
- `gsap.ticker.lagSmoothing(0)` required (set in Lenis init)

---

## 5. KEY DECISIONS & DEVIATIONS

| Topic | Decision |
|---|---|
| **Accent color** | `#66979f` teal/slate blue — NOT amber `#F5A623`. All planning docs updated. |
| **Font variable** | JetBrains Mono → `--font-jetbrains`. Token `--font-mono` references `var(--font-jetbrains)`. |
| **ScrollSmoother** | Not used (paid GSAP Club). Lenis handles smooth scroll instead. |
| **Lenis package** | `@studio-freight/lenis@1.0.42` (old name, still works). |
| **Image sequences** | Assembly: 40 WebP frames. Approach: 52 WebP frames. In `public/sequences/`. |
| **Cloudinary images** | Stored as string public IDs. `cloudinaryUrl()` from `src/lib/cloudinary/transforms.ts`. Always `<img>`, never `next/image`. |
| **Phase 5 data** | All interior pages use hardcoded placeholder data. Sanity wiring is Phase 6. |
| **GSAP pin vs CSS sticky** | Use CSS sticky for homepage scenes to avoid React reconciliation errors with GSAP's spacer insertion. |
| **ScenePhilosophy** | Rebuilt as 3D InfiniteGallery depth tunnel (Three.js R3F) — not the horizontal panel carousel described in the original spec. |

---

## 6. PROJECT LOCATION

```
C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\
```

---

## 7. HARD RULES (Remind the AI)

1. **No Three.js in canvas scenes (Scenes 1–4)** — HTML5 canvas + image sequences only. Three.js permitted for post-canvas HTML scenes (Scene 5+) when explicitly required.
2. **No Framer Motion** — GSAP only for all animation
3. **No Sanity native images** — all images are Cloudinary IDs stored as strings
4. **`SANITY_API_TOKEN` must NEVER have `NEXT_PUBLIC_` prefix** — server-only
5. **Email addresses from env vars** — never hardcoded
6. **One prompt = one component** — commit after each as `feat: Phase X.Y — Description`
7. **`serverClient` is API-routes-only** — never import in component files
