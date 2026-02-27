# TDK Design & Build — Chat Handoff Document

> **Purpose:** Feed this to a new Claude Code session so it picks up exactly where the previous session left off.
> **Last updated:** 2026-02-28

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
| 4.7 | Philosophy Section (Scene 6) | ⬜ ← **START HERE** |
| 4.8 | Projects Reel (Scene 7) | ⬜ |
| 4.9 | Process Section (Scene 8) | ⬜ |
| 4.10 | Contact CTA & Footer (Scenes 9 & 10) | ⬜ |
| 4.11 | Custom Cursor | ⬜ |

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

## 3. WHERE TO START — Next Prompt: 4.7

### → Prompt 4.7 — Philosophy Section (Scene 6)

**File to build:** `src/components/homepage/ScenePhilosophy.tsx` ← **stub exists, returns null**

The file is already imported in `src/app/[locale]/(site)/page.tsx` — just implement the component.

**Full spec (from TDK_CURSOR_BUILD_STRATEGY.md line 1449):**

This section is **120vh** tall. Each statement occupies ~24vh of scroll.
Statements appear via clip-path reveal and disappear via opacity fade.

**The 5 statements:**
1. "WE DO NOT BUILD FAST."
2. "WE BUILD RIGHT."
3. "EVERY MATERIAL IS A DECISION."
4. "EVERY DETAIL IS AN ARGUMENT."
5. "ARMONIA." (+ "Lakatameia, Nicosia." in text-label below)

*(Exact copy confirmed in TDK_HOMEPAGE_EXPERIENCE.md Section 9.2 — read that section for the precise wording before implementing)*

**Implementation:**
1. Each statement is a full-screen centered div, `position: absolute` within the 120vh container. Stack vertically (statement 1 at top, statement 5 at ~96vh).
2. Per statement:
   - **Enter:** clip-path `inset(0 100% 0 0)` → `inset(0 0% 0 0)` [text reveals L→R], ScrollTrigger scrub
   - **Exit:** `opacity: 1` → `0` as next statement enters
3. Flash images between statements: positioned absolutely, full screen, z below text. `opacity: 0` default. On statement transition: pulse to `0.7` then back to `0` over 500ms. `filter: grayscale(1) contrast(1.1)`. Grain texture overlay (CSS noise filter or low-opacity noise PNG).
4. Background: `--color-void` throughout. Very slow gradient drift CSS animation: `#0D0D0D` → `#0F0B08` and back over 8s.
5. Statement 5 "ARMONIA." is the **largest text on the entire page**: `font-size: clamp(72px, 12vw, 160px)`, weight 300, letter-spacing 0.1em. "Lakatameia, Nicosia." appears below in `text-label`, `--color-stone`.

**Flash images** — use Cloudinary IDs (plain `<img>`, never `next/image`):
- Between statements 1→2: `clients/tdkdb/armonia/exterior/armonia_front_angle_day`
- Between statements 2→3: `clients/tdkdb/armonia/interior/2`
- Between statements 3→4: `clients/tdkdb/armonia/interior/3`
- Between statements 4→5: `clients/tdkdb/armonia/exterior/1`

*(Use `cloudinaryUrl()` from `@/lib/cloudinary/transforms.ts`)*

**Verification:**
- Statements reveal and fade in sync with scroll
- Flash images appear between transitions
- Grain overlay visible but subtle
- "ARMONIA." is dramatic and large

---

## 4. UPCOMING PROMPTS SUMMARY (4.8–4.11)

### 4.8 — Projects Reel (Scene 7)
**File:** `src/components/homepage/SceneProjects.tsx` (stub exists)

150vh section. Horizontal carousel driven by vertical scroll.
- Outer 150vh container; inner sticky 100vh track; flex carousel `will-change: transform`
- ScrollTrigger scrub 1.5: `translateX(0)` → `translateX(-totalWidth + 100vw)`
- **2 hardcoded cards** (no Sanity yet — Phase 6.3 wires it):
  - Armonia: `heroImageId: 'clients/tdkdb/armonia/exterior/armonia_front_angle_day'`, completed, `href: '/en/projects/armonia'`
  - Almond: `heroImageId: 'clients/tdkdb/almond/renders/almond_front_angle_day'`, in-progress, `href: '/en/projects/almond'`
