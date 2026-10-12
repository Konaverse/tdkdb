# TDK Design & Build — handoff

Updated 2026-10-13.

Current task: Brevo CRM integration is implemented and disabled by default.
All website enquiries go to Almond Pipeline/New Inquiry, retaining their actual
interest. Resend remains the success authority; private Sanity receipts and a daily
worker handle CRM retries. The 43 email and 52 CRM checks, six production-preview
form checks, full lint, types and build pass. The owner reports that the Brevo API
key is configured in Vercel; real account verification remains outstanding.
Vercel's enable flag and retry secret have not been verified. The retry secret
exists in ignored local environment settings. On 2026-10-13, after the deployment
requirement was explained, the owner explicitly authorized committing and pushing
this integration to main. Further Production changes still require approval. Read
[docs/brevo-crm.md](./docs/brevo-crm.md) for setup and recovery.

Earlier work: mobile smoothness, SVG link arrows and browser-toolbar-aware fullscreen
sizing were pushed as `15940a4`. Touch uses native scrolling, CSS sticky projects
without automatic snap, lighter word/image entrances, and static footer photography.
Desktop retains the existing motion. Dynamic heroes and visual-viewport lightbox
sizing track browser controls. Mobile/desktop interaction and resize checks pass;
physical Safari review remains outstanding. Read MEMORY.md for details.

Read these current documents when continuing work:

1. [MEMORY.md](./MEMORY.md): completed requests, latest user corrections,
   verification, preview details and remaining external limitations.
2. [CLAUDE.md](./CLAUDE.md): current architecture, component contracts and commands.
3. [.21st/design.json](./.21st/design.json): accepted visual decisions.

The website includes the shared responsive image lightbox and the hero navigation
fixes, alongside the accepted Projects hub, typography, image overlays and captions.
The accepted changes were pushed to `origin/main` through `8cce719`.
The dev preview is `http://127.0.0.1:3008/en`; the user is reviewing the deployment
at `https://tdkdb.vercel.app`.
An isolated production preview runs at `http://127.0.0.1:3010/en` to assess navigation
without dev compilation and Fast Refresh.
Start this isolated preview with `node --env-file=../../.env.local` from
`.tmp/build-check`, followed by the existing preload and Next start arguments,
so its runtime form settings are present. Local form checks pass; actual Resend
delivery and sender-domain verification remain unconfirmed because provider
access is blocked in this environment.

Latest production report: font packaging now uses a committed Josefin Sans WOFF2
through `next/font/local`, with no Google download or font mocks. The user's
Vercel trace shows a Resend POST returning 403 and `/api/project-interest` returning 500. Production errors/warnings are retained to show the provider reason. The
user identified the cause: the key belongs to Konaverse's Resend account with
only the Konaverse domain verified, while the sender uses TDK's domain. They
chose a separate TDK Resend account. Domain verification, a new Production key
in Vercel and redeployment are still needed for live email delivery.
43 isolated mail checks pass, including the real SDK with intercepted transport.
The production build and eight actual rendered-font checks pass without font mocks;
provider error logs also survive production compilation.
The font fix is deployed: public HTML/CSS classes match and the live font's hash
matches the committed Josefin file. The earlier deployment used a font-variable
class absent from its stylesheet, explaining the fallback. Public live files can
be downloaded with standalone `curl.exe -L`; direct browser/Node and Vercel CLI
requests remain blocked by this workspace's network restrictions.

The historical master plans describe removed canvas scenes, Three.js, Cloudinary
and earlier page structures. Use the current code and documents above instead.
