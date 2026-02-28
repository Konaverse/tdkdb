---
name: tdk-frontend
description: Build frontend components and pages for TDK Design & Build — a Cypriot residential developer with a cinematic, dark, architectural aesthetic. Use when building any UI for the tdkdb.com website: components, pages, animations, or interactive sections.
---

This skill governs all frontend work for TDK Design & Build. Every component, page, and animation must feel like it belongs to a single, unhurried, cinematic whole. The standard is not "looks good" — it is "this is smooth, this is creative, this is amazing."

## The Aesthetic

**Cinematic Architectural Minimalism.** Dark. Considered. Rectilinear. Motion that earns itself.

This is not a brand that decorates. It is a brand that makes decisions. Every pixel on screen must have a reason. If it doesn't, remove it. Restraint is the craft. What you don't show is as intentional as what you do.

The visual world is near-black backgrounds, warm paper-white text, and one amber accent that arrives like a signal. Nothing competes with it. When `--color-threshold` appears, everything else steps back.

## Design Tokens — Use These. Never Deviate.

**Colors:**
```css
--color-void:      #0D0D0D   /* Primary background — near-black, not pure black */
--color-surface:   #1A1A1A   /* Cards, secondary backgrounds */
--color-paper:     #F5F0E8   /* Primary text — warm white, never #FFFFFF */
--color-stone:     #8C8C8C   /* Secondary text, labels, metadata */
--color-threshold: #66979f   /* The accent. One element at a time. */
--color-glass:     rgba(255,255,255,0.04)  /* Subtle overlays */
--color-border:    rgba(255,255,255,0.08)  /* Lines, dividers */
```

**The Threshold Rule:** `--color-threshold` appears on only ONE interactive element at a time. Never use it on two things simultaneously visible on screen. It is the color of attention. It must arrive like a signal.

**Typography:**
```css
--font-primary: 'Josefin Sans', sans-serif   /* Weights: 300, 400, 600 */
--font-mono:    'JetBrains Mono', monospace  /* Numbers only */
```

**Type Scale:**
| Class | Size | Weight | Usage |
|---|---|---|---|
| `.text-display-xl` | clamp(64px, 8vw, 120px) | 300 | Hero-level display |
| `.text-display-lg` | clamp(48px, 6vw, 96px) | 300 | Scene headings |
| `.text-display-md` | clamp(36px, 4vw, 64px) | 400 | Sub-headings |
| `.text-heading`    | clamp(24px, 3vw, 40px) | 600 | Section headings |
| `.text-body-lg`    | 18px | 300 | Large body copy |
| `.text-body`       | 16px | 400 | Standard body copy |
| `.text-label`      | 11px | 600 | ALL CAPS labels, nav, counters — tracked 0.2em |
| `.text-mono`       | 13px | 400 | Numbers (JetBrains Mono only) |

**Typography Rules — Non-negotiable:**
- Display weights are always 300 (Light). Heaviness at scale feels aggressive, not confident.
- Labels are always uppercase and tracked. Never write sentences in `text-label`.
- Body copy is never centered. Left-align all paragraphs.
- No italics anywhere in the UI.
- `text-mono` is for numbers only. Never write words in monospace.
- Maximum text column width: 680px.

**Motion Tokens:**
```css
--ease-smooth:    cubic-bezier(0.16, 1, 0.3, 1)       /* Default for most UI transitions */
--ease-entrance:  cubic-bezier(0.0, 0.0, 0.2, 1)      /* Elements arriving into view */
--ease-exit:      cubic-bezier(0.4, 0.0, 1, 1)        /* Elements leaving view */
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1)   /* Magnetic release, node expand */
--ease-cinematic: cubic-bezier(0.25, 0.46, 0.45, 0.94) /* Image sequence scrub lag */

--duration-instant:   150ms   /* Hover color changes, opacity flickers */
--duration-fast:      300ms   /* Button states, cursor transitions */
--duration-medium:    500ms   /* Panel slides, text transitions */
--duration-slow:      800ms   /* Section entrance, text reveals */
--duration-cinematic: 1200ms  /* Full-screen transitions */

--stagger-tight:  40ms    /* Word-by-word reveals */
--stagger-normal: 80ms    /* List items, nav links */
--stagger-loose:  120ms   /* Card grids, process steps */
```

**GSAP equivalents (always use these — never CSS animation on scroll-driven elements):**
- `--ease-smooth` → `"power4.out"`
- `--ease-spring` → `"back.out(1.7)"`
- `--ease-cinematic` → `"power1.inOut"`

**Spacing:**
```css
--space-unit:       8px
--section-padding:  clamp(80px, 10vw, 160px)
--content-max:      1440px
--text-max:         680px
```

**Shape:** Zero border-radius. Everywhere. No exceptions. Architecture is rectilinear.