- Card: full-bleed Cloudinary `<img>`, parallax at 0.7× speed (GSAP), status badge, info panel slides up 40px on entry, ghost CTA button
- Project counter top-right: "01 / 02" flips via translateY
- "THE WORK" heading fades out as carousel starts

### 4.9 — Process Section (Scene 8)
**File:** `src/components/homepage/SceneProcess.tsx` (stub exists)

120vh. Horizontal SVG line draws L→R via stroke-dashoffset + ScrollTrigger.
5 tick marks; steps appear as line reaches them (opacity + translateY).
Steps: 01 VISION / 02 DESIGN / 03 ENGINEERING / 04 BUILD / 05 HANDOVER.
Paper texture bg (#111009 + CSS noise). "HOW WE BUILD" label. Final sentence "Every project. Every time." in text-display-md.

### 4.10 — Contact CTA & Footer (Scenes 9 & 10)
**File:** `src/components/homepage/SceneContact.tsx` (stub exists)

Scene 9: Full-screen, centered. Headline "LET'S BUILD SOMETHING TOGETHER." — word-by-word stagger clip-path reveal (60ms/word). Magnetic PrimaryButton → `/contact`. Secondary info (email/phone) at 800ms. Faint SVG floor-plan lines (opacity 0.03) drift upward infinitely.

Scene 10: Reuse global `Footer` component inline (homepage layout excludes Footer, so it must be added here). Thin `--color-border` divider between Scene 9 and Footer.

### 4.11 — Custom Cursor
**File:** `src/components/ui/CustomCursor.tsx` (new — add to root `layout.tsx`)

`cursor: none` on `html`. 12px circle, 1px `--color-paper` border. GSAP `quickTo` spring trailing.
States via `data-cursor` attribute:
- `hover` → 40px, fill threshold
- `node` → 60px, crosshair lines, transparent fill
- `view` → 80px, fill threshold 90%, "VIEW" text inside
- `scroll` → 6px, fill paper, no border
Hidden on `pointer: coarse` (mobile).

---

## 5. HOMEPAGE ARCHITECTURE — Current State

### File Map

| File | Role |
|---|---|
| `src/app/[locale]/(site)/page.tsx` | SSG shell — imports all scene components |
| `src/components/homepage/HomepageCanvas.tsx` | Canvas engine + state machine |
| `src/components/homepage/LoadingScreen.tsx` | Full-screen loading overlay (Scene 1) |
| `src/components/homepage/SceneHero.tsx` | Manifesto text overlay (Scene 2) |
| `src/components/homepage/SceneAnatomy.tsx` | Interactive building anatomy (Scene 5) ✅ |
| `src/components/homepage/ScenePhilosophy.tsx` | Philosophy statements (Scene 6) — **stub** |
| `src/components/homepage/SceneProjects.tsx` | Horizontal projects reel (Scene 7) — **stub** |
| `src/components/homepage/SceneProcess.tsx` | Process timeline (Scene 8) — **stub** |
| `src/components/homepage/SceneContact.tsx` | Contact CTA (Scene 9) — **stub** |

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
- Image updated to Cloudinary: `clients/tdkdb/armonia/exterior/armonia_front_angle_day`

### GSAP Rules (critical)

- Always import `{ gsap, ScrollTrigger }` from `@/lib/animations/gsap` — never from `gsap` directly
- All GSAP inside `useLayoutEffect` with `gsap.context()` → cleanup `ctx.revert()`
- **`%` in ScrollTrigger offsets is relative to the trigger element's height, not the viewport.** Use `px` or `window.innerHeight * N` for viewport-relative offsets.
- CSS sticky preferred over `pin: true` for sections within React trees (avoids spacer node reconciliation error)
- `gsap.ticker.lagSmoothing(0)` required (set in Lenis init)

---

## 6. KEY DECISIONS & DEVIATIONS

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

---

## 7. PROJECT LOCATION

```
C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\
```

---

## 8. HARD RULES (Remind the AI)

1. **No Three.js** — canvas uses HTML5 canvas + image sequences only
2. **No Framer Motion** — GSAP only for all animation
3. **No Sanity native images** — all images are Cloudinary IDs stored as strings
4. **`SANITY_API_TOKEN` must NEVER have `NEXT_PUBLIC_` prefix** — server-only
5. **Email addresses from env vars** — never hardcoded
6. **One prompt = one component** — commit after each as `feat: Phase X.Y — Description`
7. **`serverClient` is API-routes-only** — never import in component files
