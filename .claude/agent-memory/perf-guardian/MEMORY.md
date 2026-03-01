# Performance Guardian — Persistent Memory

## Confirmed Compliant Implementations
- `src/lib/animations/gsap.ts` — gsapInit() idempotency guard confirmed correct; exports { gsap, ScrollTrigger, gsapInit }
- `src/lib/animations/lenis.ts` — Lenis destroy() on cleanup confirmed; lagSmoothing(0) set; ScrollTrigger.update bridge confirmed
- `src/app/[locale]/(site)/page.tsx` — HomepageCanvas correctly behind dynamic({ ssr: false }). SceneProcess imported directly (server component shell, client boundary inside SceneProcess itself).
- `src/components/homepage/SceneProcess.tsx` — gsap.context() + ctx.revert() cleanup confirmed correct. prefers-reduced-motion checked in both desktop and mobile paths. IntersectionObserver cleanup confirmed (disconnect on fire + cleanup fn). CSS sticky used instead of ScrollTrigger pin (correct, avoids DOM restructure).

## Confirmed Issues / Recurring Patterns
- **feTurbulence as CSS backgroundImage data URI**: SceneProcess uses SVG feTurbulence embedded as backgroundImage. This re-evaluates the filter on every paint. Fix: replace with static /public/textures/grain.webp.
- **isMobile lazy initialiser antipattern**: Using useState(false) + useEffect for mobile detection causes false-desktop render on first paint. useLayoutEffect runs before mobile detection fires, creates ScrollTrigger instances that are never cleaned up (ctx.revert() is skipped when isMobile becomes true because the effect returns early). Fix: useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches)
- **Grain div placement relative to sticky panel**: Grain sibling to sticky panel forces cross-layer composite. Grain should be a child of the sticky panel to be promoted together.
- **ScrollTrigger named import missing**: SceneProcess imports { gsap, gsapInit } but not ScrollTrigger. Required by project GSAP import rule.

## ISR Revalidation Values (confirmed)
- Projects pages: revalidate = 60
- Insights pages: revalidate = 300
- Static pages: no revalidate (fully static)
- CLAUDE.md says static pages should be revalidate: 3600 — CONTRADICTS system prompt which says "no revalidate (fully static)". The CLAUDE.md is the authority: static pages use revalidate: 3600.

## Canvas / Scene Architecture
- HomepageCanvas: dynamic({ ssr: false }) — confirmed compliant
- Canvas teardown (Scene 4): arrays nulled — confirmed in architecture notes
- Scenes 5+: Three.js / R3F permitted, must be dynamic({ ssr: false })

## GSAP Patterns (confirmed correct in codebase)
- All animations in useLayoutEffect with gsap.context() + ctx.revert() cleanup
- Import always from @/lib/animations/gsap, never bare 'gsap'
- CSS sticky preferred over ScrollTrigger pin: true (avoids DOM restructure overhead)
- IntersectionObserver used for mobile reveals (not ScrollTrigger) — correct

## Detailed Notes
- See patterns.md for grain/feTurbulence fix details and isMobile initialiser pattern
