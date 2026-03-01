# Performance Guardian — Persistent Memory

## Audited Files (confirmed state as of 2026-03-01)

### GSAP / Animation
- `src/lib/animations/gsap.ts` — exports gsap, ScrollTrigger, gsapInit, killAllScrollTriggers. Does NOT export gsapInit from the re-exports (line 24 only re-exports gsap, ScrollTrigger). Components call gsapInit() directly — this is correct (lazy plugin registration).
- `src/lib/animations/lenis.ts` — singleton Lenis, GSAP ticker-driven, destroyLenis() present. lagSmoothing(0) set correctly. ScrollTrigger.update on scroll event registered.
- `src/components/animations/SmoothScrollProvider.tsx` — calls destroyLenis on unmount. Correct.

### HomepageCanvas (`src/components/homepage/HomepageCanvas.tsx`)
- CRITICAL: No mobile detection (pointer:coarse / innerWidth<1024). Loads sequences and creates canvas on all devices unconditionally.
- CRITICAL: No navigator.connection / saveData check.
- CRITICAL: No hard 8-second timeout on sequence loading.
- Canvas array teardown confirmed: assemblyFrames.current = [] and approachFrames.current = [] both called inside thresholdST.onLeave, inside a setTimeout(300ms). canvas.style.display='none' called. This is CORRECT in concept but uses setTimeout (acceptable here since it's for the opacity fade, not frame rendering).
- Canvas pixel ratio: Math.min(devicePixelRatio, 2) — CORRECT.
- 3 ScrollTriggers created (mainST, vignetteTween.scrollTrigger, thresholdST). All killed in cleanup. CORRECT.
- HomepageCanvas is dynamic({ ssr: false }) in page.tsx — CORRECT.
- WARNING: preloadSequence() resolves after first 30 frames but BOTH sequences (assembly + approach) start loading simultaneously on mount. Total = 272 frames loaded in parallel on all devices.
- LoadingScreen has no timeout mechanism — loading screen can persist indefinitely if frames fail to load.

### SceneAnatomy (`src/components/homepage/SceneAnatomy.tsx`)
- CRITICAL: Loads a THIRD sequence (armonia-360, 65 frames) unconditionally. No mobile check. No lazy loading.
- CRITICAL: Uses `@paper-design/shaders-react` MeshGradient — this is WebGL. No mobile/capability check.
- CRITICAL: rotationFrames.current = [] is NEVER called in cleanup (useLayoutEffect return). 65 HTMLImageElement refs persist after unmount.
- Canvas DPR correctly capped at Math.min(devicePixelRatio, 2).
- 1 ScrollTrigger (stRef) killed in cleanup. CORRECT.
- RAF cancelled in cleanup. CORRECT.
- prefers-reduced-motion checked in two of three effects but NOT in the RAF rotation loop.
- WARNING: 6 elements simultaneously have CSS pulse animation (nodePulse) — GPU layer overhead.

### ScenePhilosophy (`src/components/homepage/ScenePhilosophy.tsx`)
- Uses Three.js/WebGL via InfiniteGallery (dynamic import, ssr:false). CORRECT dynamic import.
- 5 Cloudinary images at w_1920. No mobile size variants.
- 1 ScrollTrigger inside gsap.context, ctx.revert() on cleanup. CORRECT.
- ResizeObserver + rAF used for ScrollTrigger.refresh() timing. Correct.
- WARNING: No prefers-reduced-motion check on the ScrollTrigger/fade logic.
- WARNING: setTimeout(FADE_DURATION) used for state transitions — this is fine (not frame rendering).

### SceneProjects (`src/components/homepage/SceneProjects.tsx`)
- 2 Cloudinary images at w_1920 with no lazy loading (above fold for carousel).
- GSAP ctx.revert() on cleanup. CORRECT.
- `willChange: 'transform'` on strip div and each image — only 2 simultaneous elements, acceptable.
- PARALLAX: Animates img elements via `x` (transform). CORRECT — not layout properties.
- WARNING: No prefers-reduced-motion check.
- Images missing width/height attributes (CLS risk).

### SceneProcess (`src/components/homepage/SceneProcess.tsx`)
- Correct reduced-motion handling on both mobile/desktop branches.
- gsap.context + ctx.revert() — CORRECT.
- CSS sticky pinning (not GSAP pin:true) — correct approach.
- Timeline scrub animations all target transform/opacity. CORRECT.
- GRAIN: SVG-as-data-uri inline in JS. Generates a new Data URI string every render (GRAIN_URL is a module-level const so it's stable — OK).

### SceneContact (`src/components/homepage/SceneContact.tsx`)
- gsap.context + ctx.revert() — CORRECT.
- SVG background has an infinite drift tween (no ScrollTrigger) — this tween runs for the entire page lifecycle, not just when in view.
- WARNING: No prefers-reduced-motion check.
- WARNING: Infinite gsap.to (repeat:-1, yoyo:true) fires unconditionally regardless of scroll position or visibility.

### FooterClient (`src/components/layout/FooterClient.tsx`)
- ScrollTrigger with `once: true` — CORRECT (no reverse).
- gsap.context + ctx.revert() — CORRECT.
- Missing gsapInit() call before creating ScrollTrigger.

### InfiniteGallery (`src/components/ui/InfiniteGallery.tsx`)
- Three.js / @react-three/fiber. PERMITTED for post-canvas scenes.
- Fragment shader has a manual blur loop (25 texture samples per fragment). GPU-heavy.
- planeGeometry args: [1, 1, 32, 32] = 1024 triangles PER PLANE x 10 planes = 10,240 triangles. High but not extreme.
- visibleCount=10 means 10 ShaderMaterial instances, each with 25-sample blur loop.
- No WebGL capability check before initializing Canvas (done via useEffect after render).
- Keydown listener attached to document globally — not scoped to the section being visible.

## Sequence Asset Budgets (measured 2026-03-01)
- assembly: 7.5 MB / 120 frames (within 15 MB budget)
- approach: 6.0 MB / 152 frames (within 20 MB budget)
- armonia-360: 1.2 MB / 65 frames (fine)
- Largest frame: 91 KB (assembly frame-0085). All within 200 KB limit.

## Known Recurring Issues
1. No mobile detection in HomepageCanvas — sequences load on all devices
2. No connection speed detection anywhere (navigator.connection)
3. No hard loading timeout
4. SceneAnatomy loads a 3rd sequence unconditionally
5. SceneAnatomy MeshGradient is always-on WebGL
6. SceneContact infinite SVG tween runs regardless of viewport visibility
7. SceneProjects/SceneContact/ScenePhilosophy missing prefers-reduced-motion
8. rotationFrames in SceneAnatomy never nulled on cleanup
