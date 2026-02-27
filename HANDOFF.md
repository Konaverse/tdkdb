# TDK Design & Build — Chat Handoff Document

> **Purpose:** Feed this to a new Cursor chat/agent so it picks up exactly where the previous session left off.
> **Last updated:** 2026-02-27

---

## 1. REQUIRED DOCUMENTS — Feed These First

Before doing anything, feed the AI these three documents **in this exact order**:

1. **TDK_MASTER_PLAN.md** — The full PRD for the website
2. **TDK_HOMEPAGE_EXPERIENCE.md** — Full homepage spec (scene by scene)
3. **TDK_CURSOR_BUILD_STRATEGY.md** — Sequential prompts for the entire build

All three live both in:
- OneDrive: `C:\Users\konst\OneDrive\Υπολογιστής\Business\MyClients\TDK\NewWebsite\Planning\`
- Project root: `C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\`

Use the project root copies — they have the latest updates (e.g., amber → teal color normalization).

---

## 2. WHAT'S DONE — Completed Phases

### Phase 0 — Project Scaffolding ✅
- Prompts 0.1 through 0.5 complete
- Next.js 14 + TypeScript + Tailwind + pnpm
- All dependencies installed (GSAP, Lenis, Sanity v3, next-sanity v9, Cloudinary, Resend, etc.)
- Full folder structure with i18n routing (`[locale]/(site)/`)
- Environment variables (`.env.local`, `.env.example`)
- `vercel.json` with security headers + CSP + cache headers
- `next.config.mjs` with matching headers, Cloudinary remote patterns, www redirect
- `scripts/check-env.ts` for variable validation

### Phase 1 — PRD Orientation ✅
- Prompts 1.1 through 1.3 complete
- All three planning docs internalized
- Architecture Decision Record at `docs/ADR.md` (11 decisions)

### Phase 2 — Design System & Global Tokens ✅
- Prompts 2.1 through 2.4 complete
- **2.1:** CSS custom properties in `src/styles/globals.css` + full Tailwind config
- **2.2:** `cloudinaryUrl()` utility + 6 presets in `src/lib/cloudinary/transforms.ts`
- **2.3:** Modern CSS reset, typography scale classes (`@layer components`), scrollbar styling, selection color
- **2.4:** GSAP singleton with ScrollTrigger in `src/lib/animations/gsap.ts`, Lenis singleton in `src/lib/animations/lenis.ts`, `SmoothScrollProvider` client wrapper in root layout

### Phase 3 — Global Components ✅
- Prompts 3.1 through 3.5 complete (Navbar, Footer, Button, animation wrappers, grid utilities)

### Phase 4 — Homepage (Scene by Scene) — IN PROGRESS

| Prompt | Scene | Status |
|---|---|---|
| 4.0 | Feed Homepage Context | ✅ |
| 4.1 | Image Sequence Config & Canvas Engine | ✅ |
| 4.2 | Loading Screen & Assembly Playback (Scene 1) | ✅ |
| 4.3 | Hero State & Manifesto Text (Scene 2) | ✅ |
| 4.4 | Approach Sequence Scroll Scrubbing (Scene 3) | ✅ |
| 4.5 | Threshold Crossing Transition & Canvas Cleanup (Scene 4) | ✅ |
| 4.6 | Anatomy Section (Scene 5) | ⬜ ← **START HERE** |
| 4.7 | Philosophy Section (Scene 6) | ⬜ |
| 4.8 | Projects Reel (Scene 7) | ⬜ |
| 4.9 | Process Section (Scene 8) | ⬜ |
| 4.10 | Contact CTA & Footer (Scenes 9 & 10) | ⬜ |
| 4.11 | Custom Cursor | ⬜ |

---

## 3. WHERE TO START — Next Prompt

### → Prompt 4.6 — Anatomy Section (Scene 5)

Find the full prompt at line **1383** in `TDK_CURSOR_BUILD_STRATEGY.md`.

**Summary of what 4.6 builds:**
- `src/components/homepage/SceneAnatomy.tsx` — pinned section (100vh pin), appears after canvas teardown
- Two-column layout: left = text panel, right = Armonia building render with 6 interactive nodes
- Nodes pulse (ring animation), turn teal on hover, trigger SVG connector line to left panel
- Left panel text transitions between nodes (slide up/down, 300ms)
- After 3 nodes hovered or 8s elapsed: "↓ CONTINUE" appears at bottom
- No canvas, no ScrollTrigger scrubbing — this is normal HTML scroll after Scene 4

**Pre-requirement:** Phase 4.5 is complete — canvas has been torn down, `phase === 'complete'`. SceneAnatomy renders in normal page flow below the `#scroll-container` div.