**Shadows:** None. Depth is created through color, opacity, and layering only.

## Animation — The Standard

Motion is narrative, not decoration. Every animation must have a reason and a direction of meaning.

**The standard entrance:** Elements arrive via `clip-path: inset(0 100% 0 0) → inset(0 0% 0 0)` (text reveals) or `opacity: 0, translateY: 40px → 0` (element reveals). Never `scale`. Never `rotate`. Never anything that doesn't feel architectural.

**ScrollTrigger is the tool for scroll-driven animations.** Always initialize GSAP via `gsapInit()` from `/src/lib/animations/gsap.ts`. Always check `prefers-reduced-motion` before registering scroll animations — skip or reduce if true. Always kill ScrollTrigger instances in the cleanup function.

**Stagger with intention.** When animating groups, stagger using `--stagger-normal` (80ms) for lists, `--stagger-loose` (120ms) for cards. Stagger should feel like the elements are acknowledging each other's presence, not being flicked into existence one at a time.

**The custom cursor.** All pages use a custom cursor: a 12px circle, `border: 1px solid var(--color-paper)`, transparent fill, following the mouse via GSAP `quickTo` with a 0.3s lag. Never implement cursor animations with CSS transitions — GSAP `quickTo` is the only approach that achieves the right spring feel. Cursor states:
- Default: 12px circle
- Hover (`data-cursor="hover"`): 40px, fills threshold teal
- View (`data-cursor="view"`): 80px, "VIEW" text inside
- Scroll: 6px solid dot

**Magnetic buttons.** All primary CTAs detect mouse within 80px radius and move up to 12px toward the cursor. On leave, spring return using `--ease-spring`. Only activate on `pointer: fine` devices.

## Component Standards

**Buttons** — three variants only:
- **Primary:** `--color-paper` background, `--color-void` text. Hover → `--color-threshold` background. Arrow icon translates 4px right on hover.
- **Ghost:** transparent, `--color-border` border. Hover → `--color-paper` border.
- **Text:** no background, no border. `--color-stone` text, hover → `--color-paper`. Underline sweep on hover.

All buttons: `text-label` style (uppercase, tracked). Padding: 16px 32px. Render as `<a>` when an `href` is provided.

**Images** — all served from Cloudinary via the `cloudinaryUrl()` utility in `/src/lib/cloudinary/transforms.ts`. Never use hardcoded Cloudinary URLs. Never use Next.js `<Image>` for photography or renders — Cloudinary handles optimization with `f_auto,q_auto`. Use `f_auto` (automatic WebP/AVIF) and `q_auto` always.

**Image sequences (homepage canvas only)** — served as static WebP frames from `/public/sequences/`. Never upload to Cloudinary. Always wrapped in `dynamic(() => import(...), { ssr: false })`. Always check `prefers-reduced-motion` and connection speed before activating.

## What Never Belongs Here

- `three` / `@react-three/fiber` — never. The canvas approach uses HTML5 canvas + pre-rendered image sequences.
- Framer Motion — never. GSAP only.
- `border-radius` — never, anywhere.
- `box-shadow` — never.
- Purple gradients, glass morphism, neon glows, confetti, particles.
- Inter, Roboto, Arial, or any system font for display use.
- Stock photography.
- Centered body copy.
- Italics (except the single "Every line has a reason." fragment in Scene 2).
- `--color-threshold` on more than one visible element at a time.

## The Voice (for any copy in components)

Architectural authority with human warmth. Short sentences. Specific beats general. Numbers are credibility. No superlatives — never "the best", "world-class", "exceptional". Never passive voice.

**Say:** "The balconies face south-southwest. Natural light from morning to dusk."  
**Never say:** "Our exceptional balconies provide stunning outdoor living experiences."

## Technical Constraints

- **Framework:** Next.js 14+ App Router, TypeScript strict mode
- **Styling:** Tailwind CSS with TDK design tokens extended in `tailwind.config.ts`
- **Animation:** GSAP + ScrollTrigger only
- **Smooth scroll:** Lenis (`@studio-freight/lenis`)
- **Images:** Cloudinary for all photography/renders; Vercel static for sequences
- **CMS data:** Sanity — fetch in server components where possible; use GROQ with typed responses
- **Naming:** Components PascalCase, utilities camelCase, Sanity fields camelCase with `Id` suffix for Cloudinary fields
- **SANITY_API_TOKEN** must never have a `NEXT_PUBLIC_` prefix — server-side only
- **Email addresses** must never be hardcoded — always use env vars
- **i18n** is scaffolded from day one under `[locale]` routing — structure for English now, Greek later

## Before Writing a Single Line

Ask: does this component feel like it belongs to a site that makes someone say "this is smooth, this is creative, this is amazing"? If not, start over. The standard is not good. The standard is unforgettable.