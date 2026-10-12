# TDK website — current project memory

Updated 2026-10-12. Read this first when continuing work; use `CLAUDE.md` for
implementation details and `.21st/design.json` for durable visual decisions.
Older master plans describe removed features and must not override the current site.

## Current objective and state

Prepare the existing website for public launch, with Almond Suites as the main
sales priority. The requested changes and latest size corrections are implemented
and verified locally. The user is reviewing the dev site at
`http://127.0.0.1:3008/en`. No deployment or remote push has been performed in this session.

## Completed changes and user decisions

- Almond Suites: apartments 102 and 104 are sold; construction is 65% complete.
  `src/lib/projects/updates.ts` applies these facts consistently to project queries
  until they are saved in Sanity. Keep these overrides until the CMS agrees.
- The homepage features Almond immediately after the hero. Register interest is
  the primary CTA, including the navbar and footer, and leads to the project form.
  The supplied technical specifications PDF is bundled under `public/documents/`
  and opens from the Almond page.
- Projects hub: one full viewport, no hero counts. Center the first 3:4 portrait
  on both axes and extend further project images horizontally to its right,
  clipping at the viewport edge. Keep Projects bottom-left and the introduction
  bottom-right with page-grid padding. Preserve the two project ledgers below.
- Use Josefin Sans everywhere, including numerals, image footnotes and the loader.
  JetBrains Mono and its tokens are removed.
- Featured Almond: overlay availability left, Now selling in Strovolos centered,
  and construction progress right over the desktop image. Fade the overlay on
  hover and keyboard focus. Mobile keeps only the selling line inside the image,
  concise copy below, and the Register interest CTA within the same viewport.
- Project heroes have no status eyebrow or exterior footnote. The technical
  specifications link still works; its visible helper line and the CMS-supplied
  Pricing available on inquiry note are removed.
- Every About photograph now has a Josefin Sans footnote inside its image frame.
  The homepage About eyebrow is removed entirely on desktop and mobile.
- Shared lightbox: enable gallery/editorial photos, including project heroes and
  scenes, About photos, hub portraits, homepage editorial photos, Contact and the
  footer photograph. Keep project-page image links as navigation (confirmed by the
  user). Desktop arrows use rectangles outside the photograph; phone and touch
  arrows are transparent and sit inside it. The dialog supports swiping, keyboard
  arrows, Escape, focus trapping, scroll/focus restoration, reduced motion and a
  preview fallback. Use full uncropped Sanity images sized for the device; prefetch
  only adjacent photos after opening. Triggers wait until their provider is active.
- Page navigation: hide font-dependent hero copy before its first paint, then
  show it after masks are prepared. Initialize cached fonts synchronously. Defer
  below-fold About, Projects and footer text splitting until near the viewport.
  Main navigation and project links prefetch complete routes; the project expansion
  also warms its destination. Preserve all accepted layouts and motion.
  RevealFrame photographs also start hidden until their entrance cover is ready,
  so hero images cannot paint and then disappear into an entrance wipe.
- Hero entrance: the background and building appear together in fourteen paired
  tiles, then the existing TDK entrance follows. Other text uses a masked rising
  character reveal instead of the previous sideways reveal.
- Homepage projects: remove project numbering and the circular next/play button.
  Keep titles at their ORIGINAL `clamp(1.9rem, 3.4vw, 4.2rem)` font size, on one
  line. Shrink only when needed to fit; never enlarge titles to fill the width.
  White difference blending makes overlapping titles visible across images.
- Footer: match the supplied `footer.png` reference with TDK content, a white
  four-column index, rectangular teal CTA, large image-filled TDK DESIGN & BUILD
  wordmark, and a full-width photo below. The wordmark is visible immediately.
  Use the supplied Modular two-bedroom sunset photo bundled locally. The white
  content and letter shapes scroll normally; the raised photo moves more slowly,
  sharing the same image offset through the transparent letters and photo below.
- Buttons: rectangular, with white text on teal before hover. Shared label styling
  corrects Josefin Sans's optical vertical alignment.
- Homepage Contact: preserve the original introductory paragraph and photograph
  positions. Replace the details grid and Write to us link with the contact form.
- All enquiry forms share smooth focus fill changes, drawn border edges, and a
  custom TDK dropdown. The dropdown supports keyboard navigation, typeahead,
  touch, outside click, reset, FormData, and placement above the field when needed.
- Interlude: remove the cyan TDK background wordmark. WE HOUSE sits left of the
  settled central photograph and YOUR DREAM sits right, both vertically centered.
  Preserve the paragraph. Three nested clear glass panes have transparent centers
  and refracted edges, without frost. Each opens only after its parent finishes:
  frame 1 starts at image edges, frame 2 at frame 1's settled edges, frame 3 at
  frame 2's settled edges. All finish before the image visually settles, by 78%
  of the pullback. Keep the existing mobile vertical sequence.
- Almond interiors: eight supplied photographs are added in four staggered
  editorial spreads with the existing reveal and image drift. Every project scene
  photo has a descriptive bottom-left inside-image footnote; heroes have none.
  The CMS image fields also support optional alt text and captions.
