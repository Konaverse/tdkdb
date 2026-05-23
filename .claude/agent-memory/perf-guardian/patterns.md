# Performance Patterns — Detailed Notes

## feTurbulence as CSS backgroundImage (SceneProcess)

- GRAIN_URL embeds SVG feTurbulence filter as data:image/svg+xml backgroundImage
- numOctaves=4, baseFrequency=0.9 — CPU-bound noise, not GPU-cached unless composited layer
- Grain div has no will-change, no isolation:isolate — shares layer with sticky panel
- Two grain divs in desktop layout: one sibling to sticky (bad), one in closing section
- Fix: replace with static /public/textures/grain.webp + will-change-transform on the div
- Alternative fix: render feTurbulence once to offscreen canvas on mount, extract toDataURL('image/webp'), set as backgroundImage — cost moved to mount, not per-frame

## isMobile Lazy Initialiser Pattern

Problem:
useState(false) + useEffect(() => { setIsMobile(mq.matches) }) causes:

1. Initial render with isMobile=false -> desktop layout rendered
2. useLayoutEffect(desktop) fires -> creates 4 ScrollTrigger instances + 11-tween timeline
3. useEffect fires -> setIsMobile(true)
4. Re-render -> mobile layout returned -> desktop DOM discarded
5. useLayoutEffect(desktop) fires again with isMobile=true -> returns early (no ctx)
6. ctx.revert() is NEVER called -> 4 ScrollTrigger instances leak -> fire on every Lenis scroll tick

Fix (safe for 'use client' components, they only run in browser):
const [isMobile, setIsMobile] = useState(() =>
typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
);
Keep the useEffect for the 'change' listener only.

## Scrub + ease interaction

- ease inside a scrubbed timeline affects tween's own easing relative to scroll position, not time
- power4.out inside scrub causes snap-in behavior — more expensive to evaluate than none
- For short-duration tweens (duration: 0.12) inside scrub, ease: 'none' is visually equivalent and cheaper
- opacity changes on elements without compositor promotion cause alpha updates on shared layer

## CSS sticky vs ScrollTrigger pin

- ScrollTrigger pin:true restructures the DOM, wraps element in a spacer div, sets position:fixed
- CSS position:sticky avoids that overhead entirely — browser handles compositing natively
- GSAP scrub timeline with CSS sticky: trigger=section, start='top top', end='bottom bottom'
- This is the correct pattern for SceneProcess-style scroll-scrubbed sticky panels

## will-change budget

- Project rule: flag if more than 10 elements simultaneously have will-change
- SceneProcess has 0 will-change on animated elements (missing) — should add to step divs and grain divs
- Grain divs: full-screen overlays, always present during scroll — will-change: transform is correct here
- Step divs: 5 elements animating opacity+x during scrub — will-change: transform, opacity appropriate

## Grain div placement relative to sticky

- Grain as SIBLING to sticky panel: browser composites grain + sticky as two separate layers per frame
  - If grain has feTurbulence: grain layer is dirty every frame -> main-thread repaint -> jank
- Grain as CHILD of sticky panel: both promoted to same compositor layer (sticky layer)
  - Grain rasterised once with the panel, tiled by GPU for free
  - This is the correct placement
