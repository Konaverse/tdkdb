# TDK DESIGN & BUILD – HOMEPAGE EXPERIENCE
### Creative & Technical Direction Document

> **North Star:** Every person who lands on this page should feel three things in sequence:
> *"This is smooth. This is creative. This is amazing."*
>
> **Core Technique:** An interactive 2D Canvas particle system creates a living,
> breathing hero background. Paper-white particles drift on a void-black canvas,
> reacting to the user's cursor with anti-gravity physics. Manifesto typography
> floats above the particles with parallax depth. The rest of the homepage is
> standard HTML/CSS/GSAP scrollytelling — no WebGL, no Three.js, no image sequences.
>
> **Future Enhancement:** When Higgsfield AI video assets are finalized, the particle
> hero can be upgraded to a cinematic image-sequence-on-canvas experience (Apple-style
> scroll scrubbing). The particle system is preserved as a fallback for mobile and
> slow connections. See Appendix A for the upgrade path.
>
> **Status:** 🔲 = Not started | 🟡 = In discussion | ✅ = Finalized

---

## TABLE OF CONTENTS

1. [Experience Overview](#1-experience-overview)
2. [Why This Approach](#2-why-this-approach)
3. [Technical Architecture](#3-technical-architecture)
4. [The Particle Hero System](#4-the-particle-hero-system)
5. [Scene 1 — The Loading Screen](#5-scene-1--the-loading-screen)
6. [Scene 2 — The Hero (Particle Canvas + Manifesto Text)](#6-scene-2--the-hero-particle-canvas--manifesto-text)
7. [Scene 3 — The Transition (Hero Exit)](#7-scene-3--the-transition-hero-exit)
8. [Scene 4 — The Anatomy (Interactive Building Dissection)](#8-scene-4--the-anatomy-interactive-building-dissection)
9. [Scene 5 — The Philosophy (Manifesto Scroll)](#9-scene-5--the-philosophy-manifesto-scroll)
10. [Scene 6 — The Work (Projects Reel)](#10-scene-6--the-work-projects-reel)
11. [Scene 7 — The Process (How TDK Builds)](#11-scene-7--the-process-how-tdk-builds)
12. [Scene 8 — The Conversation (Contact CTA)](#12-scene-8--the-conversation-contact-cta)
13. [Scene 9 — The Footer](#13-scene-9--the-footer)
14. [Global Design Language](#14-global-design-language)
15. [Typography System](#15-typography-system)
16. [Motion & Easing Tokens](#16-motion--easing-tokens)
17. [Copy Direction](#17-copy-direction)
18. [Performance Strategy](#18-performance-strategy)
19. [Custom Cursor System](#19-custom-cursor-system)
20. [Mobile Strategy](#20-mobile-strategy)
21. [Appendix A — Image Sequence Upgrade Path (Future)](#21-appendix-a--image-sequence-upgrade-path-future)

---

## 1. EXPERIENCE OVERVIEW

This homepage is not a webpage. It is a **directed cinematic experience** — a single,
unbroken scroll journey that takes the visitor from first impression to emotional investment
to conversion. There are no sections in the traditional sense. There are **scenes**, each
with a beginning, middle, and end, connected by seamless transitions.

### The Narrative Arc

```
LOAD              HERO                    TRANSITION         ANATOMY
[Loading     →    [Particle canvas   →    [Hero fades   →    [Building
 screen]           + manifesto text]       out on scroll]      exploration]

      ↓                                                            ↓

PHILOSOPHY        PROJECTS               PROCESS            CONTACT → FOOTER
[Manifesto   →    [Horizontal  →         [Timeline     →    [CTA +
 statements]       reel]                   draws]             footer]
```

### The Two Layers of the Hero

The hero section is built from two independent layers, composited on screen:

**Layer 1 — The Particle Canvas (z-index: 0)**
An HTML5 2D Canvas element covering the full viewport. Hundreds of particles
drift in organic patterns. The user's cursor creates an anti-gravity field that
repels nearby particles — they spring back to their origin positions when the
cursor moves away. This creates a tactile, living background that responds to
human presence. No heavy asset preloading. Instant interactivity.

**Layer 2 — The Manifesto Text (z-index: 10)**
Absolutely positioned HTML text fragments floating above the particle canvas.
The same editorial manifesto typography from the original spec — "DESIGNED TO LAST.",
"NOT JUST BUILT. CRAFTED.", etc. — with staggered clip-path reveals, mouse parallax,
and scroll-driven exit animations.

Scenes 4–9 are all standard HTML/CSS/GSAP — no canvas, no special rendering.

---

## 2. WHY THIS APPROACH

### The Problem With Static Hero Backgrounds

Most architecture websites use a static full-bleed image or a slow autoplay video
as their hero background. These are passive — the user looks at them but doesn't
interact. They establish quality but not engagement.

TDK's positioning demands more. The first impression must communicate:
"This company builds with precision, and everything here responds to you."

### The Solution: Interactive Particles

The particle system achieves several things simultaneously:

1. **Immediate interactivity** — no waiting for video buffers or asset downloads.
   The canvas is responsive within milliseconds of page load.

2. **Tactile quality** — the cursor repelling particles creates an almost physical
   sensation of pushing through material. This maps directly to TDK's identity:
   they shape raw materials into architecture.

3. **Brand expression through physics** — the particle colors (paper-white, sparse teal)
   are the brand palette. The spring-return behavior feels considered and precise,
   not chaotic. The subtle teal accent particles mirror The Threshold Rule.

4. **Zero asset dependency** — no images, no videos, no CDN. The entire hero
   is generated in real-time by code. This means zero loading time for the
   most critical above-the-fold experience.

5. **Future-proof** — the particle canvas can be replaced with the cinematic
   image sequence experience (Appendix A) when Higgsfield assets are ready.
   The manifesto text overlay is identical in both versions.

```
Comparison:

Static hero image              │  Interactive particle canvas
─────────────────────────────  │  ─────────────────────────────
Passive viewing                │  Active interaction
Requires hero image asset      │  Zero assets — code-generated
Single visual state            │  Infinite states (cursor-driven)
Same on every visit            │  Unique every time
No loading screen needed       │  No loading screen needed
Quality depends on image       │  Quality depends on physics tuning
```

---

## 3. TECHNICAL ARCHITECTURE

### The Stack (Homepage Only)

```
Next.js 14 App Router (framework)
  └── /src/app/[locale]/(site)/page.tsx  ← homepage, NO global navbar/footer

Particle Canvas Layer (position: relative within hero section, z-index: 0)
  └── HTML5 <canvas> element
  └── 2D Context — requestAnimationFrame loop
  └── Covers ONLY the hero section (100vh)
  └── Fades out as user scrolls past hero

HTML Text Overlay (position: absolute within hero section, z-index: 10)
  └── Manifesto text fragments (Scene 2)
  └── Mouse parallax via GSAP quickTo
  └── Scroll-driven fade-out via GSAP ScrollTrigger

Loading Screen (position: fixed, z-index: 100)
  └── "TDK" text + progress bar
  └── Fades out after brief brand impression (~1.5 seconds)

Normal Page Flow (Scenes 4–9)
  └── Standard HTML elements
  └── GSAP ScrollTrigger entrance animations
  └── No canvas, no special rendering
  └── Anatomy, Philosophy, Projects, Process, Contact, Footer
```

### File Structure (Homepage-Specific)

```
src/
  app/[locale]/(site)/
    page.tsx                        ← Homepage root, no layout wrapper
  components/homepage/
    ParticleHeroBg.tsx              ← Interactive particle canvas (pre-built)
    LoadingScreen.tsx               ← Loading screen with progress bar
    SceneHero.tsx                   ← Manifesto text overlay
    HeroSection.tsx                 ← Orchestrator: loading → particles → text
    SceneAnatomy.tsx                ← Interactive building nodes (Scene 4)
    ScenePhilosophy.tsx             ← Manifesto statements (Scene 5)
    SceneProjects.tsx               ← Horizontal projects reel (Scene 6)
    SceneProcess.tsx                ← Process timeline (Scene 7)
    SceneContact.tsx                ← CTA section (Scene 8)
```

### How the Particle System Works

```typescript
// Conceptual logic (simplified)

// On mount: generate particles distributed across canvas
const particles = generateParticles(width, height, DENSITY)

// Each frame (requestAnimationFrame at 60fps):
function animate(time) {
  clearCanvas()

  // 1. Background effects: subtle teal radial glow, drifting dust
  drawBackgroundEffects(time)

  // 2. For each particle:
  for (const p of particles) {
    // a) Mouse repulsion force (if cursor is nearby)
    if (distToMouse < RADIUS) {
      p.velocity -= repulsionForce
    }
    // b) Spring force (pull back to origin)
    p.velocity += (p.origin - p.position) * SPRING_CONSTANT
    // c) Damping (friction)
    p.velocity *= DAMPING
    // d) Update position
    p.position += p.velocity
    // e) Draw
    drawCircle(p.position, p.size, p.color)
  }

  requestAnimationFrame(animate)
}
```

All animation state uses refs (not React state) — the animation loop never triggers
React re-renders. This is critical for maintaining 60fps.

---

## 4. THE PARTICLE HERO SYSTEM

### Particle Configuration

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `PARTICLE_DENSITY` | 0.00012 per px² | Architectural minimalism — enough to feel alive, not crowded |
| `BG_PARTICLE_DENSITY` | 0.00004 per px² | Background dust — very sparse |
| `MOUSE_RADIUS` | 200px | Generous influence area for premium feel |
| `RETURN_SPEED` | 0.06 | Slow spring = cinematic, not snappy |
| `DAMPING` | 0.92 | High = particles glide longer before settling |
| `REPULSION_STRENGTH` | 1.0 | Firm but not violent push |

### Color Distribution

- **90% of particles:** Paper-white `#F5F0E8` (var(--color-paper))
- **10% of particles:** Threshold teal `#66979f` (var(--color-threshold))
- **Background dust:** Paper-white only, very low alpha (0.05–0.25)
- **Background glow:** Threshold teal radial gradient, pulsating opacity (0.03–0.08)

The 10% teal distribution follows **The Threshold Rule**: teal appears sparingly,
like a signal. It should feel like rare fragments of color in a field of white —
not an even mix. The teal particles have slightly higher opacity than white particles
to ensure they register visually despite being outnumbered.

### Particle Sizes

- Main particles: 0.8px–2.2px radius (randomized)
- Background dust: 0.3px–1.2px radius
- These are deliberately small. The effect is atmospheric, not illustrative.
  Particles should feel like floating architectural dust, not bubbles or orbs.

### Collision Physics

Particles collide with elastic physics for tactile realism.
Collision detection is capped at 300 particles to maintain 60fps on mid-range hardware.
On a 1920×1080 screen, there are approximately 250 main particles — all will collide.
On 4K screens (~500 particles), only the first 300 have collision; the rest still
respond to mouse repulsion and spring return.

### Canvas Rendering

- Canvas dimensions are set to `width * devicePixelRatio` for Retina sharpness
- CSS `width` and `height` match the container (not the canvas pixel dimensions)
- The 2D context is scaled by `devicePixelRatio` so all coordinates use CSS pixels
- On resize: canvas dimensions recalculate, particles regenerate for new viewport

---

## 5. SCENE 1 — THE LOADING SCREEN

**Type:** Timed overlay (not asset-dependent)
**Duration:** ~1.5 seconds
**Purpose:** Brand impression + smooth entry into the particle experience

### What the User Sees

The page loads. A minimal loading screen covers the entire viewport.
"TDK" appears centered in large tracked type. A thin horizontal line fills
beneath it. The particle canvas is already initializing behind this screen.

After ~1.5 seconds, the "TDK" text fades out. Then the loading screen itself
fades out, revealing the particle canvas already in motion beneath it.
The manifesto text fragments then enter with staggered animations.

### Loading Screen Specification

```
─────────────────────────────────────────────
              [full screen, #0D0D0D]


                     TDK

               ─────────────────
               [thin line, 200px wide, fills left to right]


─────────────────────────────────────────────
```

- "TDK" in `text-display-md`, `letter-spacing: 0.3em`, `--color-paper`
- The line: 1px tall, `--color-paper`, fills via `scaleX` transform (not `width`)
- The fill is driven by a GSAP tween (0 → 1 over 1.5 seconds, ease: "power2.out")
- When fill completes:
  1. Wait 200ms
  2. "TDK" fades out (opacity 0, 400ms, --ease-smooth)
  3. Entire screen fades out (opacity 0, 500ms, --ease-smooth)
  4. Manifesto text begins entering (Scene 2)
- No percentage text. No spinner. Just the line.
- Use a GSAP timeline for the exit sequence — do NOT chain `setTimeout` calls.

### Scroll Lock

During loading screen: `document.body.style.overflow = 'hidden'`
On loading complete: `document.body.style.overflow = ''`

### Why This Loading Screen Exists

The particle canvas initializes instantly (no assets to load). The loading screen
is not about waiting — it's about pacing. A 1.5-second breath before the experience
begins creates anticipation and prevents the manifesto text from fighting with the
browser's initial layout paint. It also establishes "TDK" as the very first thing
the visitor reads — brand before content.

---

## 6. SCENE 2 — THE HERO (PARTICLE CANVAS + MANIFESTO TEXT)

**Type:** Static hero section with interactive background and mouse parallax
**Height:** 100vh (no scroll-jacking, no pinning)
**Background:** Particle canvas (ParticleHeroBg.tsx)
**Foreground:** Manifesto text fragments (SceneHero.tsx)

### What the User Sees

The loading screen dissolves. The particle canvas is already alive beneath it —
hundreds of small particles drifting gently. The user moves their cursor and
discovers the particles react, repelled by an invisible force field around the
mouse. They spring back when the cursor moves away.

Manifesto text fragments appear around the viewport in an editorial layout —
not centered, not aligned, but deliberately placed as if floating in
architectural space above the particles.

```
                                            "DESIGNED TO LAST."
                                            [top right, display-md, light]

"NOT JUST BUILT.
 CRAFTED."
[top left, heading, semibold]

                  [particles drift and react to cursor]

"Every line has a reason."
[mid left, italic, body-lg]
                                            TDK DESIGN & BUILD
                                            [bottom right, text-label, stone]

                    ↓ SCROLL
                    [bottom center, subtle animation]
```

### Text Fragments — Specification

| # | Copy | Position | Style | Animation |
|---|------|----------|-------|-----------|
| 1 | "DESIGNED TO LAST." | top: 15%, right: 8% | text-display-md (clamp(36px,4vw,64px)), weight 300, letter-spacing 0.05em, --color-paper | Clip-path left→right, 700ms, delay 200ms |
| 2 | "NOT JUST BUILT. CRAFTED." | top: 25%, left: 6% | text-heading (clamp(24px,3vw,40px)), weight 600, --color-paper. Two lines via `<br/>` | Clip-path left→right, 700ms, delay 400ms |
| 3 | "Every line has a reason." | top: 55%, left: 8% | text-body-lg (18px), weight 300, **italic**, --color-paper. This is the ONLY italic text on the entire site. | Fade + translateY(20px→0), 600ms, delay 600ms |
| 4 | "TDK DESIGN & BUILD" | bottom: 18%, right: 8% | text-label (11px), weight 600, uppercase, letter-spacing 0.2em, --color-stone | Fade in, 500ms, delay 700ms |
| 5 | Scroll indicator | bottom: 6%, center | "SCROLL" in text-label, --color-stone. Below: 1px vertical line (32px tall) with animated mask sweep looping downward every 2s | Fade in, 400ms, delay 900ms |

### Text Entrance Animation

All animations use `--ease-smooth` (`power4.out`).
Clip-path reveals: `inset(0 100% 0 0)` → `inset(0 0% 0 0)` (text sweeps in from left).
Fade + translate: standard opacity 0→1 with translateY shift.

Use a single GSAP timeline triggered when the loading screen's `onComplete` fires.
Each fragment is a child of the timeline with the specified delay.

### Mouse Parallax

Each fragment drifts subtly with cursor movement:
- Depth values: Fragment 1 = 0.02, Fragment 2 = 0.025, Fragment 3 = 0.015, Fragment 4 = 0.01, Fragment 5 = 0.03
- On `mousemove`: `translateX = (cursorX - centerX) × depth`, same for Y
- Use `gsap.quickTo()` for each fragment — no layout thrashing
- Duration: 0.6s with `power3.out` easing for smooth lag
- Only active on `pointer: fine` devices (not touch)
- Attach listener when hero becomes visible, remove on unmount

The effect should feel like the text is floating in the same space as the particles,
slightly closer to the camera than the canvas. Subtle. If you notice it consciously,
it's too strong.

### Scroll-Out Behavior

As the user scrolls down from the hero section (natural scroll, no jacking):
- Each fragment fades to opacity 0 and translates outward (away from viewport center)
- Top fragments translate upward, bottom fragments translate downward
- Driven by GSAP ScrollTrigger:
  trigger: hero section element
  start: 'top top'
  end: '+=40%' (40vh of scroll drives the full fade-out)
  scrub: 1
- The scroll indicator disappears instantly (opacity 0, no transition) as soon as
  ScrollTrigger progress exceeds 0.05

### Semantic Structure

- Fragment 1 ("DESIGNED TO LAST."): `<h1>` — primary heading for SEO
- Fragment 2: `<p>`
- Fragment 3: `<p>`
- Fragment 4: `<p>` — brand identifier
- Fragment 5: `<div role="presentation">` — decorative

### Responsive Behavior (Mobile < 768px)

- Reposition fragments for centered, stacked layout:
  Fragment 1: top 20%, centered, text-align center
  Fragment 2: top 35%, centered
  Fragment 3: top 55%, centered
  Fragment 4: bottom 20%, centered
  Fragment 5: bottom 6%, centered (unchanged)
- Reduce display sizes by one step (text-display-md → text-heading, etc.)
- Mouse parallax disabled (pointer: coarse)
- Touch interaction still triggers particle repulsion (onTouchMove maps to mouse handler)

### Accessibility

- Respect `prefers-reduced-motion`: skip clip-path and translateY animations,
  show all fragments immediately at full opacity
- Particle canvas continues animating (it's decorative and low-motion)
- All text meets WCAG AA contrast on void-black background

---

## 7. SCENE 3 — THE TRANSITION (HERO EXIT)

**Type:** Scroll-driven fade transition
**Scroll distance:** Natural scroll — no additional scroll distance consumed
**Purpose:** Visual bridge from the full-screen hero into the content sections below

### What Happens

As the user scrolls past the hero section:

1. **Text fragments fade out** (already described in Scene 2 scroll-out behavior)

2. **Particle canvas fades** — GSAP ScrollTrigger on the hero section:
   trigger: hero section
   start: 'top top'
   end: 'bottom top' (when bottom of hero reaches top of viewport)
   scrub: 1.5
   Animate particle container opacity: 1 → 0

3. **Gradient bleed** — A div overlapping the boundary between hero and Scene 4:
   Height: 30vh
   Position: absolute, bottom: -30vh of the hero section
   Background: linear-gradient(to bottom, var(--color-void) 0%, transparent 100%)
   z-index: 5, pointer-events: none
   Prevents a hard visual cut between the particle background and the content below.

4. **Vignette overlay** (optional, subtle):
   Position: absolute, inset: 0 within hero section, z-index: 2
   Background: radial-gradient(ellipse at center, transparent 50%, rgba(13,13,13,0.5) 100%)
   pointer-events: none
   Darkens the edges of the particle canvas, drawing focus to center where the text sits.

### No Scroll-Jacking

The hero section is exactly 100vh with `position: relative`. It scrolls out of
view naturally. There is no `overflow: hidden`, no pinning, no scroll container
with artificial height. The user's scroll wheel behaves exactly as expected.

The transition from hero to content should feel effortless — like turning a page,
not like being released from a mechanism.

---

## 8. SCENE 4 — THE ANATOMY (INTERACTIVE BUILDING DISSECTION)

**Type:** Pinned HTML section, hover-interactive
**Scroll distance:** 100vh (pins for the duration)
**Source:** Static Armonia front-facing render (PNG/WebP) as regular `<img>`

### What the User Sees

The page transitions from the hero into a static split-screen layout.
Left half: a text panel. Right half: the front-facing Armonia render with
6 interactive hotspot nodes overlaid on it.

The building "breathes" — a very subtle scale oscillation (1.000 → 1.003),
4-second sine loop, gives the static image a sense of life.

The user hovers over a node. The node pulses, expands. A thin connector line
draws from the node to the left panel. The left panel slides in new content.
All other nodes dim.

### Layout

```
┌─────────────────────────┬──────────────────────────┐
│                         │                          │
│   LEFT TEXT PANEL       │   BUILDING RENDER        │
│   (50% width)           │   (50% width)            │
│                         │          ●  Node 5       │
│   ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄    │     ●                    │
│   EXPLORE THE BUILDING  │   Node 3 ●          ● Node 4 │
│   (default text)        │                          │
│                         │          ●  Node 1       │
│                         │   (entrance)             │
│                         │     ●  Node 6            │
│                         │   (landscape)            │
└─────────────────────────┴──────────────────────────┘
```

### The 6 Nodes

| # | Name | Position on render | Heading | Body copy |
|---|------|--------------------|---------|-----------|
| 1 | Entrance | left: 48%, top: 72% | "The First Impression" | "Recessed lighting. Timber-lined walls. A door that announces arrival. The entrance of Armonia was designed to make every return home feel intentional." |
| 2 | Facade | left: 50%, top: 38% | "The Language of White" | "White is not a neutral choice. In the Mediterranean light of Nicosia, white is alive — it shifts from warm cream at dawn to luminous silver at noon. Every facade surface was calculated for how it holds that light." |
| 3 | Balconies | left: 30%, top: 50% | "Living Extended" | "The balconies are not additions. They are extensions of the living floor — same ceiling height, same material continuity, designed so the threshold between inside and outside is a question of temperature, not architecture." |
| 4 | Glazing | left: 70%, top: 44% | "Glass as Architecture" | "Floor-to-ceiling glazing on every primary room. The frames are narrow by design — the view is the furniture. Passive solar orientation ensures winter sun penetrates deep while summer overhangs prevent overheating." |
| 5 | Rooftop | left: 50%, top: 16% | "The Fifth Facade" | "Most buildings forget their rooftops. Armonia's is designed to be inhabited — a private sky-level terrace with views across Lakatameia toward the Pentadaktylos mountains." |
| 6 | Landscape | left: 28%, top: 80% | "Grounded" | "The boundary between public pavement and private threshold is handled in natural stone — a material that weathers slowly and gracefully, unlike concrete. This is how a building belongs to its street." |

### Node Visual Design

**Default state:**
- 20px outer ring, 1px solid `rgba(255,255,255,0.3)`, `border-radius: 50%`
- 6px inner dot, `background: rgba(255,255,255,0.5)`, `border-radius: 50%`
- Pulse animation: outer ring scales 1.0 → 1.5, fades out, repeat every 2.5s
- Each node staggered pulse start: +0ms, +400ms, +800ms, +1200ms, +1600ms, +2000ms

**Hover/Active state:**
- Outer ring: `--color-threshold` (#66979f), scale transition to 1.2x
- Inner dot: `--color-threshold`, scale to 1.5x
- All other nodes: opacity → 0.25 (150ms transition)
- Connector line draws (see below)

**Connector Line:**
An SVG element spans the full anatomy section (position: absolute, inset: 0).
When a node activates: an SVG `<path>` draws from the node's center
to the left edge of the screen at the same vertical position.
The line is 1px, `--color-threshold`, drawn via stroke-dashoffset animation over 400ms.

### Left Panel Text Animation

**Default state:** "EXPLORE THE BUILDING" in `text-label`, centered vertically.
Thin `--color-border` lines above and below the text.

**On node hover:**
- Default text: `translateY(-100%) opacity(0)` exits upward (300ms, ease-exit)
- Threshold line: 2px, `--color-threshold`, 40px wide, slides in from left
- Heading: slides in from below (translateY(30px)→0, opacity 0→1, 350ms)
- Body copy: slides in 80ms after heading

**On hover end:**
- Content exits downward, default state returns

### Unpin Trigger

After user has hovered at least 3 nodes, OR after 10 seconds of dwell time:
A "↓ CONTINUE" prompt appears at bottom center (text-label, animated in gently).
On next scroll action: section unpins, normal scroll resumes.

---

## 9. SCENE 5 — THE PHILOSOPHY (MANIFESTO SCROLL)

**Type:** Scroll-driven typography, pinned statements
**Scroll distance:** 120vh (each statement occupies ~24vh)
**Background:** `--color-void` with very subtle warmth shift animation

### What the User Sees

Full-screen, pure dark. Large typographic statements appear one at a time,
each revealed by a clip-path sweep. Between statements, a brief architectural
detail image flashes at low opacity (film grain filter applied). The effect
is cinematic — like reading a founding document in a darkened cinema.

### The 5 Statements

| # | Text | Size | Weight | Timing |
|---|------|------|--------|--------|
| 1 | "We don't build buildings. / We build the conditions for life." | text-display-md | 300 | Enters at 0vh, exits at 20vh |
| 2 | "Architecture is not decoration. / It is decision-making made visible." | text-display-md | 300 | Enters at 22vh, exits at 42vh |
| 3 | "Every project begins with a question: / How should this family live?" | text-display-lg | **400** | Enters at 44vh — this is the largest, most important statement |
| 4 | "TDK was founded on one belief: / Good design is non-negotiable." | text-display-md | 300 | Enters at 66vh, exits at 86vh |
| 5 | "This is what we build. / ARMONIA. / Lakatameia, Nicosia." | "ARMONIA" at clamp(72px, 12vw, 160px) | 300 | Enters at 88vh — lingers |

### Statement Reveal Animation

Each statement: `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`
Direction: left to right sweep
Duration: 600ms per line
Easing: `--ease-smooth`
Multi-line statements: second line starts 80ms after first

Exit: `opacity: 1 → 0` over 300ms as next statement enters

### Flash Images Between Statements

Between statements 1→2, 2→3, 3→4, 4→5:
Full-screen image div flashes:
- opacity: 0 → 0.6 → 0 (total 500ms)
- CSS filter: `grayscale(1) contrast(1.1)` (desaturates the flash)
- CSS noise overlay: `url('/noise.png') repeat`, opacity 0.05 (subtle grain)

Flash image sources (generated in Higgsfield, Step 6):
1. Close-up of timber grain texture
2. Hands sketching a floor plan
3. A window frame corner
4. Interior light shafts

### Background Warmth Drift

Subtle CSS animation on the section background:
`background-color` oscillates between `#0D0D0D` and `#0F0B08` over 8 seconds.
`animation: warmth 8s ease-in-out infinite alternate`
Almost imperceptible — adds subconscious warmth to the reading experience.

### "ARMONIA." Typography

Statement 5 must be the most impactful moment on the page:
- "ARMONIA." in `font-size: clamp(72px, 12vw, 160px)`, weight 300, `letter-spacing: 0.08em`
- This single word takes up most of the screen width
- "Lakatameia, Nicosia." appears beneath in `text-label` style, `--color-stone`
  Fades in 600ms after "ARMONIA." finishes its reveal
- This statement does NOT exit — it lingers as the user scrolls into Scene 6

---

## 10. SCENE 6 — THE WORK (PROJECTS REEL)

**Type:** Horizontal scroll driven by vertical scroll
**Scroll distance:** 150vh
**Background:** Transitions from `--color-void` to `#111111`

### What the User Sees

A section heading "THE WORK" fades in as Scene 5 ends.
Below it, a horizontal carousel. As the user scrolls vertically,
the carousel slides leftward, revealing project cards.
Each card is full-screen (100vw × 100vh). The parallax on the images
makes them feel like windows into the projects.

### Section Header

```
THE WORK                                              01 / 02 →
[text-label, left-aligned]                    [counter, right-aligned]
```

The counter updates as the active card changes.
Number flip animation: current number exits upward, new number enters from below.

### Horizontal Scroll Mechanics

```typescript
// The carousel track translates left as user scrolls down
gsap.to('.projects-track', {
  x: () => -(totalWidth - window.innerWidth),
  ease: 'none',
  scrollTrigger: {
    trigger: '.projects-section',
    start: 'top top',
    end: '+=150%',
    scrub: 1,
    pin: true,
    anticipatePin: 1,
  }
})
```

### Project Card Layout

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   [Full-bleed building image, parallax 0.7x speed]   │
│                                                      │
│                                                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  01                                                  │
│  ARMONIA APARTMENTS                    VIEW PROJECT → │
│  Lakatameia, Nicosia · 2025 · Residential            │
└──────────────────────────────────────────────────────┘
```

Info panel slides up from below when card enters view (translateY 100%→0, 500ms).
On hover: image scales to 1.05x, cursor becomes "VIEW" state.

### Cards (CMS-Driven)

Cards are pulled from Sanity — the first 5 projects where `status != 'upcoming'`.
Adding a new project in Sanity automatically adds a card here. No code changes needed.

**Current cards:**

**Card 01 — Armonia Apartments (Showcase)**
```
┌──────────────────────────────────────────────────────┐
│  [Armonia exterior render — Cloudinary, parallax]    │
│                              ┌─────────────┐         │
│                              │  COMPLETED  │         │
│                              └─────────────┘         │
├──────────────────────────────────────────────────────┤
│  01                                                  │
│  ARMONIA APARTMENTS                    VIEW PROJECT → │
│  Lakatameia, Nicosia · 2024 · Residential            │
└──────────────────────────────────────────────────────┘
```
- "COMPLETED" badge: small pill, `--color-stone` text, `--color-surface` background
- CTA text: "VIEW PROJECT →"
- CTA links to: `/projects/armonia`
- Cursor state: "VIEW"

**Card 02 — Almond Project (Pre-Sale)**
```
┌──────────────────────────────────────────────────────┐
│  [Almond render — Cloudinary, parallax]              │
│                         ┌──────────────────┐         │
│                         │  IN DEVELOPMENT  │         │
│                         └──────────────────┘         │
├──────────────────────────────────────────────────────┤
│  02                                                  │
│  ALMOND                           REGISTER INTEREST → │
│  Nicosia, Cyprus · 2025/26 · Residential             │
└──────────────────────────────────────────────────────┘
```
- "IN DEVELOPMENT" badge: small pill, `--color-threshold` text, darker background
- CTA text: "REGISTER INTEREST →" (not "VIEW PROJECT")
- CTA links to: `/projects/almond`
- Subtle teal glow on the image (very faint radial gradient, threshold color)
  — signals this is active and available, not just historical

**How CTA type is determined:**
The card reads `project.ctaType` from Sanity:
- `showcase` → "VIEW PROJECT →"
- `register-interest` → "REGISTER INTEREST →"
- `contact` → "ENQUIRE →"

Future projects appear automatically as new cards when published in Sanity.

---

## 11. SCENE 7 — THE PROCESS (HOW TDK BUILDS)

**Type:** Scroll-driven timeline reveal
**Scroll distance:** 120vh
**Background:** Subtly warmer dark (`#0F0B08`) with a very faint paper texture

### What the User Sees

A section heading appears. A horizontal SVG line draws itself left-to-right
across the screen as the user scrolls. At each of 5 positions on the line,
a tick mark and process step appear as the line reaches them.

The overall feeling is of a pen drawing a diagram — considered, precise, human.

### The Timeline

A full-width SVG element with:
- A horizontal line spanning 80% of viewport width, vertically centered
- 5 vertical tick marks at 0%, 25%, 50%, 75%, 100% of line length
- The line draws via `stroke-dashoffset` tied to ScrollTrigger progress

### The 5 Steps

Each step has a number, title, and description that appears as the line
reaches its tick position:

| # | Title | Description |
|---|-------|-------------|
| 01 | VISION | "We begin with a conversation. Not a brief. We need to understand how you want to live before we draw a single line." |
| 02 | DESIGN | "Architecture that responds to your specific life — your light, your family, your relationship with the city." |
| 03 | ENGINEERING | "Structure, systems, and compliance fully resolved. Nothing is left to chance on a building site." |
| 04 | BUILD | "Construction managed to the millimetre. We don't hand off to a contractor — we stay present." |
| 05 | HANDOVER | "The moment the door opens for the first time. Every detail checked. Every system explained. The beginning of your story." |

Step appearance: `opacity: 0 → 1` + `translateY: 20px → 0` over 400ms
Triggered when the SVG line reaches each step's tick position.

Numbers are in `text-mono` style (JetBrains Mono), `--color-threshold` color.

### Closing Line

After step 5 appears, a single sentence fades in below the timeline:
"Every project. Every time." in `text-display-md`, weight 300, centered.
100ms delay after step 5 completes.

---

## 12. SCENE 8 — THE CONVERSATION (CONTACT CTA)

**Type:** Entrance animation on scroll, then static
**Background:** Back to pure `--color-void`

### What the User Sees

Full screen. Pure dark. Centered content.

```
LET'S BUILD
SOMETHING
TOGETHER.

[ START A CONVERSATION → ]

Or reach us directly:
hello@tdkdb.com · +357 XX XXX XXXX
```

Very faint architectural line drawing drifts upward in the background.

### Headline Animation

Word-by-word clip-path reveal (left-to-right per word):
"LET'S" → "BUILD" → "SOMETHING" → "TOGETHER."
60ms stagger between words.

Words are positioned across 3 lines:
- Line 1: "LET'S BUILD" — `text-display-lg`, weight 300
- Line 2: "SOMETHING" — `text-display-lg`, weight 300
- Line 3: "TOGETHER." — `text-display-lg`, weight 300, color: `--color-threshold`
  (the period and the word have a soft teal tint — subtle but intentional)

### CTA Button

Primary variant, magnetic behavior enabled.
Text: "START A CONVERSATION →"
Links to `/contact`

Magnetic: responds within 80px radius, moves max 12px toward cursor.
On hover: fill color transitions to `--color-threshold` (300ms).

Appears 600ms after headline completes (fade + scale 0.95→1).

### Secondary Contact Details

"Or reach us directly:" in `text-label`, `--color-stone`
Email and phone in `text-body`, `--color-paper`
On hover: color shifts to `--color-threshold`, underline appears.

Appear 800ms after headline.

### Background Line Drawing

An SVG of a minimal architectural floor plan sketch (just 8–10 intersecting
line segments suggesting a building footprint):
- `opacity: 0.03` (barely visible)
- `position: absolute`, full section size
- Slowly drifts upward: `translateY: 0 → -30px` over 25 seconds, linear, infinite
- The extreme subtlety is intentional — it should feel like a subconscious
  texture, not a visible element

---

## 13. SCENE 9 — THE FOOTER

**Type:** Curtain reveal on scroll
**Source:** Global Footer component from `/src/components/layout/Footer.tsx`

### What the User Sees

As the CTA section ends, a `--color-surface` panel (slightly lighter than void)
slides upward to reveal the footer content beneath.

The footer itself is standard — see `TDK_MASTER_PLAN.md` Section 6.10 for the
full footer specification.

On the homepage, the footer is included directly (not via the global layout,
since the homepage opts out of the global layout).

---

## 14. GLOBAL DESIGN LANGUAGE

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-void` | `#0D0D0D` | Primary background, main canvas |
| `--color-surface` | `#1A1A1A` | Secondary backgrounds, cards |
| `--color-paper` | `#F5F0E8` | All primary text, default cursor |
| `--color-stone` | `#8C8C8C` | Secondary text, labels, metadata |
| `--color-threshold` | `#66979f` | Accent only — active nodes, CTA hover, numbers, "TOGETHER." |
| `--color-glass` | `rgba(255,255,255,0.04)` | Subtle overlays |
| `--color-border` | `rgba(255,255,255,0.08)` | Lines, dividers |

**The Threshold Rule:**
`--color-threshold` appears in only ONE interactive element at a time.
Never use it on two things simultaneously visible on screen.
It is the color of attention — it should arrive like a signal.

### Border Radius

Zero. Everywhere. No exceptions.
Architecture is rectilinear. The site must be too.

### Shadows

None. Depth is created through color, opacity, and layering only.

---

## 15. TYPOGRAPHY SYSTEM

### Primary Font: Josefin Sans

Geometric sans-serif with tall proportions, slight art-deco character.
Feels architectural, precise, elegant.

Load via `next/font/google`. Subsets: latin only.
Weights to load: 300 (Light), 400 (Regular), 600 (SemiBold).
`font-display: swap`.

### Secondary Font: JetBrains Mono

Monospace, used ONLY for numbers (step counters, project numbers, stats).
Creates a technical precision contrast against the geometric sans.

### Type Scale

| Class | Size (clamp) | Weight | Line Height | Letter Spacing | Usage |
|-------|-------------|--------|-------------|----------------|-------|
| `.text-display-xl` | clamp(64px, 8vw, 120px) | 300 | 1.0 | 0.05em | Hero-level display |
| `.text-display-lg` | clamp(48px, 6vw, 96px) | 300 | 1.1 | 0.05em | Scene headings |
| `.text-display-md` | clamp(36px, 4vw, 64px) | 400 | 1.1 | 0em | Sub-headings |
| `.text-heading` | clamp(24px, 3vw, 40px) | 600 | 1.2 | 0em | Section headings |
| `.text-body-lg` | 18px | 300 | 1.7 | 0em | Large body copy |
| `.text-body` | 16px | 400 | 1.6 | 0em | Standard body copy |
| `.text-label` | 11px | 600 | 1.4 | 0.2em | ALL CAPS labels, nav, counters |
| `.text-mono` | 13px | 400 | 1.4 | 0em | Numbers (JetBrains Mono) |

### Typography Rules

1. **Display weights are always 300 (Light).** Heavy text at display size
   looks aggressive. Lightness at scale feels architectural and confident.
2. **Labels are always uppercase, always tracked.** Never use `text-label`
   on sentences — only on names, categories, counters, navigation.
3. **Body copy is never centered.** Left-align all paragraphs, always.
4. **No italics except** the "Every line has a reason." fragment in Scene 2.
5. **`text-mono` is for numbers only.** Never write words in monospace.
6. **Maximum text column width: 680px.** Long lines kill readability.

---

## 16. MOTION & EASING TOKENS

### Easing

| Token | Value | When to use |
|-------|-------|-------------|
| `--ease-smooth` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for most UI transitions |
| `--ease-entrance` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements arriving into view |
| `--ease-exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements leaving view |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Magnetic button release, node expand |
| `--ease-cinematic` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Scroll transitions |

In GSAP terms:
- `--ease-smooth` → `"power4.out"`
- `--ease-entrance` → `"power2.in"`
- `--ease-exit` → `"power2.out"`
- `--ease-spring` → `"back.out(1.7)"`
- `--ease-cinematic` → `"power1.inOut"`

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 150ms | Hover color changes, opacity flickers |
| `--duration-fast` | 300ms | Button states, node hover expand |
| `--duration-medium` | 500ms | Panel slides, text transitions |
| `--duration-slow` | 800ms | Section entrance, text reveals |
| `--duration-cinematic` | 1200ms | Full-screen transitions |

### Stagger Values

| Token | Value | Usage |
|-------|-------|-------|
| `--stagger-tight` | 40ms | Character-by-character or word-by-word |
| `--stagger-normal` | 80ms | List items, nav links, node pulses |
| `--stagger-loose` | 120ms | Card grids, process steps |

### ScrollTrigger Scrub Values

| Value | Feel | Usage |
|-------|------|-------|
| `scrub: true` | Instant, 1:1 | Not used — too mechanical |
| `scrub: 1` | Slightly smooth | General scroll-driven animations |
| `scrub: 1.5` | Cinematic lag | Hero fade, parallax elements |
| `scrub: 2` | Very smooth | Slow-moving background effects |

---

## 17. COPY DIRECTION

### The Voice

Architectural authority with human warmth.
Not corporate. Not casual. Like a great architect in a client meeting —
confident, specific, slightly poetic.

**This voice would say:** "The balconies are not additions. They are
extensions of the living floor."

**This voice would NOT say:** "Our state-of-the-art balconies provide
exceptional outdoor living spaces."

### Rules

1. No superlatives. Never "the best", "world-class", "exceptional", "stunning".
2. Short sentences. One idea per sentence. Full stop.
3. Specific beats general. "Faces south-southwest" > "great light".
4. Numbers are credibility. Use them when available.
5. Present tense, active voice. Always.
6. No jargon. "Passive solar shading" is fine — it means something precise.
   "Synergistic design solutions" is not.
7. The building is a character. Refer to "Armonia" not "the project" or "it".

### Copy by Scene

**Scene 2 — Hero Manifesto Fragments**
```
DESIGNED TO LAST.
NOT JUST BUILT. CRAFTED.
Every line has a reason.
TDK DESIGN & BUILD
```

**Scene 5 — Philosophy Statements**
```
We don't build buildings.
We build the conditions for life.

Architecture is not decoration.
It is decision-making made visible.

Every project begins with a question:
How should this family live?

TDK was founded on one belief:
Good design is non-negotiable.

This is what we build.
ARMONIA.
Lakatameia, Nicosia.
```

**Scene 6 — Projects Reel (Armonia card)**
```
01
ARMONIA APARTMENTS
Lakatameia, Nicosia · 2024 · Residential
[VIEW PROJECT →]
```

**Scene 7 — Process Steps**
```
01  VISION
We begin with a conversation. Not a brief. We need to understand
how you want to live before we draw a single line.

02  DESIGN
Architecture that responds to your specific life —
your light, your family, your relationship with the city.

03  ENGINEERING
Structure, systems, and compliance fully resolved.
Nothing is left to chance on a building site.

04  BUILD
Construction managed to the millimetre.
We don't hand off to a contractor — we stay present.

05  HANDOVER
The moment the door opens for the first time.
Every detail checked. Every system explained.
The beginning of your story.

Every project. Every time.
```

**Scene 8 — Contact CTA**
```
LET'S BUILD
SOMETHING
TOGETHER.

[START A CONVERSATION →]

Or reach us directly:
hello@tdkdb.com
+357 XX XXX XXXX
```

---

## 18. PERFORMANCE STRATEGY

### Loading Priority

```
Priority 1 (blocks render):
  └── Base CSS, loading screen HTML
  └── Josefin Sans 300 weight (preloaded)
  └── ParticleHeroBg.tsx JavaScript (~4KB gzipped)

Priority 2 (loads during loading screen / hero):
  └── GSAP + ScrollTrigger (~30KB gzipped)
  └── Lenis (~8KB gzipped)
  └── SceneHero.tsx (manifesto text)

Priority 3 (lazy, loads below fold):
  └── Anatomy section render image (Cloudinary)
  └── Philosophy flash images (Cloudinary)
  └── Project card images — Armonia + Almond (Cloudinary)
  └── JetBrains Mono font
  └── SceneAnatomy, ScenePhilosophy, SceneProjects, SceneProcess, SceneContact
```

### No Heavy Asset Preloading

Unlike the image sequence approach (which required preloading 26MB of frames),
the particle hero has zero asset dependencies. The canvas renders immediately
from code. This eliminates the primary performance bottleneck of the original design.

The loading screen exists for brand impression and pacing, not for actual preloading.

### Cloudinary for All Non-Hero Images

All project photography and renders (Anatomy building image, Projects cards, etc.)
are served from Cloudinary with automatic optimization:
- `f_auto` — WebP/AVIF per browser
- `q_auto` — optimal quality per image
- `w_[size]` — correct dimensions, never oversized

### Canvas Rendering Performance

- Particle physics run in a requestAnimationFrame loop at 60fps
- All animation state uses refs — zero React re-renders during animation
- Collision detection capped at 300 particles to maintain frame budget
- Canvas uses `devicePixelRatio` for sharp rendering without layout reflow
- Canvas only renders while the hero section is visible — no background animation
  after the user scrolls past (stop the RAF loop when hero exits viewport)

### Lighthouse Targets

| Page | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Homepage | > 85 | > 70 | Improved — no 26MB sequence preload |
| Almond | > 90 | > 75 | Photo slider, Cloudinary optimized |
| All other pages | > 90 | > 80 | Standard Next.js SSG |

---

## 19. CUSTOM CURSOR SYSTEM

### The Cursor

All pages (not just homepage) use a custom cursor.
Default system cursor is hidden via `cursor: none` on `html`.

**Visual:** 12px × 12px circle, `border: 1px solid var(--color-paper)`,
transparent fill, `border-radius: 50%`

**Following behavior:** GSAP `quickTo` with 0.3s spring lag.
The cursor trails behind the mouse, catching up with a smooth deceleration.
This spring is what gives the interaction its premium feel.

### Cursor States

| State | Trigger | Visual |
|-------|---------|--------|
| Default | Everywhere | 12px circle, paper border |
| Hover | `data-cursor="hover"` on buttons/links | Expands to 40px, fills threshold teal |
| Node | `data-cursor="node"` on anatomy nodes | Expands to 60px, crosshair lines appear |
| View | `data-cursor="view"` on project images | Expands to 80px, "VIEW" text inside |
| Scroll | During active scroll | Shrinks to 6px solid dot |

### Magnetic Buttons

All primary CTA buttons have magnetic behavior:
- Detect mouse within 80px radius
- Apply `translateX/Y` to move button max 12px toward cursor
- On mouse leave: spring return using `--ease-spring`
- Only on `pointer: fine` devices (not touch)

---

## 20. MOBILE STRATEGY

### The Approach

On mobile (`pointer: coarse` media query OR viewport width < 1024px):

The particle hero works natively on mobile — no separate implementation needed.
The canvas generates fewer particles automatically (smaller viewport = fewer pixels
= lower particle count). Touch events trigger the same particle repulsion that
mouse events do on desktop.

### Mobile-Specific Adjustments

1. **Hero text layout:** Fragments reposition to centered, stacked layout (see Scene 2)
2. **Mouse parallax disabled:** Touch does not trigger text parallax (pointer: coarse check)
3. **Touch particle interaction:** `onTouchMove` maps to the same mouse handler,
   allowing users to drag their finger and repel particles
4. **Anatomy section:** Nodes become tappable (not hover). Content appears in an
   expanding panel below the image, not in a side panel. No pinning on mobile.
5. **Projects reel:** Cards stack vertically (no horizontal scroll mechanism)
6. **Process timeline:** Becomes vertical (top-to-bottom)
7. **Custom cursor:** Hidden entirely (system cursor used instead)
8. **All other sections:** Identical to desktop, just adapted layout

### Performance on Mobile

The particle canvas is lightweight by design:
- On a 375×812 screen: ~36 main particles + ~12 background particles
- Far less than the 250+ particles on desktop
- Canvas redraws are simple — just `arc()` calls, no complex drawing
- If performance issues are detected on low-end devices, the canvas can be
  replaced with a static gradient background via a feature detection check

### Future Mobile Enhancement

When Higgsfield video assets are available, mobile can optionally use the
autoplay MP4 approach described in Appendix A. But the particle hero is a
fully viable mobile experience on its own.

---

## 21. APPENDIX A — IMAGE SEQUENCE UPGRADE PATH (FUTURE)

> **This section is preserved from the original specification. It documents the
> cinematic image-sequence-on-canvas experience that can replace the particle hero
> when Higgsfield video assets are finalized and FFmpeg-processed.**
>
> **Do NOT implement this until all of the following assets are confirmed ready:**
> - `/public/sequences/assembly/frame-0001.webp` through `frame-XXXX.webp`
> - `/public/sequences/approach/frame-0001.webp` through `frame-XXXX.webp`
> - `/public/sequences/hero-still.webp`
> - `/public/videos/approach-mobile.mp4`

### What Changes in the Upgrade

The particle hero (Scenes 1–3 in the current spec) is replaced by four cinematic scenes:

**Scene A — The Assembly (Load Sequence)**
The Armonia building assembles itself from scattered pieces into a complete structure.
Plays automatically on page load (time-based RAF loop, not scroll-based).
Duration: ~120 frames at 24fps = ~5 seconds.
During assembly: scroll is locked (`overflow: hidden`).

**Scene B — The Hero (First Resting State)**
After assembly completes, the canvas shows the final assembled building frame.
The manifesto text overlay (SceneHero.tsx) appears — identical to the current spec.
Mouse parallax on text fragments. Scroll indicator at bottom.

**Scene C — The Approach (Scroll Into the Building)**
As the user scrolls, the camera pushes toward the building entrance.
Fully scroll-controlled via GSAP ScrollTrigger on a 150vh scroll container.
Frame-by-frame canvas drawing from the approach image sequence.
A CSS vignette darkens edges, a warm glow appears near the entrance at 60% progress.

**Scene D — The Threshold (Crossing the Door)**
A radial bloom of teal light erupts from the center of the screen.
The bloom expands to near-white, then recedes. The canvas fades to `display: none`.
Scene 4 (Anatomy) becomes visible beneath. Canvas frame arrays are nulled to free RAM.

### Upgrade Architecture

```
Current:                          After Upgrade:
HeroSection.tsx                   HomepageCanvas.tsx
  ├── LoadingScreen.tsx             ├── LoadingScreen.tsx (progress shows frame loading)
  ├── ParticleHeroBg.tsx            ├── <canvas> (image sequence engine)
  └── SceneHero.tsx                 ├── SceneHero.tsx (IDENTICAL — reused as-is)
                                    └── Scroll container (760vh)
```

The key design decision: **SceneHero.tsx (the manifesto text overlay) is shared
between both versions.** It works identically whether the background is particles
or a pre-rendered building frame. The `isVisible` prop controls its entrance,
and the scroll-out behavior is driven by ScrollTrigger in both cases.

### Fallback Strategy

When the image sequence upgrade is active, the particle hero is preserved as
a fallback for:
- Mobile devices (`pointer: coarse` OR viewport < 1024px)
- Slow connections (`navigator.connection.effectiveType === '2g'` or `'3g'`)
- `navigator.connection.saveData === true`
- Timeout: if sequences haven't loaded within 8 seconds

### Asset Production (Higgsfield AI)

Full step-by-step Higgsfield production guide available in the original
`TDK_HOMEPAGE_EXPERIENCE_V1.md` document, Sections 4 and 5 (PART A and PART B).
This covers account setup, prompt engineering for assembly and approach sequences,
model selection (WAN 2.5 preferred), and FFmpeg frame extraction.

### Asset Processing (FFmpeg)

Frame extraction commands:
```bash
# Assembly sequence
ffmpeg -i raw-higgsfield-exports/assembly-final.mp4 \
  -vf "fps=24,scale=1920:-1" \
  -q:v 80 \
  public/sequences/assembly/frame-%04d.webp

# Approach sequence
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "fps=24,scale=1920:-1" \
  -q:v 80 \
  public/sequences/approach/frame-%04d.webp

# Hero still (first frame of approach)
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "scale=1920:-1" \
  -frames:v 1 \
  public/sequences/hero-still.webp

# Mobile video
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "scale=1080:-1" \
  -c:v libx264 -crf 28 -movflags faststart -an \
  public/videos/approach-mobile.mp4
```

### Image Sequence File Size Budget

| Sequence | Frames | Size per frame | Total budget |
|----------|--------|---------------|--------------|
| Assembly | ~120 | ~80KB | ~10MB |
| Approach | ~180 | ~90KB | ~16MB |
| Hero still | 1 | ~150KB | ~150KB |
| **Total** | **301** | | **~26MB** |

---

> **This document is the complete spec for the TDK homepage.**
> Nothing is built from guesswork. Every scene, every animation,
> every line of copy, every technical decision is documented here.
>
> When feeding this to Cursor, paste the relevant scene section
> plus Section 14 (Design Language), Section 15 (Typography),
> and Section 16 (Motion Tokens) with every prompt.
>
> The North Star remains:
> *"This is smooth. This is creative. This is amazing."*