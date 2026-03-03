# TDK Design & Build — Chat Handoff Document

> **Purpose:** Feed this to a new Claude Code session so it picks up exactly where the previous session left off.
> **Last updated:** 2026-03-02 (after completing Phase 4 and Phase 5)

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
| 4.6 | Anatomy Section (Scene 5) | ✅ |
| 4.6.5 | SceneAnatomy — 360° Rotation Canvas | ✅ (known issues below) |
| 4.7 | Philosophy Section (Scene 6) | ✅ |
| 4.8 | Projects Reel (Scene 7) | ✅ |
| 4.9 | Process Section (Scene 8) | ✅ |
| 4.10 | Contact CTA & Footer (Scenes 9 & 10) | ✅ |
| 4.11 | Custom Cursor | ✅ |

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

### ⚠️ Still Pending: SceneAnatomy Node Polish

Two known issues remain from 4.6.5 — deferred, fix whenever convenient:

**Issue 1 — Node positions don't match the 360° frames**
The 6 hotspot node coordinates (`left`/`top` in the `NODES` array) were tuned for a static photo, not the 360° frames. Load in dev, hover the right panel (freezes at frame 0), and re-tune each node's position.
File: `src/components/homepage/SceneAnatomy.tsx` — `NODES` array at top of file.

**Issue 2 — Node-click edge cases when already zoomed**
a) Clicking a different node while zoomed: reset scale to 1 first before starting the new 1.25 tween.
b) Re-entering the panel with an active node: `handlePanelEnter` snaps to frame 0 even when a node is locked — consider skipping the snap if `activeNodeRef.current !== null`.
c) Keyboard/focus click when `nodesVisible` is false: add `tabIndex={nodesVisible ? 0 : -1}` to node buttons.

---

### → Phase 6 — Sanity CMS & Backend Integration

**Next Steps:**
We have finished the Homepage (Phase 4) and all Interior Pages (Phase 5). The next major phase is **Phase 6: Sanity CMS Setup & Wiring**.
This entails creating the Sanity schemas, configuring the studio desk structure, and wiring up the existing static pages (`/projects`, `/services`, `/about`, etc.) to live GROQ queries.

---

## 4. HOMEPAGE ARCHITECTURE — Current State

### File Map

| File | Role |
|---|---|
| `src/app/[locale]/(site)/page.tsx` | SSG shell — imports all scene components + Footer |
| `src/components/homepage/HomepageCanvas.tsx` | Canvas engine + state machine |
| `src/components/homepage/LoadingScreen.tsx` | Full-screen loading overlay (Scene 1) |
| `src/components/homepage/SceneHero.tsx` | Manifesto text overlay (Scene 2) |
| `src/components/homepage/SceneAnatomy.tsx` | Interactive building anatomy (Scene 5) ✅ |
| `src/components/homepage/ScenePhilosophy.tsx` | 3D InfiniteGallery depth tunnel (Scene 6) ✅ |
| `src/components/homepage/SceneProjects.tsx` | Horizontal projects reel (Scene 7) ✅ |
| `src/components/homepage/SceneProcess.tsx` | Process timeline — vertical spine (Scene 8) ✅ |
| `src/components/homepage/SceneContact.tsx` | Contact CTA (Scene 9) ✅ |

### State Machine (`HomepagePhase`)

```
loading → assembly → hero → approach → threshold → complete
```

After `complete`: canvas `display:none`, frame arrays nulled, normal HTML scroll. SceneAnatomy and all subsequent scenes are in normal document flow.

### SceneAnatomy Architecture (for context)

- 200vh wrapper div with `sticky` inner section (CSS sticky, NOT GSAP pin — avoids React reconciliation issue with GSAP spacer nodes)
- 6 interactive hotspot nodes; hover/click → SVG connector line drawn to left panel
- Left panel text transitions via GSAP timeline (y ± 30, opacity)
- "↓ CONTINUE" appears after 8s or after hovering 3+ nodes
- **Right panel replaced with 360° canvas** (was static Cloudinary `<img>`)

#### 360° Canvas details
- Sequence: `armonia360` — 65 WebP frames at 20 fps, `/sequences/armonia-360/frame-0001.webp` … `frame-0065.webp`
- Config entry in `src/lib/homepage/sequenceConfig.ts`
- RAF loop in `startRotation()` (stable `useCallback`, all refs); wraps frame 64 → 0 seamlessly
- **Panel hover model**: mouse enter → stops RAF, snaps canvas to frame 0, sets `nodesVisible = true`; mouse leave (no active node) → resets zoom, hides nodes, restarts RAF
- **`activeNodeRef`** (ref mirror of `activeNode` state) used in `handlePanelLeave` to guard against restarting rotation while a node is locked
- Node click zooms `canvasWrapperRef` to `scale: 1.25` via GSAP, `transformOrigin` set to node's `left top`; same-node click resets to `scale: 1`
- Canvas DPR-aware sizing (`min(DPR, 2)`); resize listener redraws current frame
- ⚠️ Known issues: node positions need re-tuning for 360° frames; click edge cases (see §3 above)

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

### SceneProcess Architecture (Phase 4.9 — rebuilt)

- **200vh** outer section → 100vh of scroll travel (CSS sticky, not GSAP pin)
- Sticky inner panel: `h-screen flex flex-col`, `paddingTop: 64px`, `paddingBottom: 48px`
- Heading + 48px HR rule: `flex-none` in-flow at top; clip-path reveal on section entry
- Two-column grid: `flex-1 min-h-0`, `40% / 60%`
  - Left: SVG vertical spine, `height: 100%`, viewBox `0 0 2 100`
  - Ghost line (`--color-border`) always visible; progress line (`--color-threshold`) animated via **CSS `strokeDashoffset`** (NOT `attr` plugin — camelCase/kebab mismatch bug avoided)
  - Tick marks at y=0,25,50,75,100 revealed as line reaches each position
  - Right: 5 step blocks, `flex flex-col justify-between h-full`, slide in from `translateX(20px)`
- Closing "Every project. Every time.": `mt-auto flex-none` — pinned to panel bottom
- GSAP timeline `scrub: 1.5`, `start: 'top top'`, `end: 'bottom bottom'`
- Mobile (<1024px): stacked layout, `border-left` accent, IntersectionObserver reveals

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
