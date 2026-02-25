# TDK DESIGN & BUILD – HOMEPAGE EXPERIENCE
### Creative & Technical Direction Document

> **North Star:** Every person who lands on this page should feel three things in sequence:
> *"This is smooth. This is creative. This is amazing."*
>
> **Core Technique:** Higgsfield AI generates cinematic videos from the Armonia renders.
> FFmpeg extracts those videos into image sequences. GSAP ScrollTrigger draws each frame
> onto a canvas as the user scrolls — exactly how Apple does their iPhone product pages.
> The result is photorealistic quality because it IS the actual renders, not a 3D simulation.
>
> **Status:** 🔲 = Not started | 🟡 = In discussion | ✅ = Finalized

---

## TABLE OF CONTENTS

1. [Experience Overview](#1-experience-overview)
2. [Why This Approach](#2-why-this-approach)
3. [Technical Architecture](#3-technical-architecture)
4. [PART A — Asset Production (Higgsfield)](#4-part-a--asset-production-higgsfield)
5. [PART B — Asset Processing (FFmpeg)](#5-part-b--asset-processing-ffmpeg)
6. [Scene 1 — The Assembly (Load Sequence)](#6-scene-1--the-assembly-load-sequence)
7. [Scene 2 — The Hero (First Resting State)](#7-scene-2--the-hero-first-resting-state)
8. [Scene 3 — The Approach (Scroll Into the Building)](#8-scene-3--the-approach-scroll-into-the-building)
9. [Scene 4 — The Threshold (Crossing the Door)](#9-scene-4--the-threshold-crossing-the-door)
10. [Scene 5 — The Anatomy (Interactive Building Dissection)](#10-scene-5--the-anatomy-interactive-building-dissection)
11. [Scene 6 — The Philosophy (Manifesto Scroll)](#11-scene-6--the-philosophy-manifesto-scroll)
12. [Scene 7 — The Work (Projects Reel)](#12-scene-7--the-work-projects-reel)
13. [Scene 8 — The Process (How TDK Builds)](#13-scene-8--the-process-how-tdk-builds)
14. [Scene 9 — The Conversation (Contact CTA)](#14-scene-9--the-conversation-contact-cta)
15. [Scene 10 — The Footer](#15-scene-10--the-footer)
16. [Global Design Language](#16-global-design-language)
17. [Typography System](#17-typography-system)
18. [Motion & Easing Tokens](#18-motion--easing-tokens)
19. [Copy Direction](#19-copy-direction)
20. [Performance Strategy](#20-performance-strategy)
21. [Custom Cursor System](#21-custom-cursor-system)
22. [Mobile Strategy](#22-mobile-strategy)

---

## 1. EXPERIENCE OVERVIEW

This homepage is not a webpage. It is a **directed cinematic experience** — a single,
unbroken scroll journey that takes the visitor from first impression to emotional investment
to conversion. There are no sections in the traditional sense. There are **scenes**, each
with a beginning, middle, and end, connected by seamless transitions.

### The Narrative Arc

```
LOAD              HERO              APPROACH          THRESHOLD
[Building    →    [Manifesto   →    [Camera      →    [Cross the
 assembles]        appears]          pushes in]         door — white flash]

      ↓                                                       ↓

ANATOMY           PHILOSOPHY        PROJECTS          PROCESS
[Explore     →    [Manifesto   →    [Horizontal  →    [Timeline
 building]         statements]       reel]             draws]

      ↓
CONTACT → FOOTER
```

### The Two Cinematic Sequences (Image Sequences on Canvas)

Everything up to and including the Threshold crossing is driven by **two pre-rendered
video sequences**, generated in Higgsfield AI and processed into image sequences.
These sequences are drawn frame-by-frame onto an HTML5 canvas, with GSAP ScrollTrigger
controlling exactly which frame is shown based on scroll position.

**Sequence A — The Assembly**
The Armonia building assembles itself from scattered pieces into a complete structure.
Plays automatically on page load (time-based, not scroll-based).
Duration: ~120 frames at 24fps = ~5 seconds.

**Sequence B — The Approach**
The camera pushes from a wide establishing shot all the way through the entrance door,
ending in a white bloom. Fully scroll-controlled — the user's scroll speed controls
the camera speed. Every frame is a keyframe. Scrubbing is perfectly smooth.
Duration: ~180 frames at 24fps = ~7.5 seconds of footage.

Scenes 5–10 are all standard HTML/CSS/GSAP — no canvas, no video, no special rendering.

---

## 2. WHY THIS APPROACH

### The Problem With Pure Three.js

The Armonia renders were produced in professional architectural rendering software
(likely V-Ray or similar) that computed every light bounce, material reflection,
and shadow with photorealistic precision over many hours per frame.

Replicating that quality in real-time inside a browser is not achievable. Three.js
renders in real-time, which means it cannot match the lighting quality of the original
renders. There will always be a quality gap — and for TDK's positioning, that gap matters.

### The Solution: Render Once, Scrub Forever

By pre-rendering the animation in Higgsfield (which generates from the actual architectural
renders), every frame is photorealistic because it was produced from photorealistic source
material. We then control which frame the user sees based on their scroll position.

This is the exact technique Apple uses on their iPhone product pages. It is the industry
standard for cinematic scrollytelling that demands photorealistic quality.

```
Quality comparison:

Three.js real-time 3D          │  Image sequence on canvas
─────────────────────────────  │  ─────────────────────────────
Real-time computation          │  Pre-rendered frames
Approximated lighting          │  Photorealistic lighting (from renders)
~50k polygon limit             │  No polygon limit
Complex optimization required  │  Simple canvas draw call
Quality depends on GPU         │  Same quality on every device
Risk of visual inconsistency   │  Matches renders exactly
```

---

## 3. TECHNICAL ARCHITECTURE

### The Stack (Homepage Only)

```
Next.js 14 App Router (framework)
  └── /src/app/(site)/page.tsx  ← homepage, NO global navbar/footer

Canvas Layer (position: fixed, full screen, z-index 0)
  └── HTML5 <canvas> element
  └── GSAP draws image sequence frames on every scroll tick
  └── Covers ONLY the first 4 scenes (Assembly → Threshold)
  └── Hidden after Scene 4 completes, replaced by normal page flow

HTML Overlay Layer (position: fixed, z-index 10, pointer-events: none)
  └── Manifesto text fragments (Scene 2)
  └── Scroll progress indicator
  └── Loading screen

Scroll Container (position: relative, height: ~760vh)
  └── The tall div the user actually scrolls through
  └── GSAP ScrollTrigger reads this div's scroll progress
  └── Drives both canvas frame index AND HTML overlay animations

Normal Page Flow (Scenes 5–10)
  └── Standard HTML elements
  └── GSAP ScrollTrigger entrance animations
  └── No canvas, no image sequences
  └── Anatomy, Philosophy, Projects, Process, Contact, Footer
```

### File Structure (Homepage-Specific)

```
src/
  app/(site)/
    page.tsx                    ← Homepage root, no layout wrapper
  components/homepage/
    HomepageCanvas.tsx          ← Canvas + image sequence engine
    LoadingScreen.tsx           ← Loading screen component
    SceneHero.tsx               ← Manifesto text overlay (Scene 2)
    SceneAnatomy.tsx            ← Interactive building nodes (Scene 5)
    ScenePhilosophy.tsx         ← Manifesto statements (Scene 6)
    SceneProjects.tsx           ← Horizontal projects reel (Scene 7)
    SceneProcess.tsx            ← Process timeline (Scene 8)
    SceneContact.tsx            ← CTA section (Scene 9)
  lib/homepage/
    imageSequence.ts            ← Frame preloading & canvas draw utilities
    sequenceConfig.ts           ← Frame counts, scroll ranges, timing config
public/
  sequences/
    assembly/
      frame-0001.webp           ← Assembly sequence frames
      frame-0002.webp
      ... (up to ~120 frames)
    approach/
      frame-0001.webp           ← Approach sequence frames
      frame-0002.webp
      ... (up to ~180 frames)
    hero-still.webp             ← Static hero frame (approach frame 001)
```

### How Frame Scrubbing Works

```javascript
// Conceptual logic (simplified)

const assemblyFrames = []    // Array of preloaded Image objects
const approachFrames = []    // Array of preloaded Image objects

// GSAP animates a plain number object
const state = { frame: 0 }

gsap.to(state, {
  frame: approachFrames.length - 1,
  ease: 'none',              // Linear — scroll position = frame index directly
  scrollTrigger: {
    trigger: scrollContainer,
    start: 'top top',
    end: '+=150%',           // 150vh of scroll drives the entire approach
    scrub: 1,                // 1 second lag for cinematic smoothness
    onUpdate: () => {
      const i = Math.round(state.frame)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(approachFrames[i], 0, 0, canvas.width, canvas.height)
    }
  }
})
```

Every `drawImage()` call is a GPU-accelerated canvas operation.
On a modern device, this runs at 60fps with no perceptible lag.

---

## 4. PART A — ASSET PRODUCTION (HIGGSFIELD)

> This section is a complete, step-by-step guide for someone using Higgsfield for the
> first time. Follow every step in order.

### Step 0 — Account Setup

**What you need before starting:**
- The Armonia building renders (PNG or JPG files)
- Ideally: a front-facing render and a 3/4 angle render of the building
- A computer or phone with a browser

**Creating your account:**

1. Go to **higgsfield.ai** in your browser
2. Click **Sign Up** in the top right corner
3. Sign up with Google (fastest) or email
4. You will land on the main dashboard

**Understanding the credit system:**
Higgsfield runs on credits. Each video generation costs credits depending on
the model and duration. For this project, you need the **Pro plan** ($29/month)
or higher — the Basic plan ($9/month, 150 credits) will only give you 2–3
quality generations, which is not enough for the iteration you'll need.

> 💡 **Tip:** Before paying, check Higgsfield's X (Twitter) page
> (@HiggsfieldAI) — they frequently post promo codes and free credit giveaways.
> You can also get 5 free daily generations to test the interface first.

**Recommended plan for this project:** Pro ($29/month, 600 credits).
Each cinematic video generation costs roughly 40–80 credits depending on
the model. Budget for 10–15 generations across both sequences to get the
best result through iteration.

---

### Step 1 — Prepare Your Source Images

Before generating anything, prepare two source images from your Armonia renders:

**Image A — For the Assembly sequence:**
Use your best 3/4 angle render of the complete Armonia building.
- Full building visible in frame
- Dark/dramatic background (or transparent — Higgsfield handles both)
- The building should be roughly centered
- Minimum resolution: 1920×1080px
- Save as: `armonia-assembly-source.jpg`

**Image B — For the Approach sequence:**
Use your front-facing render of the Armonia building entrance.
- Building centered, entrance door clearly visible
- More sky/environment visible than in the assembly image
  (because the camera needs room to travel toward the building)
- The door should be in the center of the frame
- Minimum resolution: 1920×1080px
- Save as: `armonia-approach-source.jpg`

> 💡 **If you only have one render:** Use it for both. The AI will interpret
> the movement instructions differently for each generation regardless of
> whether the source image is the same.

---

### Step 2 — Generate the Assembly Sequence

The assembly sequence shows the Armonia building assembling itself from scattered
architectural fragments into a complete structure. It plays on load (not on scroll).

**Navigation:**
1. On the Higgsfield dashboard, click **Create** in the top navigation
2. Select **Video** from the dropdown
3. You will see a three-panel interface: configuration on the left,
   preview in the center, generation queue on the right

**Configuration — Left Panel:**

**Motion Control (first setting):**
1. Click **Change** next to the Motion Control field
2. A grid of all available camera movements appears
3. Search for or scroll to find **"3D Rotation"**
4. Select it — a small preview shows a slow orbit around an object
5. This will make the camera slowly arc around the building while
   the assembly animation happens in the AI's interpretation

> 💡 **Why 3D Rotation?** For the assembly sequence, we actually want minimal
> camera movement so the building construction is the focus. The 3D Rotation
> gives a very subtle perspective shift that makes the scene feel alive without
> distracting from the assembly effect. Alternatively try **"Static"** for
> zero camera movement — test both.

**Reference Image:**
1. Click the image upload area
2. Upload `armonia-assembly-source.jpg`
3. Wait for the thumbnail to appear in the panel

**Prompt (the text description):**
This is the most important part. Type exactly:

```
Modern white residential apartment building with clean architectural lines,
fragments and components floating in dark void space, building elements
assembling and constructing together piece by piece, architectural
visualization, dramatic studio lighting, cinematic, dark background,
photorealistic render quality, no people, no movement in the building itself
```

**Model Selection:**
Below the prompt field, you will see a model selector.
Select **WAN 2.5** — this is the best model for architectural subjects
and camera control accuracy.

> If WAN 2.5 is not available on your plan, use **Kling 2.1** as backup.
> Avoid Sora 2 for this use case — it tends to add unwanted atmospheric effects.

**Duration:**
Set to **8 seconds** (maximum available on most plans)

**Resolution:**
Set to **1080p** (1920×1080) — do not use lower

**Output format:** MP4

**Click Generate.**

Generation takes approximately 3–8 minutes. You will see a progress indicator.

**Evaluating your result:**
When the video appears, watch it and ask:
- Does the building feel like it's assembling? (Even loosely — the AI interprets this)
- Is the lighting dramatic and cinematic?
- Is the building clearly recognizable as the Armonia building?
- Is the motion relatively slow and smooth?

**If the result is poor, regenerate with these adjustments:**
- Change the prompt's first word to "Architectural visualization of a..."
- Try **Static** camera motion instead of 3D Rotation
- Try adding "slow motion" and "timelapse construction" to the prompt
- Try **Kling 2.1** model instead of WAN 2.5

**Target: get 2–3 good candidate assembly videos. Keep them all.**

---

### Step 3 — Generate the Approach Sequence

The approach sequence is the most important video in the entire project.
It shows the camera pushing forward from a wide shot of the Armonia building,
through space, and arriving right at the entrance door — almost passing through it.
The user controls this with their scroll.

**Navigation:**
Same path — Create → Video

**Motion Control:**
1. Click **Change**
2. Find and select **"Super Dolly In"**
   Description: "Smoothly moves the camera straight toward the subject for a
   focused, cinematic effect."
   This is exactly the camera push-toward-door motion we need.

> 💡 **Alternative to try:** "Through Object In" — this moves the camera
> INTO and through an object (like a door). Try both. "Super Dolly In" will
> give you a smooth approach that stops just at the door. "Through Object In"
> will try to push the camera through the door itself, which could give a
> stunning result OR a confusing one. Generate both and compare.

**Reference Image:**
Upload `armonia-approach-source.jpg`

**End Frame (optional but powerful):**
Some plans allow you to upload an "end frame" — the image the video should
end on. If available:
- Take a very tight crop of your render zoomed into the entrance door
- Upload this as the end frame
- This gives Higgsfield a target to move toward, dramatically improving
  the accuracy of the dolly movement

**Prompt:**
```
Cinematic camera slowly pushing forward toward the entrance of a modern white
residential apartment building, approaching the front door, architectural
visualization, warm amber light glowing from the entrance doorway, dramatic
exterior lighting, dusk atmosphere, photorealistic, no people, smooth camera
movement, the building fills more and more of the frame as camera approaches
```

**Model:** WAN 2.5

**Duration:** 8 seconds

**Resolution:** 1080p

**Click Generate.**

**Evaluating your result:**
- Does the camera visibly move toward the building?
- Does the building grow larger as the video progresses?
- Is there a sense of movement toward the entrance specifically?
- Does it end closer to the building than it started?
- Is the motion smooth (no jitter, no sudden jumps)?

**If results are poor, try these adjustments:**
- Add "smooth tracking shot" and "steadicam movement" to prompt
- Try **"Dolly In"** instead of "Super Dolly In" (slower, more gradual)
- Try **"FPV Drone"** for a more dynamic push (test this — might look amazing)
- Increase the specificity: "camera starts 50 meters from building,
  ends 2 meters from entrance door"

**Target: get 3–5 good approach candidates. You want the smoothest,
most dramatic dolly toward the entrance. Keep the best two.**

---

### Step 4 — Generate the Threshold Flash (Optional Enhancement)

The threshold is the white-bloom flash moment when the user "crosses" the door.
Higgsfield can generate this as a brief clip you overlay on the approach sequence.

**Motion Control:** Through Object In

**Reference Image:** A very tight crop of the Armonia entrance door only

**Prompt:**
```
Camera moving forward through an open doorway, warm golden light blooming and
filling the frame from inside, light overexposure transition, architectural
interior threshold, cinematic lens flare, white bloom effect
```

**Duration:** 3–4 seconds

This will give you a short clip you can use as the final frames of the
approach sequence — or as a CSS overlay effect. Generate once and evaluate.

---

### Step 5 — Download All Videos

For every video you want to keep:
1. Click the video in your generation history
2. Click the **Download** button (arrow icon)
3. Save with descriptive names:
   - `assembly-v1.mp4`, `assembly-v2.mp4`
   - `approach-v1.mp4`, `approach-v2.mp4`
   - `threshold-v1.mp4` (if generated)

Create a folder called `/raw-higgsfield-exports/` and put all videos there.

---

### Step 6 — Using Higgsfield's Other Tools (for other homepage assets)

While you have the platform open, you can generate other assets for the site:

**For the Philosophy section flash images (Scene 6):**
These are brief architectural detail images (timber grain, window frame, etc.)
that flash between the manifesto statements.

Go to **Create → Image** and generate:
- Close-up of timber wood grain texture, architectural, warm lighting
- Close-up of a window frame corner, white rendered concrete, sharp lines
- Hands sketching an architectural floor plan, overhead, black ink on white paper
- Interior space with dramatic light shafts through tall windows

Use model **Higgsfield Soul** or **Nano Banana Pro** for images.
These become the flash images between philosophy statements.

**For multi-angle renders (Higgsfield Angles 2.0):**
If you need additional angles of the Armonia building that weren't in the
original renders:
1. Go to **Apps → Angles 2.0**
2. Upload the best Armonia render
3. Use the 3D rotation controls to generate: bird's-eye view, side profile,
   rear view, rooftop view
4. Download any angles useful for the Projects section or interior pages

---

## 5. PART B — ASSET PROCESSING (FFMPEG)

> FFmpeg is a free, open-source command-line tool that processes video files.
> This section walks you through installation and every command you need to run,
> step by step. No prior command-line experience assumed.

### Step 1 — Install FFmpeg

**On Mac:**
1. Open Terminal (press Cmd + Space, type "Terminal", press Enter)
2. If you don't have Homebrew, install it first:
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Then install FFmpeg:
   ```
   brew install ffmpeg
   ```
4. Verify installation:
   ```
   ffmpeg -version
   ```
   You should see version information. If you do, FFmpeg is installed.

**On Windows:**
1. Go to https://ffmpeg.org/download.html
2. Under "Windows", click "Windows builds from gyan.dev"
3. Download the "ffmpeg-release-essentials.zip" file
4. Extract the zip to `C:\ffmpeg\`
5. Add FFmpeg to your system PATH:
   - Press Win + X → System → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find "Path", click Edit
   - Click New, type `C:\ffmpeg\bin`, click OK on all dialogs
6. Open a new Command Prompt and verify:
   ```
   ffmpeg -version
   ```

---

### Step 2 — Set Up Your Working Directory

In Terminal (Mac) or Command Prompt (Windows), navigate to your project folder.
Create the output directories:

**Mac:**
```bash
cd /path/to/your/project
mkdir -p public/sequences/assembly
mkdir -p public/sequences/approach
```

**Windows:**
```bash
cd C:\path\to\your\project
mkdir public\sequences\assembly
mkdir public\sequences\approach
```

Copy all your Higgsfield videos into a folder called `raw-higgsfield-exports`
inside your project root.

---

### Step 3 — Choose Your Best Videos

Before processing, watch each video one more time and pick:
- **1 assembly video** — the one with the most convincing building assembly effect
- **1 approach video** — the smoothest, most cinematic push toward the entrance

Rename your chosen files to:
- `assembly-final.mp4`
- `approach-final.mp4`

---

### Step 4 — Extract Assembly Frames

This command extracts every frame of the assembly video as a WebP image.
WebP gives you smaller file sizes than JPG with better quality — ideal for this use.

```bash
ffmpeg -i raw-higgsfield-exports/assembly-final.mp4 \
  -vf "fps=24,scale=1920:-1" \
  -q:v 80 \
  public/sequences/assembly/frame-%04d.webp
```

**What each part means:**
- `-i raw-higgsfield-exports/assembly-final.mp4` — input file
- `-vf "fps=24,scale=1920:-1"` — video filter: set output to 24 frames per second,
  scale width to 1920px (height calculated automatically to keep ratio)
- `-q:v 80` — WebP quality 0–100, 80 is a good balance of quality vs file size
- `public/sequences/assembly/frame-%04d.webp` — output pattern:
  frame-0001.webp, frame-0002.webp, etc.

After this runs, check the `public/sequences/assembly/` folder.
You should see a series of numbered WebP images.

**Count your frames:**
```bash
ls public/sequences/assembly/ | wc -l
```
A typical 8-second video at 24fps produces ~192 frames.
Note this number — you'll need it when writing the code.

---

### Step 5 — Extract Approach Frames

Same process for the approach video:

```bash
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "fps=24,scale=1920:-1" \
  -q:v 80 \
  public/sequences/approach/frame-%04d.webp
```

After running, count the frames:
```bash
ls public/sequences/approach/ | wc -l
```

---

### Step 6 — Extract the Hero Still

The hero still is a single frame — the first frame of the approach sequence —
used as a static fallback image and as the "resting" state after the assembly completes.

```bash
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "scale=1920:-1" \
  -frames:v 1 \
  public/sequences/hero-still.webp
```

This extracts the very first frame of the approach video as a single WebP.

---

### Step 7 — Verify Your File Sizes

Check your total sequence file sizes:

**Mac:**
```bash
du -sh public/sequences/assembly/
du -sh public/sequences/approach/
```

**Windows:**
```bash
dir public\sequences\assembly\ /s
dir public\sequences\approach\ /s
```

**Target sizes:**
- Assembly sequence: under 15MB total
- Approach sequence: under 20MB total

If your sizes are too large, reduce the WebP quality:
Change `-q:v 80` to `-q:v 65` and re-run. Test quality vs file size until
you find a balance that looks good and loads fast.

---

### Step 8 — Record Your Frame Counts

Open `/src/lib/homepage/sequenceConfig.ts` and fill in the exact numbers:

```typescript
export const SEQUENCE_CONFIG = {
  assembly: {
    frameCount: 192,          // ← replace with your actual count
    fps: 24,
    path: '/sequences/assembly/frame-',
    extension: '.webp',
  },
  approach: {
    frameCount: 180,          // ← replace with your actual count
    fps: 24,
    path: '/sequences/approach/frame-',
    extension: '.webp',
  },
} as const
```

---

## 6. SCENE 1 — THE ASSEMBLY (LOAD SEQUENCE)

**Type:** Time-based animation (not scroll-driven)
**Duration:** ~5 seconds
**Source:** Assembly image sequence, played frame-by-frame via requestAnimationFrame

### What the User Sees

The page loads. A minimal loading screen appears briefly (1–2 seconds maximum)
with a thin progress line filling left to right. As soon as enough frames are
preloaded, the loading screen fades and the assembly animation begins.

The Armonia building assembles on a pure dark (`--color-void: #0D0D0D`) background.
Architectural fragments drift in from the edges and coalesce into the complete
building. The final frame settles into the hero still — the full building,
centered, slightly to the right, at a 3/4 angle.

The assembly plays at its natural pace (24fps, time-based). The user cannot
scroll during assembly — a CSS `overflow: hidden` on the body prevents it
until the animation completes.

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
- Fills in proportion to frames loaded (0% = empty, 100% = full)
- When preloading completes: "TDK" fades out (opacity 0, 400ms)
- Then loading screen fades out (opacity 0, 500ms)
- Assembly animation begins immediately after

### Technical Implementation Notes

```typescript
// Preloading strategy
// Load first 30 frames immediately (enough to start playing)
// Load remaining frames in background while assembly plays

async function preloadSequence(config, onProgress) {
  const images = new Array(config.frameCount)
  let loaded = 0

  // Helper to load a single frame
  const loadFrame = (i) => new Promise((resolve) => {
    const img = new Image()
    const num = String(i + 1).padStart(4, '0')
    img.src = `${config.path}${num}${config.extension}`
    img.onload = () => {
      images[i] = img
      loaded++
      onProgress(loaded / config.frameCount)
      resolve()
    }
  })

  // Load first 30 frames immediately, rest lazily
  await Promise.all(Array.from({ length: 30 }, (_, i) => loadFrame(i)))
  // Background load remaining frames (no await)
  Array.from({ length: config.frameCount - 30 }, (_, i) => loadFrame(i + 30))

  return images
}
```

### Assembly Playback (Time-Based RAF Loop)

```typescript
// After loading screen fades:
let startTime = null
const ASSEMBLY_DURATION = 5000 // 5 seconds in ms

function playAssembly(frames, canvas, ctx) {
  function tick(timestamp) {
    if (!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / ASSEMBLY_DURATION, 1)
    const frameIndex = Math.floor(progress * (frames.length - 1))

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (frames[frameIndex]) {
      ctx.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height)
    }

    if (progress < 1) {
      requestAnimationFrame(tick)
    } else {
      // Assembly complete — unlock scroll, show hero text
      onAssemblyComplete()
    }
  }
  requestAnimationFrame(tick)
}
```

### On Assembly Complete

When the assembly finishes:
1. `document.body.style.overflow = 'auto'` — unlock scrolling
2. The hero manifesto text fragments fade in (Scene 2 begins)
3. The canvas remains on screen showing the final assembled building frame
4. The GSAP ScrollTrigger for Scene 3 (approach) is now active

---

## 7. SCENE 2 — THE HERO (FIRST RESTING STATE)

**Type:** Static resting state with mouse parallax
**Scroll:** None yet — user has not scrolled
**Duration:** Until user begins scrolling
**Source:** Canvas shows final frame of assembly (= first frame of approach sequence)

### What the User Sees

The complete Armonia building is on screen. Manifesto text fragments appear
around the building in an editorial layout — not centered, not aligned, but
deliberately placed as if floating in architectural space.

```
                                            "DESIGNED TO LAST."
                                            [top right, 48px, light]

"NOT JUST BUILT.
 CRAFTED."
[top left, 32px]

                  [building sits center-right]

"Every line has a reason."
[mid left, italic, 24px]
                                            TDK DESIGN & BUILD
                                            [bottom right, text-label]

                    ↓ SCROLL
                    [bottom center, subtle bounce]
```

### Text Appearance Animation

Each fragment appears via clip-path reveal after assembly completes,
with staggered delays:

| Fragment | Delay | Duration | Effect |
|----------|-------|----------|--------|
| "DESIGNED TO LAST." | 200ms | 700ms | clip-path left→right reveal |
| "NOT JUST BUILT. CRAFTED." | 400ms | 700ms | clip-path left→right reveal |
| "Every line has a reason." | 600ms | 600ms | fade + translateY 20px→0 |
| "TDK DESIGN & BUILD" | 700ms | 500ms | fade in |
| Scroll indicator | 900ms | 400ms | fade in |

### Mouse Parallax

Each fragment drifts subtly with cursor movement.
Every fragment has a `data-depth` value between `0.01` and `0.03`.
On `mousemove`: `translateX = cursorDeltaX * depth`, `translateY = cursorDeltaY * depth`
Use GSAP `quickSetter` for performance — no layout thrashing.
Effect is subtle. Should feel like the text is floating in the same space as the building,
slightly closer to the camera.

### Scroll-Out Behavior

As soon as scroll begins (Scene 3 starts), the hero text fades and moves outward:
Each fragment translates away from center + fades to opacity 0.
Driven by GSAP ScrollTrigger scrub over the first 30% of the approach scroll distance.

### Scroll Indicator

```
  SCROLL
    │
    │  (line pulses downward in a looping mask animation)
    ↓
```

Disappears (opacity 0, instant) when user first scrolls more than 50px.

---

## 8. SCENE 3 — THE APPROACH (SCROLL INTO THE BUILDING)

**Type:** Scroll-driven image sequence scrubbing
**Scroll distance:** 150vh of the scroll container
**Source:** Approach image sequence, drawn to canvas frame-by-frame

### What the User Sees

As the user scrolls down, the camera appears to move toward the Armonia building.
The building grows larger in the frame. The entrance door becomes the singular focus.
The frame edges darken (vignette). The scroll controls the camera speed exactly —
scroll faster, camera moves faster. Pause scrolling, camera pauses.

At the end of the 150vh scroll: the camera is right at the entrance. The door fills
much of the frame. A warm amber light pulses from the entrance. The screen is about
to bloom.

### GSAP ScrollTrigger Configuration

```typescript
gsap.to(approachState, {
  frame: approachFrames.length - 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '#scroll-container',
    start: 'top top',      // starts when scroll container hits top of viewport
    end: '+=150%',         // 150vh of scroll distance
    scrub: 1.5,            // 1.5 second lag = smooth, cinematic feel
    onUpdate: (self) => {
      const i = Math.round(approachState.frame)
      drawFrame(approachFrames[i])
    }
  }
})
```

### CSS Vignette Overlay

A full-screen div (`position: fixed`, `pointer-events: none`, `z-index: 5`):
`background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)`
Opacity starts at 0.2, increases to 0.8 as scroll progresses through this scene.
Driven by the same ScrollTrigger via a separate GSAP scrub on opacity.

### Entrance Light Effect

At 60% scroll progress through Scene 3:
A small warm radial glow begins to appear at the center of frame where the entrance is.
This is a CSS `position: fixed` div with:
`background: radial-gradient(circle at center, rgba(245,166,35,0.15) 0%, transparent 60%)`
Starts invisible, fades in over the remaining 40% of scroll progress.
Signals to the user: "there is light inside. you are almost there."

---

## 9. SCENE 4 — THE THRESHOLD (CROSSING THE DOOR)

**Type:** Scroll-triggered transition, 20vh of scroll
**Source:** CSS effect on top of canvas (no new frames)
**Purpose:** The cinematic moment of crossing from exterior to interior

### What the User Sees

At the end of the approach scroll, the user pushes slightly further.
A radial bloom of warm amber light erupts from the center of the screen.
The light expands until it fills ~90% of the screen in near-white.
The last approach frame is held on canvas during this bloom.

Then the bloom recedes. The canvas fades out. The first static
element of Scene 5 (the Anatomy section) is now visible beneath.

### The Bloom Effect

A full-screen fixed div with `z-index: 20`:

```css
.threshold-bloom {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 55%,    /* slightly below center = door position */
    rgba(245, 166, 35, 0) 0%,
    rgba(255, 248, 230, 0) 0%
  );
  opacity: 0;
}
```

GSAP ScrollTrigger (20vh scroll range):
- 0% → 50%: bloom expands, center color → rgba(245,166,35,0.9), outer → rgba(255,253,247,0.95)
- 50%: peak — near white screen
- 50% → 100%: bloom recedes, opacity returns to 0
- At 50% mark: canvas display set to none, Scene 5 becomes visible

### Canvas Hide

```typescript
ScrollTrigger.create({
  trigger: '#threshold-scroll',
  start: 'top top',
  end: '+=20%',
  onLeave: () => {
    // Hide canvas
    canvas.style.opacity = '0'
    canvas.style.transition = 'opacity 0.3s'
    // Unlock Scene 5
    document.getElementById('scene-anatomy').style.visibility = 'visible'
  }
})
```

After this point, the canvas is no longer needed.
The rest of the page is standard HTML scroll.

---

## 10. SCENE 5 — THE ANATOMY (INTERACTIVE BUILDING DISSECTION)

**Type:** Pinned HTML section, hover-interactive
**Scroll distance:** 100vh (pins for the duration)
**Source:** Static Armonia front-facing render (PNG/WebP) as regular `<img>`

### What the User Sees

The page transitions from the cinematic canvas to a static split-screen layout.
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
- Outer ring: `--color-threshold` (#F5A623), scale transition to 1.2x
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
- Amber line: 2px, `--color-threshold`, 40px wide, slides in from left
- Heading: slides in from below (translateY(30px)→0, opacity 0→1, 350ms)
- Body copy: slides in 80ms after heading

**On hover end:**
- Content exits downward, default state returns

### Unpin Trigger

After user has hovered at least 3 nodes, OR after 10 seconds of dwell time:
A "↓ CONTINUE" prompt appears at bottom center (text-label, animated in gently).
On next scroll action: section unpins, normal scroll resumes.

---

## 11. SCENE 6 — THE PHILOSOPHY (MANIFESTO SCROLL)

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
- This statement does NOT exit — it lingers as the user scrolls into Scene 7

---

## 12. SCENE 7 — THE WORK (PROJECTS REEL)

**Type:** Horizontal scroll driven by vertical scroll
**Scroll distance:** 150vh
**Background:** Transitions from `--color-void` to `#111111`

### What the User Sees

A section heading "THE WORK" fades in as Scene 6 ends.
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
- Subtle amber glow on the image (very faint radial gradient, threshold color)
  — signals this is active and available, not just historical

**How CTA type is determined:**
The card reads `project.ctaType` from Sanity:
- `showcase` → "VIEW PROJECT →"
- `register-interest` → "REGISTER INTEREST →"
- `contact` → "ENQUIRE →"

Future projects appear automatically as new cards when published in Sanity.

---

## 13. SCENE 8 — THE PROCESS (HOW TDK BUILDS)

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

## 14. SCENE 9 — THE CONVERSATION (CONTACT CTA)

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
  (the period and the word have a warm amber tint — subtle but intentional)

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

## 15. SCENE 10 — THE FOOTER

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

## 16. GLOBAL DESIGN LANGUAGE

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-void` | `#0D0D0D` | Primary background, main canvas |
| `--color-surface` | `#1A1A1A` | Secondary backgrounds, cards |
| `--color-paper` | `#F5F0E8` | All primary text, default cursor |
| `--color-stone` | `#8C8C8C` | Secondary text, labels, metadata |
| `--color-threshold` | `#F5A623` | Accent only — active nodes, CTA hover, numbers, "TOGETHER." |
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

## 17. TYPOGRAPHY SYSTEM

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

## 18. MOTION & EASING TOKENS

### Easing

| Token | Value | When to use |
|-------|-------|-------------|
| `--ease-smooth` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for most UI transitions |
| `--ease-entrance` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements arriving into view |
| `--ease-exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements leaving view |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Magnetic button release, node expand |
| `--ease-cinematic` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Image sequence scrub lag |

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
| `scrub: 1` | Slightly smooth | Image sequence scrubbing |
| `scrub: 1.5` | Cinematic lag | Camera approach feel |
| `scrub: 2` | Very smooth | Slow-moving parallax elements |

---

## 19. COPY DIRECTION

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

**Scene 6 — Philosophy Statements**
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

**Scene 7 — Projects Reel (Armonia card)**
```
01
ARMONIA APARTMENTS
Lakatameia, Nicosia · 2025 · Residential
[VIEW PROJECT →]
```

**Scene 8 — Process Steps**
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

**Scene 9 — Contact CTA**
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

## 20. PERFORMANCE STRATEGY

### Loading Priority

```
Priority 1 (blocks render):
  └── Base CSS, loading screen HTML
  └── Josefin Sans 300 weight (preloaded)
  └── hero-still.webp (preloaded via <link rel="preload"> in <head>)
  └── First 30 frames of assembly sequence

Priority 2 (loads during assembly animation):
  └── Remaining assembly frames
  └── All approach frames (~180)

Priority 3 (lazy, loads below fold):
  └── Anatomy section render image (Cloudinary)
  └── Philosophy flash images (Cloudinary)
  └── Project card images — Armonia + Almond (Cloudinary)
  └── JetBrains Mono font
```

### Preload Hero Still
```html
<!-- In Next.js <Head> for the homepage -->
<link rel="preload" as="image" href="/sequences/hero-still.webp" />
```
This ensures something visually meaningful renders immediately, even if
the full assembly sequence isn't loaded yet.

### Connection Speed Detection
```typescript
// On mount in HomepageCanvas.tsx
const connection = (navigator as any).connection
const isSlowConnection =
  connection?.effectiveType === '2g' ||
  connection?.effectiveType === '3g' ||
  connection?.saveData === true

const isMobile = window.matchMedia('(pointer: coarse)').matches ||
                 window.innerWidth < 1024

if (isSlowConnection || isMobile) {
  // Skip canvas entirely — serve mobile video experience
  setUseMobileVideo(true)
  return
}
```
On 2G/3G or with Save-Data enabled, the full 26MB sequence would be a terrible
experience. Serve the MP4 video fallback in this case, even on desktop.

### Hard Timeout (8 Seconds)
```typescript
// If sequences haven't loaded within 8 seconds:
const timeout = setTimeout(() => {
  if (!sequencesReady) {
    // Skip loading screen — show hero still as static image
    setShowHeroStill(true)
    setLoadingComplete(true)
    // Sequences continue loading in background
    // ScrollTrigger will activate once approach frames are ready
  }
}, 8000)
```
This prevents the site being permanently blocked behind a loading screen
on slow connections that somehow bypass the connection detection.

### Vercel Edge Caching for Sequences
```json
// vercel.json
{
  "headers": [
    {
      "source": "/sequences/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```
Sequence files never change once generated. Cache forever at the CDN edge.
On repeat visits: zero download time for sequences.
If sequences are regenerated: change the filenames (or add a version suffix).

### Image Sequence File Size Budget

| Sequence | Frames | Size per frame | Total budget |
|----------|--------|---------------|--------------|
| Assembly | ~120 | ~80KB | ~10MB |
| Approach | ~180 | ~90KB | ~16MB |
| Hero still | 1 | ~150KB | ~150KB |
| **Total** | **301** | | **~26MB** |

> 26MB sounds large. It is not. Apple's iPhone scrollytelling sequence
> loads ~35MB. On modern broadband: 2–3 seconds. On mobile WiFi: 4–6 seconds.
> This is exactly why the loading screen exists.

### Reducing File Size If Needed

1. Reduce WebP quality from 80 → 65 (re-run FFmpeg with `-q:v 65`)
2. Scale frames to 1280px wide instead of 1920px
3. Drop to 20fps instead of 24fps (fewer frames, slightly less smooth)

### Cloudinary for All Non-Sequence Images

All project photography and renders (Scene 5 anatomy image, Scene 7 project cards,
etc.) are served from Cloudinary with automatic optimization:
- `f_auto` — WebP/AVIF per browser
- `q_auto` — optimal quality per image
- `w_[size]` — correct dimensions, never oversized

This means below-fold images are not your performance bottleneck.
The sequences are the only heavy assets — and they are managed above.

### Canvas Rendering Performance

- Canvas GPU-accelerated via `will-change: transform`
- Only `clearRect` + `drawImage` per tick — minimal operations
- Canvas hidden (`display: none`) after Scene 4 → frees GPU memory
- Frame arrays nulled after Scene 4 → frees RAM (~26MB returned to browser)

### Lighthouse Targets

| Page | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Homepage | > 80 | > 65 | Lower acceptable — sequence preloading |
| Almond | > 90 | > 75 | Photo slider, Cloudinary optimized |
| All other pages | > 90 | > 80 | Standard Next.js SSG |

---

## 21. CUSTOM CURSOR SYSTEM

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
| Hover | `data-cursor="hover"` on buttons/links | Expands to 40px, fills threshold amber |
| Node | `data-cursor="node"` on anatomy nodes | Expands to 60px, crosshair lines appear |
| View | `data-cursor="view"` on project images | Expands to 80px, "VIEW" text inside |
| Scroll | During active scroll/image sequence | Shrinks to 6px solid dot |

### Magnetic Buttons

All primary CTA buttons have magnetic behavior:
- Detect mouse within 80px radius
- Apply `translateX/Y` to move button max 12px toward cursor
- On mouse leave: spring return using `--ease-spring`
- Only on `pointer: fine` devices (not touch)

---

## 22. MOBILE STRATEGY

### The Problem

The image sequence scrubbing approach depends on JavaScript preloading
hundreds of images and drawing them to canvas on scroll. On mobile:
- Storage is more limited
- Scroll behavior is different (momentum-based, not discrete)
- Touch scrubbing of image sequences can feel laggy on older devices

### The Solution: Autoplay Video

On mobile (`pointer: coarse` media query OR viewport width < 1024px):

1. **Hide the canvas entirely** — `display: none`
2. **Show an autoplay video instead** — the approach video from Higgsfield
   (`approach-final.mp4`), plays once on load, pauses on the final frame
3. **No scroll-jacking** — standard scroll behavior throughout
4. **Anatomy section** — nodes become a tap-through card stack (swipeable)
5. **All other sections** — identical to desktop, just adapted layout

### Mobile Video Specification

Use the Higgsfield-generated `approach-final.mp4` directly.
No FFmpeg processing needed — just use the raw export.

```html
<video
  autoPlay
  muted
  playsInline
  preload="auto"
  onEnded={(e) => e.target.pause()}
>
  <source src="/videos/approach-mobile.mp4" type="video/mp4" />
</video>
```

The video plays once, showing the full cinematic approach to the building.
It then pauses on the final frame. The rest of the page scrolls normally below it.

### Mobile Asset

Add to FFmpeg processing (Step 4 in PART B):
```bash
# Create a compressed mobile version of the approach video
ffmpeg -i raw-higgsfield-exports/approach-final.mp4 \
  -vf "scale=1080:-1" \
  -c:v libx264 \
  -crf 28 \
  -movflags faststart \
  -an \
  public/videos/approach-mobile.mp4
```

Target size: under 8MB. The `-crf 28` setting ensures good compression
without visible quality loss at mobile screen sizes.

---

> **This document is the complete spec for the TDK homepage.**
> Nothing is built from guesswork. Every scene, every animation,
> every line of copy, every technical decision is documented here.
>
> When feeding this to Cursor, paste the relevant scene section
> plus Section 16 (Design Language), Section 17 (Typography),
> and Section 18 (Motion Tokens) with every prompt.
>
> The North Star remains:
> *"This is smooth. This is creative. This is amazing."*
