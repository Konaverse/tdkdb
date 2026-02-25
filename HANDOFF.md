# TDK Design & Build — Chat Handoff Document

> **Purpose:** Feed this to a new Cursor chat/agent so it picks up exactly where the previous session left off.
> **Last updated:** 2026-02-26

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

---

## 3. WHERE TO START — Next Phase

### → Phase 3 — Global Components (Prompts 3.1 – 3.5)

Start with **Prompt 3.1 — Navbar** (line 721 in `TDK_CURSOR_BUILD_STRATEGY.md`).

Phase 3 covers:
- 3.1 — Navbar (fixed, transparent → blurred on scroll, EN|EL switcher with EL disabled)
- 3.2 — Footer (full sitemap, social links, contact info)
- 3.3 — Button component (magnetic hover effect)
- 3.4 — Reusable animation wrappers (FadeUp, TextReveal, StaggerGroup, CountUp)
- 3.5 — Grid & layout utilities

**Pre-requirement for Phase 3:** Favicon files are already in `/src/app/`. Logo SVGs are in `public/images/` (`tdk-logo-light.svg` for dark backgrounds, `tdk-logo-dark.svg` for light backgrounds). A `manifest.ts` still needs to be created.

---

## 4. KEY DECISIONS & DEVIATIONS TO KNOW

| Topic | Decision |
|---|---|
| **Accent color** | Changed from amber `#F5A623` to teal/slate blue `#66979f`. All three planning docs updated. |
| **Font variable naming** | Next.js font variable for JetBrains Mono is `--font-jetbrains` (not `--font-mono`) to avoid circular CSS reference. Design token `--font-mono` references `var(--font-jetbrains)`. |
| **ScrollSmoother** | Not used — it's a paid GSAP Club plugin. Lenis handles smooth scrolling instead. |
| **Lenis package** | Using `@studio-freight/lenis@1.0.42` (old package name, still works). |
| **Sanity versions** | `sanity@3`, `next-sanity@9`, `@sanity/client@7` — compatible with Next.js 14 / React 18. |
| **Image sequences** | Assembly: 40 WebP frames (2.4 MB). Approach: 52 WebP frames (2.32 MB). Hero still + mobile MP4 generated. All in `public/sequences/` and `public/videos/`. |
| **i18n routing** | English at `/en/` (not root `/`). Middleware redirects `/` → `/en/`. Greek `/el/` scaffolded but disabled. |
| **Homepage test page** | `src/app/[locale]/(site)/page.tsx` currently has a typography test page — will be replaced when building the actual homepage in Phase 4. |

---

## 5. PROJECT LOCATION

```
C:\Users\konst\Projects\TDK_Design_&_Build\tdkdb\
```

---

## 6. HARD RULES (Remind the AI)

1. **No Three.js** — homepage uses HTML5 canvas + image sequences
2. **No Framer Motion** — GSAP only, always
3. **No Sanity native images** — all images are Cloudinary IDs stored as strings
4. **`SANITY_API_TOKEN` must NEVER have `NEXT_PUBLIC_` prefix**
5. **Email addresses from env vars** — never hardcoded
6. **One prompt = one component**
7. **Commit after every prompt** — `feat: Phase X.Y — description`