---

## 4. HOMEPAGE ARCHITECTURE — Current State

### File Map

| File | Role |
|---|---|
| `src/app/[locale]/(site)/page.tsx` | SSG shell, dynamic import of HomepageCanvas |
| `src/components/homepage/HomepageCanvas.tsx` | Canvas engine, state machine, all ScrollTriggers |
| `src/components/homepage/LoadingScreen.tsx` | Full-screen loading overlay (Scene 1) |
| `src/components/homepage/SceneHero.tsx` | Manifesto text overlay (Scene 2) |

### State Machine (`HomepagePhase`)

```
loading → assembly → hero → approach → threshold → complete
```

- `loading` — LoadingScreen visible, frames preloading
- `assembly` — RAF playback of ~40 assembly frames, scroll locked
- `hero` — Static canvas, SceneHero manifesto visible, scroll unlocked
- `approach` — Scroll scrubbing through ~52 approach frames (0–150vh scroll)
- `threshold` — 20vh bloom zone: teal radial flash expands then recedes
- `complete` — Canvas faded + `display:none`, frame arrays nulled, normal HTML scroll

### Z-Index Stack

| z | Element |
|---|---|
| `z-0` | `<canvas>` — image sequence frames |
| `z-[1]` | Dark veil — `bg-black/45` |
| `z-[5]` | Vignette — edges darken during approach |
| `z-[6]` | Entrance glow — teal radial in final 40% of approach |
| `z-[20]` | Bloom — full-screen teal flash at threshold crossing |
| `z-10` | `<SceneHero>` — manifesto text (hidden by scrollProgress=1 before bloom) |

### GSAP / ScrollTrigger Notes

- All ScrollTriggers created inside `useEffect([hasAssembled])` — fires once when phase leaves `assembly`
- `mainST`: scrubs approach frames over `top top → +=150%` (150vh)
- `thresholdST`: starts at `top+=${window.innerHeight * 1.5}px top`, ends `+=${window.innerHeight * 0.2}` — uses `px` not `%` to avoid GSAP's ambiguity (trigger-position `%` = trigger element height, not viewport)
- Cleanup: all STs killed in `return () => {...}` of the effect

---

## 5. KEY DECISIONS & DEVIATIONS TO KNOW

| Topic | Decision |
|---|---|
| **Accent color** | Changed from amber `#F5A623` to teal/slate blue `#66979f`. All three planning docs updated. |
| **Font variable naming** | Next.js font variable for JetBrains Mono is `--font-jetbrains` (not `--font-mono`) to avoid circular CSS reference. Design token `--font-mono` references `var(--font-jetbrains)`. |
| **ScrollSmoother** | Not used — it's a paid GSAP Club plugin. Lenis handles smooth scrolling instead. |
| **Lenis package** | Using `@studio-freight/lenis@1.0.42` (old package name, still works). |
| **Sanity versions** | `sanity@3`, `next-sanity@9`, `@sanity/client@7` — compatible with Next.js 14 / React 18. |
| **Image sequences** | Assembly: 40 WebP frames (2.4 MB). Approach: 52 WebP frames (2.32 MB). Hero still + mobile MP4 generated. All in `public/sequences/` and `public/videos/`. |
| **i18n routing** | English at `/en/` (not root `/`). Middleware redirects `/` → `/en/`. Greek `/el/` scaffolded but disabled. |
| **GSAP `%` in ScrollTrigger** | `%` in trigger-position offsets (e.g. `top+=X%`) is relative to the **trigger element's height**, not the viewport. Always use `px` or `vh` values when setting an offset that must match a viewport-height distance. |
| **Cloudinary images** | Stored as string public IDs in Sanity. Use `cloudinaryUrl()` from `src/lib/cloudinary/transforms.ts`. Render as `<img>`, never `next/image`. |

---

## 6. PROJECT LOCATION

```
C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\
```

---

## 7. HARD RULES (Remind the AI)

1. **No Three.js** — homepage uses HTML5 canvas + image sequences
2. **No Framer Motion** — GSAP only, always
3. **No Sanity native images** — all images are Cloudinary IDs stored as strings
4. **`SANITY_API_TOKEN` must NEVER have `NEXT_PUBLIC_` prefix**
5. **Email addresses from env vars** — never hardcoded
6. **One prompt = one component**
7. **Commit after every prompt** — `feat: Phase X.Y — description`