- About process: the user authorized choosing suitable existing TDK assets.
  Order is Build, Draw, Hand over. Build uses the window-installation photo left
  and slower text right. Its portrait was reduced after user feedback and is
  capped at 75svh height. Draw uses a small faster blueprint photo right and text
  left. Hand over uses the completed Armonia terrace near the center, with an
  overlapping heading and readable body text to the right. Use generous editorial
  spacing; smaller screens stack and disable the outer parallax.

## Delivery behavior and remaining external verification

`ContactForm` serves homepage and Contact via `/api/contact`; `ProjectRegister`
uses `/api/project-interest`. Shared delivery code confirms success only after
Resend accepts the studio notification. Preserve visitor input on errors, disable
duplicate submissions while sending, and allow retry. A failed acknowledgement,
analytics event or Sanity lead archive must not undo an accepted notification.

Required mail settings are `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and a studio
recipient in `CONTACT_FORM_TO_EMAIL` or `INTEREST_FORM_TO_EMAIL`. Never save
credentials or env values in memory or Git. Live email delivery remains unverified:
outbound provider access returned EACCES in this environment. Tests use substitutes
and browser API interception; no external test messages were sent.

Sanity uploads also returned EACCES. The eight new interiors and three About
process photos therefore use optimized responsive WebPs in
`public/images/requested/`, with their typed manifest in `src/lib/content/`.
They are production assets, not preview placeholders, and are not yet CMS-managed.

## Verification completed

- Changed-file ESLint, TypeScript, Prettier and whitespace checks passed.
- Production compilation, type checks and page generation passed using real
  cached Sanity data and local font fixtures for the restricted build environment.
- `npm run test:forms`: 31 isolated backend delivery tests passed.
- Browser checks covered all three form placements at desktop/mobile sizes,
  validation, delivery/network failure, preserved input, retry and confirmation.
- Keyboard/touch dropdown checks, focus animation, reset, viewport placement,
  single FormData values and reduced-motion styling passed.
- Project titles fit on one line at 1440, 1024, 768, 390 and 320px. About layout,
  parallax speeds, responsive stacking and reduced motion passed. All eight Almond
  interiors loaded with contained captions; the Almond page now has 13 image footnotes.
- Footer checks passed for slower photo movement, aligned image through letters,
  coverage, reverse scroll, resize, route cleanup and reduced motion. The glass
  frames finish in sequence before the interlude photograph settles.
- Latest page refinements: 18 browser layout checks passed across 1440×900,
  1280×720, 1024×768, 768×1024, 390×844 and 320×568. The hub portrait is centered
  and its row clips right without page overflow; bottom copy remains clear.
  The mobile featured photograph and CTA fit together. All eight About captions
  stay inside their photographs and all Almond scene captions use Josefin Sans.
- Desktop hover fading, restored overlay on pointer leave, reduced motion,
  project expansion/navigation, direct register hash reload and a real touch
  viewport's CTA navigation passed without browser errors. The PDF still returns
  200, and both requested helper lines are absent.
- The 21st review reported no errors. Its two width warnings refer to existing
  max-width constraints; browser checks confirmed no horizontal overflow.
- Lightbox verification passed in dev and production at 1440×900, 1024×768,
  768×1024, 390×844, 320×568 and 844×390. Phone checks used real touch events.
  Arrow placement, swiping, cycling, keyboard navigation, trapped focus, Escape,
  backdrop/close buttons, scroll restoration, full-image loading failure,
  individual gallery groups and preserved project navigation all passed.
- Eight production navigation traces at desktop/mobile widths, including return
  visits and browser Back with deliberately delayed fonts, showed no premature
  hero copy and one continuous entrance. Two cold first-paint checks delayed
  application JavaScript and verified neither text nor images flash before their
  entrance is prepared. Reduced-motion and no-JavaScript fallbacks stay visible.
  The prior 18 layout and CTA checks also passed. No browser errors were observed.
- Final changed-file lint, TypeScript, formatting, whitespace and isolated
  production build checks passed. The latest 21st review has no errors and one
  existing max-width warning in AboutGrid, covered by responsive browser checks.

## Working context

The stack is Next.js 14, React, TypeScript, Tailwind, Sanity, GSAP and Lenis.
Use existing primitives and the page grid. Import GSAP from the shared module;
use context cleanup, `scrub: true`, and separate entrance/scroll ownership.
Respect reduced motion. Do not bring back Three.js, Framer Motion or Cloudinary.

Create image reveal, availability and register ScrollTriggers only after their
timelines are populated, then refresh them immediately. This prevents an initial
hash jump to the register form from recursively refreshing unfinished triggers
and leaving enquiry fields hidden.

Normal startup is `npm run dev -- --hostname 127.0.0.1 --port 3008`.
The running preview uses ignored `.tmp/offline-preview.cjs` with cached CMS reads
and `.tmp/font-preview.cjs` for fonts because network access is restricted. These
local helpers and screenshots remain available in this workspace but are not
committed or part of production. Do not introduce their mocks into application code.

An isolated production preview is available at `http://127.0.0.1:3010/en`, built
under ignored `.tmp/build-check/` with the same cached public CMS content and font
fixtures. Use it to assess navigation without dev compilation and Fast Refresh.

There is no outstanding requested implementation work at this checkpoint.
Continue from the user's next feedback, preserving the accepted motion and sizes.
