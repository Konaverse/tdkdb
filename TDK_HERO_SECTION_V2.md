# TDK DESIGN & BUILD – HERO SECTION V2
### Creative & Technical Brief

> **Purpose:** This document replaces the Assembly + Approach sequences (Scenes 1–4)
> from `TDK_HOMEPAGE_EXPERIENCE.md`. Everything from Scene 5 onwards remains unchanged.
> The new hero section introduces projects through a scroll-driven orbital choreography
> with cinematic atmosphere shifts.
>
> **Replaces:** Scenes 1–4 of the original homepage experience
> **Preserves:** Scenes 5–10 (Anatomy, Philosophy, Projects Reel, Process, Contact, Footer)
> **Design tokens:** All tokens from `TDK_HOMEPAGE_EXPERIENCE.md` Sections 16–18 still apply

---

## TABLE OF CONTENTS

1. [Concept Overview](#1-concept-overview)
2. [Persistent Background Layer — Interactive Particles](#2-persistent-background-layer--interactive-particles)
3. [State 1 — The Brand Canvas](#3-state-1--the-brand-canvas)
4. [State 2 — Armonia Enters](#4-state-2--armonia-enters)
5. [State 3 — The Swap (Almond Enters)](#5-state-3--the-swap-almond-enters)
6. [State 4 — Release](#6-state-4--release)
7. [Building Renders — Asset Strategy](#7-building-renders--asset-strategy)
8. [Arc Motion — Technical Specification](#8-arc-motion--technical-specification)
9. [Atmosphere System — Color & Effects](#9-atmosphere-system--color--effects)
10. [Project Info Overlay — Layout & Animation](#10-project-info-overlay--layout--animation)
11. [Scroll Mechanics — Pin & Progress](#11-scroll-mechanics--pin--progress)
12. [Mobile Strategy](#12-mobile-strategy)
13. [Performance Considerations](#13-performance-considerations)
14. [What Changed From V1](#14-what-changed-from-v1)

---

## 1. CONCEPT OVERVIEW

The hero section is a **scroll-pinned, multi-state cinematic introduction** to TDK and its projects. The user does not scroll down a page — they scroll through a theatrical sequence where projects literally enter and exit the stage.

### The Narrative Arc

```
STATE 1              STATE 2              STATE 3              STATE 4
[Brand Canvas]  →    [Armonia Enters]  →  [The Swap]      →   [Release]
                     
Dark background      Building arcs in     Armonia arcs out     Pin releases
Wireframe mesh       from bottom-right    to bottom-left       Normal scroll
"DESIGNED TO LAST"   Locks center         Almond arcs in       resumes into
Poetic quote         Warm amber shift     from bottom-right    Scene 5+
Interactive          Full cinematic       Cool teal shift
particles            atmosphere           Cinematic handoff
```

### Core Principles

1. **The particles are the constant.** The interactive particle field is always present — it is the living texture that connects all states.
2. **The buildings are the performers.** They enter and exit on curved arc paths, like actors taking the stage.
3. **The atmosphere is the emotion.** Each project brings its own color identity — warm amber for Armonia, cool teal for Almond.
4. **The scroll is the director.** Every transition is driven by scroll progress, not time. The user controls the pacing.

---

## 2. PERSISTENT BACKGROUND LAYER — INTERACTIVE PARTICLES

### Source

Interactive particle component sourced from **21st.dev**. This is a React/Three.js particle field that responds to cursor movement.

### Behavior

- **Always visible** across all four states — never hidden, never destroyed
- **Cursor-interactive:** Particles react to mouse position (push/pull, ripple, or attract — depending on the specific 21st.dev component chosen)
- **Color-reactive:** Particle color shifts to match the current state's atmosphere
- **z-index: 0** — sits behind all other content

### Color States

| State | Particle Color | Transition |
|-------|---------------|------------|
| State 1 (Brand Canvas) | Neutral white/light grey (`#F5F0E8` at ~20% opacity) | Default |
| State 2 (Armonia) | Warm amber tint (`#D4A574` at ~30% opacity) | Crossfade over 800ms tied to scroll |
| State 3 (Almond) | Cool teal tint (`#66979f` at ~30% opacity) | Crossfade over 800ms tied to scroll |
| State 4 (Release) | Fade to neutral, then fade out entirely | 600ms as pin releases |

### Implementation Notes

- The particle component should accept a `color` prop (or uniforms if shader-based) that can be animated externally via GSAP
- If the 21st.dev component uses Three.js uniforms, GSAP can tween uniform values directly
- If it uses React state for color, wrap color updates in a ref to avoid re-renders
- Particle density should be moderate — enough to feel alive, not enough to distract from the buildings or text
- On `prefers-reduced-motion`: particles render as a static field (no animation, no cursor reactivity)

---

## 3. STATE 1 — THE BRAND CANVAS

### What the User Sees

A full-viewport dark canvas. No projects. Pure TDK branding.

Three visual layers:

1. **Background:** Interactive particle field (Section 2) — neutral white
2. **Center:** A slow-rotating abstract geometric wireframe mesh (Three.js)
3. **Typography:** Two text elements anchored to opposite corners

### The Wireframe Mesh

A Three.js geometric wireframe rendered on a canvas or via `@react-three/fiber`.

**Visual characteristics:**
- Abstract architectural geometry — not a literal building, more of an angular polyhedron or interconnected planes that suggest structure
- Wireframe rendering only — no solid faces, just edges
- Color: `--color-paper` (`#F5F0E8`) at ~40% opacity
- Slow continuous rotation: Y-axis at ~0.002 radians/frame, X-axis at ~0.001 radians/frame
- Scale: occupies roughly 40–60% of viewport width
- Centered in the viewport

**Behavior on scroll (entering State 2):**
- The wireframe fades out cleanly: `opacity: 0.4 → 0` over the first 15% of State 2's scroll progress
- No morphing, no dissolving into particles — a clean, graceful fade
- Once opacity reaches 0, the Three.js renderer for the wireframe can be disposed to free GPU resources

### Typography — Bottom Left

**Text:** `DESIGNED TO LAST`

**Style:**
- Font: Josefin Sans
- Size: `text-display-xl` → `clamp(64px, 8vw, 120px)`
- Weight: 300 (Light)
- Letter-spacing: `0.05em`
- Color: `--color-paper` (`#F5F0E8`)
- Line-height: 1.0

**Position:**
- `position: absolute`
- `bottom: clamp(48px, 6vh, 80px)`
- `left: clamp(32px, 4vw, 64px)`

**Entrance animation (on page load):**
- Clip-path reveal: `inset(0 100% 0 0)` → `inset(0 0% 0 0)`
- Duration: `--duration-slow` (800ms)
- Easing: `--ease-smooth` (`power4.out`)
- Delay: 300ms after page is interactive

**Exit animation (as State 2 begins):**
- `opacity: 1 → 0` + `translateY: 0 → -30px`
- Duration: 500ms
- Tied to scroll progress: completes within the first 20% of the pin

### Typography — Top Right

**Text:** A poetic complement to "DESIGNED TO LAST"

Candidate lines (final copy TBD — pick one):
- "Where concrete meets conviction"
- "Every detail, a promise to the future"
- "Precision is our poetry"
- "Built with intention, standing with purpose"

**Style:**
- Font: Josefin Sans
- Size: `text-body-lg` (18px)
- Weight: 300 (Light)
- Color: `--color-stone` (`#8C8C8C`)
- Max-width: 280px
- Line-height: 1.7

**Position:**
- `position: absolute`
- `top: clamp(100px, 12vh, 140px)` (below navbar clearance)
- `right: clamp(32px, 4vw, 64px)`

**Entrance animation:**
- Fade in: `opacity: 0 → 1`
- Duration: 600ms
- Easing: `--ease-entrance`
- Delay: 500ms after headline starts revealing

**Exit animation:** Same as headline — fades out in the first 20% of pin scroll

---

## 4. STATE 2 — ARMONIA ENTERS

### Trigger

The user begins scrolling. The section pins (scroll-jacking). Scroll progress now drives the arc animation.

### The Arc Motion

The Armonia building render enters from the **bottom-right corner** of the viewport and follows a **curved arc path** to land at the **center of the viewport**.

**Entry point:** Off-screen, bottom-right (`x: 120vw, y: 120vh` approximately)
**Landing point:** Viewport center (`x: 50vw, y: 50vh`, adjusted for vertical centering of the image)
**Path shape:** A quarter-circle arc — the building sweeps upward and leftward in a smooth curve

See [Section 8 — Arc Motion Technical Specification](#8-arc-motion--technical-specification) for the exact path math.

### "Lock In" — The Atmosphere Shift

When the building reaches center (100% of State 2 scroll progress), the atmosphere transforms:

**What changes simultaneously:**
1. **Particles:** Shift from neutral white to warm amber (`#D4A574`)
2. **Background:** Subtle radial gradient appears behind the building — warm amber glow, very soft, `opacity: 0.15`
3. **Light rays:** 2–3 soft, angled light ray overlays (CSS or canvas) emanate from behind the building, amber-tinted, `opacity: 0.08`, slowly drifting
4. **Project info:** Name, status, and CTA fade in (see Section 10)
5. **Vignette:** A soft vignette darkens the edges slightly, focusing attention center

**Timing:** All atmosphere changes are tied to scroll progress in the final 30% of the arc motion. They don't snap on — they bloom gradually as the building approaches center.

### Scroll Progress Breakdown (State 2)

| Progress | What Happens |
|----------|-------------|
| 0–15% | Wireframe fades out, State 1 typography exits |
| 15–80% | Armonia render travels along the arc path from bottom-right to center |
| 70–100% | Atmosphere shift begins (particles warm, glow appears, light rays fade in) |
| 90–100% | Project info overlay fades in with staggered timing |
| 100% | Armonia is locked center, full warm amber atmosphere, info visible |

### Hold

After reaching 100%, there is a brief "hold" zone — approximately 10–15% additional scroll distance where nothing moves. This gives the user a moment to absorb Armonia before the swap begins. The section remains pinned.

---

## 5. STATE 3 — THE SWAP (ALMOND ENTERS)

### The Mirror-Path Choreography

This is the signature moment of the hero section. Two buildings move simultaneously:

- **Armonia exits** → arcs out toward the **bottom-left** corner (mirror of its entry path)
- **Almond enters** → arcs in from the **bottom-right** corner (same entry path Armonia used)

The movements are synchronized — as Armonia moves 30% of its exit arc, Almond has moved 30% of its entry arc. They pass each other in a choreographed orbital handoff.

### Atmosphere Crossfade

As the swap progresses, the atmosphere transitions from Armonia's warm amber to Almond's cool teal:

| Swap Progress | Atmosphere |
|--------------|------------|
| 0–30% | Armonia amber begins fading |
| 30–50% | Neutral zone — particles briefly return to white, glow fades |
| 50–70% | Teal begins emerging |
| 70–100% | Full Almond teal atmosphere, cool glow, light rays shift to teal |

### Scroll Progress Breakdown (State 3)

| Progress | What Happens |
|----------|-------------|
| 0–10% | Armonia's project info fades out |
| 10–85% | The swap — both buildings in motion simultaneously |
| 50% | Crossover point — buildings at symmetric positions |
| 75–100% | Almond's atmosphere shift (particles cool, teal glow, light rays) |
| 90–100% | Almond's project info overlay fades in |
| 100% | Almond locked center, full teal atmosphere, info visible |

### Hold

Same as State 2 — a 10–15% scroll hold zone after Almond locks in, before the pin releases.

---

## 6. STATE 4 — RELEASE

### Pin Release

After the Almond hold zone completes, the scroll pin releases. The section transitions to normal scroll behavior.

### Exit Sequence

Over the first 100px of normal scrolling after pin release:

1. Almond's project info fades out
2. The Almond render scales down slightly (`scale: 1 → 0.95`) and fades (`opacity: 1 → 0`)
3. Particles fade out (`opacity → 0`)
4. Background transitions to `--color-void` for Scene 5

The release should feel like a curtain lifting — the theatrical hero section ends and the rest of the homepage begins.

---

## 7. BUILDING RENDERS — ASSET STRATEGY

### Format: Static PNG Renders

The building images are **high-quality static renders** (PNG with transparency), not 3D models.

**Why PNGs over Three.js 3D models:**
- Photorealistic quality — the renders were produced in professional architectural visualization software
- Consistent appearance across all devices and GPUs
- Far simpler to implement and maintain
- GSAP can animate position, scale, rotation, and opacity of a DOM element or canvas image with perfect performance
- Three.js is reserved for the wireframe mesh (State 1) and the particle field — where it genuinely adds value

### Asset Requirements

**Armonia Render:**
- Source: Best exterior render of the Armonia building
- Background: Transparent (PNG) — the building floats on the particle canvas
- Resolution: 1200–1600px on the longest edge (optimized for web, not print)
- Orientation: 3/4 angle or front-facing — whatever shows the building's character best
- Stored in Cloudinary: `clients/tdkdb/armonia/exterior/hero-render`
- Served via `cloudinaryUrl()` with `f_auto, q_auto, w_1400`

**Almond Render:**
- Same specifications as Armonia
- Stored in Cloudinary: `clients/tdkdb/almond/renders/hero-render`
- If only CGI renders exist (project under construction), that's perfect — renders are the primary visual

### Implementation Approach

The renders can be implemented as either:

**Option A — DOM Elements (Recommended):**
- `<img>` elements with `position: absolute` inside the pinned hero container
- GSAP animates `x`, `y`, `scale`, `opacity`, and `rotation` along a MotionPath
- Pros: Simple, accessible, Cloudinary `<img>` with responsive `srcset`
- Cons: Slight overhead of DOM compositing vs canvas

**Option B — Canvas Draws:**
- Preload renders as `Image` objects, draw onto a shared canvas via `drawImage()`
- GSAP animates position coordinates, canvas redraws on each tick
- Pros: Single compositing layer, potentially smoother with the particle canvas
- Cons: Loses native `<img>` benefits (alt text, lazy loading, `srcset`)

**Recommendation:** Start with Option A. The renders are single images being translated — this is exactly what CSS transforms excel at. If compositing conflicts with the Three.js/particle canvas layer arise during development, refactor to Option B.

---

## 8. ARC MOTION — TECHNICAL SPECIFICATION

### The Path

Each building follows a **quadrant arc** (quarter circle) between its off-screen origin and the viewport center.

**Armonia Entry Arc (State 2):**
```
Start:  (viewportWidth + 200, viewportHeight + 200)   — off-screen bottom-right
End:    (viewportWidth / 2, viewportHeight / 2)         — viewport center
Path:   Quarter circle, curving up-and-left
```

**Armonia Exit Arc (State 3):**
```
Start:  (viewportWidth / 2, viewportHeight / 2)         — viewport center
End:    (-200, viewportHeight + 200)                     — off-screen bottom-left
Path:   Quarter circle, curving down-and-left (mirror of entry)
```

**Almond Entry Arc (State 3):**
```
Start:  (viewportWidth + 200, viewportHeight + 200)     — off-screen bottom-right
End:    (viewportWidth / 2, viewportHeight / 2)           — viewport center
Path:   Same as Armonia's entry arc
```

### GSAP MotionPath

GSAP's MotionPath plugin is ideal for this. Define the arc as an SVG path or coordinate array:

```javascript
// Armonia entry arc — conceptual
gsap.to(armoniaEl, {
  motionPath: {
    path: [
      { x: viewportWidth + 200, y: viewportHeight + 200 },  // start
      { x: viewportWidth * 0.8, y: viewportHeight * 0.3 },  // control point
      { x: viewportWidth / 2, y: viewportHeight / 2 }       // end (center)
    ],
    curviness: 1.5,
    autoRotate: false
  },
  scale: 0.6,               // starts smaller
  scaleEnd: 1,              // grows to full size at center
  ease: 'power2.inOut',     // smooth acceleration/deceleration
  scrollTrigger: {
    trigger: heroSection,
    start: 'top top',
    end: '+=200%',
    scrub: 1.5,
    pin: true
  }
})
```

### Scale During Motion

The building should subtly scale as it travels:

| Position | Scale | Reason |
|----------|-------|--------|
| Off-screen start | 0.6 | Feels like it's arriving from a distance |
| Mid-arc | 0.8 | Growing as it approaches |
| Center (locked) | 1.0 | Full presence |
| Exit start | 1.0 | Begins at full size |
| Off-screen exit | 0.6 | Shrinks as it departs |

### Rotation During Motion

A very subtle rotation adds dynamism:
- Entry: `rotate: 5deg → 0deg` (slight tilt that straightens as it lands)
- Exit: `rotate: 0deg → -5deg` (tilts the opposite way as it departs)

### Easing

The arc motion uses `--ease-cinematic` (`power1.inOut`) through GSAP's scrub — the scrub value of `1.5` already adds cinematic lag, so the easing should be gentle to avoid overcooking the smoothness.

---

## 9. ATMOSPHERE SYSTEM — COLOR & EFFECTS

### Armonia Atmosphere (Warm Amber)

| Element | Value | Notes |
|---------|-------|-------|
| Particle tint | `#D4A574` at 30% opacity | Warm gold, not orange |
| Radial glow | `radial-gradient(circle at center, rgba(212,165,116,0.15) 0%, transparent 70%)` | Behind the building |
| Light rays | 2–3 angled divs, `#D4A574` at 8% opacity, slight blur | Slowly drift: translateY -20px over 15s, infinite |
| Vignette | `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)` | Focuses attention |
| Background base | Stays `--color-void` (`#0D0D0D`) | The dark base never changes |

### Almond Atmosphere (Cool Teal)

| Element | Value | Notes |
|---------|-------|-------|
| Particle tint | `#66979f` at 30% opacity | The brand threshold color |
| Radial glow | `radial-gradient(circle at center, rgba(102,151,159,0.15) 0%, transparent 70%)` | Behind the building |
| Light rays | 2–3 angled divs, `#66979f` at 8% opacity, slight blur | Same drift behavior |
| Vignette | Same as Armonia | Consistent framing |
| Background base | Stays `--color-void` | Unchanged |

### Crossfade Mechanics

The atmosphere crossfade during the swap (State 3) should not be a binary switch. It should feel like one mood dissolving into another:

1. Armonia's glow, light rays, and particle tint begin fading out at swap progress 0–40%
2. There is a brief neutral moment at ~40–60% where the scene returns close to its State 1 darkness
3. Almond's teal atmosphere begins emerging at 50–100%
4. The overlap zone (40–60%) is intentionally muted — it creates a breath between the two moods

All atmosphere elements are driven by scroll progress through GSAP ScrollTrigger, not CSS transitions or time-based animations.

---

## 10. PROJECT INFO OVERLAY — LAYOUT & ANIMATION

### Layout

When a project locks into center, its information appears overlaid on the hero:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              [Building Render, center]               │
│                                                     │
│                                                     │
│                                                     │
│  PROJECT NAME                          STATUS BADGE │
│  Location · Year · Type            [ CTA BUTTON → ] │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Project Name:**
- Font: Josefin Sans
- Size: `text-display-md` → `clamp(36px, 4vw, 64px)`
- Weight: 300
- Color: `--color-paper`
- Position: bottom-left area, with generous padding from edges

**Location · Year · Type:**
- Font: Josefin Sans
- Size: `text-label` (11px, uppercase, tracked 0.2em)
- Color: `--color-stone`
- Appears directly below the project name

**Status Badge:**
- Armonia: "COMPLETED" — `text-label`, `--color-stone` text, `--color-surface` background
- Almond: "IN DEVELOPMENT" — `text-label`, `--color-threshold` text, darker background
- Position: bottom-right area, aligned with project name baseline
- Zero border-radius (consistent with design system)

**CTA Button:**
- Armonia: "VIEW PROJECT →"
- Almond: "REGISTER INTEREST →"
- Style: Outlined button, `--color-paper` border, magnetic hover behavior
- On hover: fills `--color-threshold`, magnetic pull (80px radius, 12px max displacement)
- Position: below or beside the status badge

### Animation Timing

Info elements enter with staggered timing, all tied to scroll progress:

| Element | Delay from lock-in | Animation |
|---------|-------------------|-----------|
| Project name | 0ms | `opacity: 0 → 1`, `translateY: 20px → 0`, 500ms, `--ease-entrance` |
| Location line | 80ms | Same animation |
| Status badge | 160ms | Same animation |
| CTA button | 240ms | `opacity: 0 → 1`, `scale: 0.95 → 1`, 400ms, `--ease-spring` |

Exit: All elements fade out together (`opacity: 1 → 0`, 300ms) as the swap begins or pin releases.

### CMS Integration

The project info is pulled from Sanity, just like the Projects Reel (Scene 7). The hero section reads the same project documents — ensuring consistency and zero hardcoding.

```typescript
// Conceptual query
const heroProjects = await sanity.fetch(`
  *[_type == "project" && heroFeatured == true] | order(heroOrder asc) {
    name,
    slug,
    location,
    year,
    type,
    status,
    ctaType,
    "heroRender": heroRenderId  // Cloudinary public ID
  }
`)
```

**Scalability:** If TDK adds a third project in the future, the hero section can accommodate it by adding another swap state. The arc choreography is repeatable — each new project arcs in while the previous arcs out. This requires a code update (adding another scroll phase), but the content comes from the CMS.

---

## 11. SCROLL MECHANICS — PIN & PROGRESS

### Pin Configuration

The entire hero section is a single GSAP ScrollTrigger pin.

```javascript
ScrollTrigger.create({
  trigger: '.hero-section',
  start: 'top top',
  end: '+=500%',          // Total scroll distance for all states
  pin: true,
  anticipatePin: 1,
  scrub: 1.5,             // Cinematic lag
})
```

### Scroll Budget

| Segment | Scroll Distance | Cumulative |
|---------|----------------|------------|
| State 1 → State 2 transition (wireframe fade, text exit) | 50vh | 0–50vh |
| State 2 — Armonia arc motion | 120vh | 50–170vh |
| State 2 — Armonia hold (absorb moment) | 30vh | 170–200vh |
| State 3 — The Swap (both buildings in motion) | 130vh | 200–330vh |
| State 3 — Almond hold | 30vh | 330–360vh |
| State 4 — Release transition | 40vh | 360–400vh |
| **Total pinned scroll distance** | **~400vh** | |

> **Note:** These are starting values. The exact distances should be tuned during development
> to feel right. The hold zones are especially important — too short and the user misses
> the project info; too long and the scroll feels stuck.

### Progress Mapping

GSAP's ScrollTrigger provides a `progress` value (0–1) across the total pinned distance. Map this to states:

```javascript
// Conceptual progress mapping
const stateRanges = {
  transition1:  { start: 0.000, end: 0.125 },  // State 1 → 2 fade
  armoniaArc:   { start: 0.125, end: 0.425 },  // Armonia enters
  armoniaHold:  { start: 0.425, end: 0.500 },  // Armonia absorb
  swap:         { start: 0.500, end: 0.825 },  // The Swap
  almondHold:   { start: 0.825, end: 0.900 },  // Almond absorb
  release:      { start: 0.900, end: 1.000 },  // Release
}
```

---

## 12. MOBILE STRATEGY

### The Problem

The arc choreography and pinned scroll are designed for desktop viewports. On mobile:
- Viewport is too narrow for meaningful arc paths
- Scroll pinning on touch devices can feel janky
- The particle field and wireframe are GPU-intensive

### The Solution

On mobile (`pointer: coarse` OR viewport width < 1024px):

**Option A — Simplified Vertical Reveal:**
- No pin, no scroll-jacking
- Projects are presented as full-viewport cards stacked vertically
- Each card: building render centered, project info below, colored background gradient (amber/teal)
- Entrance animation: fade + slide up as user scrolls into view
- Particles replaced with a subtle CSS gradient animation

**Option B — Autoplay Sequence:**
- A short looping video or CSS animation showing the orbital motion
- Plays once on load, then reveals projects as static cards
- More cinematic but higher production effort

**Recommendation:** Option A. Clean, performant, and achievable without additional video assets.

### Mobile Layout Per Project Card

```
┌─────────────────────┐
│                     │
│   [Building Image]  │
│     (centered)      │
│                     │
│   ARMONIA           │
│   APARTMENTS        │
│                     │
│   Lakatameia,       │
│   Nicosia · 2024    │
│                     │
│   COMPLETED         │
│                     │
│  [ VIEW PROJECT → ] │
│                     │
└─────────────────────┘
```

Background: subtle gradient from `--color-void` to the project's color tone (amber or teal), very faint.

---

## 13. PERFORMANCE CONSIDERATIONS

### GPU Budget

The hero section runs three GPU-intensive layers simultaneously:
1. Interactive particle field (Three.js / WebGL)
2. Wireframe mesh in State 1 (Three.js / WebGL — disposed after State 1)
3. Building render translations (CSS transforms or canvas draws)

**Mitigations:**
- Wireframe mesh Three.js renderer is disposed after its fade-out completes (State 1 → 2), freeing one WebGL context
- Particle field uses a single shared WebGL context
- Building renders use CSS transforms (`will-change: transform`) — GPU-accelerated but not WebGL
- The particle field's complexity (particle count, interaction radius) should be tunable and reduced on lower-end devices

### Asset Loading

| Asset | Size Estimate | Loading Strategy |
|-------|--------------|-----------------|
| Armonia render (PNG, transparent) | ~200–400KB (Cloudinary optimized) | Preload via `<link rel="preload">` |
| Almond render (PNG, transparent) | ~200–400KB | Lazy preload (start loading after Armonia is visible) |
| Particle component JS | ~50–100KB | Code-split, `dynamic(() => import(...), { ssr: false })` |
| Three.js (wireframe) | Shared with particle bundle | Same code-split |
| 21st.dev particle component | Bundled size TBD | Evaluate after integration |

**Total hero asset budget:** Under 1MB (far lighter than the ~26MB image sequence approach in V1).

### Lighthouse Impact

The new approach is significantly lighter than V1:
- No image sequences (300+ WebP frames eliminated)
- No loading screen needed
- Two Cloudinary-optimized PNGs instead of 26MB of frames
- Three.js overhead is offset by eliminating the canvas frame-scrubbing engine

Expected Lighthouse impact: homepage score should **improve** compared to V1 projections.

---

## 14. WHAT CHANGED FROM V1

### Removed

- ❌ Assembly sequence (Higgsfield video → image sequence → canvas scrub)
- ❌ Approach sequence (Higgsfield video → image sequence → canvas scrub)
- ❌ Threshold crossing (white bloom transition)
- ❌ Loading screen (no longer needed — assets are lightweight)
- ❌ FFmpeg processing pipeline
- ❌ `/public/sequences/` directory (assembly + approach frames)
- ❌ `HomepageCanvas.tsx` frame-scrubbing engine
- ❌ `imageSequence.ts` and `sequenceConfig.ts` utilities
- ❌ Mobile autoplay video fallback for sequences

### Added

- ✅ Interactive particle field (persistent background, 21st.dev component)
- ✅ Abstract wireframe mesh (Three.js, State 1 only)
- ✅ Arc-motion project introduction system (GSAP MotionPath)
- ✅ Per-project atmosphere system (color shifts, glow, light rays)
- ✅ Mirror-path swap choreography
- ✅ "DESIGNED TO LAST" brand statement
- ✅ Poetic quote (top-right)
- ✅ Project info overlays with CTA (CMS-driven)

### Changed

- 🔄 `"Homepage visual: HTML5 Canvas + image sequences (NOT Three.js — never)"` → Three.js is now used for the particle field and wireframe mesh. This is a deliberate reversal — Three.js is the right tool for interactive particles and geometric meshes, just not for photorealistic building visualization.
- 🔄 Scenes 1–4 consolidated into a single pinned hero with 4 internal states
- 🔄 The "no Three.js" rule in `TDK_MASTER_PLAN.md` Section 2.1 and Section 21.2 should be updated to: "Three.js is used for the hero section's particle field and wireframe mesh only. Building renders are served as optimized images via Cloudinary."

### Unchanged

- Scene 5 — The Anatomy (Interactive Building Dissection)
- Scene 6 — The Philosophy (Manifesto Scroll)
- Scene 7 — The Work (Projects Reel)
- Scene 8 — The Process (How TDK Builds)
- Scene 9 — The Conversation (Contact CTA)
- Scene 10 — The Footer
- All design tokens (Section 16–18 of original doc)
- Custom cursor system
- Sanity CMS architecture
- Cloudinary image pipeline (now also used for hero renders)
- Copy direction and voice guidelines

---

### Documents That Need Updates

When implementing this new hero section, the following references in existing documents should be updated:

| Document | Section | Change |
|----------|---------|--------|
| `TDK_MASTER_PLAN.md` | 2.1 Frontend | Update "Homepage visual" line to allow Three.js for particles/wireframe |
| `TDK_MASTER_PLAN.md` | 21.2 Hard Rules | Update rule 1 ("No Three.js") to reflect the new policy |
| `TDK_HOMEPAGE_EXPERIENCE.md` | Scenes 1–4 | Mark as superseded, reference this document |
| `TDK_HOMEPAGE_EXPERIENCE.md` | Section 3 (Technical Architecture) | Update file structure to remove sequence files, add particle/wireframe components |
| `TDK_HOMEPAGE_EXPERIENCE.md` | Section 20 (Performance) | Remove sequence loading strategy, add hero V2 asset strategy |
| `TDK_CURSOR_BUILD_STRATEGY.md` | Phase 4 prompts | Rewrite homepage scene prompts for new hero architecture |

---

> **The north star remains unchanged:**
> *"This is smooth. This is creative. This is amazing."*
>
> The new hero section achieves the same cinematic ambition with a lighter asset footprint,
> stronger brand presence, and a choreographic project introduction that no competitor
> in the Cypriot development market will have.
