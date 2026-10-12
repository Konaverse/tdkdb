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
  editorial spreads with the existing reveal and image drift. Every project photo,
  including the hero, has a small descriptive bottom-left inside-image footnote.
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
  interiors loaded with contained captions; the Almond page has 14 image footnotes.
- Footer checks passed for slower photo movement, aligned image through letters,
  coverage, reverse scroll, resize, route cleanup and reduced motion. The glass
  frames finish in sequence before the interlude photograph settles.

## Working context

The stack is Next.js 14, React, TypeScript, Tailwind, Sanity, GSAP and Lenis.
Use existing primitives and the page grid. Import GSAP from the shared module;
use context cleanup, `scrub: true`, and separate entrance/scroll ownership.
Respect reduced motion. Do not bring back Three.js, Framer Motion or Cloudinary.

Normal startup is `npm run dev -- --hostname 127.0.0.1 --port 3008`.
The running preview uses ignored `.tmp/offline-preview.cjs` with cached CMS reads
and `.tmp/font-preview.cjs` for fonts because network access is restricted. These
local helpers and screenshots remain available in this workspace but are not
committed or part of production. Do not introduce their mocks into application code.

There is no outstanding requested implementation work at this checkpoint.
Continue from the user's next feedback, preserving the accepted motion and sizes.
