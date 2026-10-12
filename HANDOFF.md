# TDK Design & Build — handoff

Updated 2026-10-12.

Read these current documents when continuing work:

1. [MEMORY.md](./MEMORY.md): completed requests, latest user corrections,
   verification, preview details and remaining external limitations.
2. [CLAUDE.md](./CLAUDE.md): current architecture, component contracts and commands.
3. [.21st/design.json](./.21st/design.json): accepted visual decisions.

The website includes the shared responsive image lightbox and the hero navigation
fixes, alongside the accepted Projects hub, typography, image overlays and captions.
The dev preview is
`http://127.0.0.1:3008/en`; no deployment or remote push has been performed.
An isolated production preview runs at `http://127.0.0.1:3010/en` to assess navigation
without dev compilation and Fast Refresh.
Start this isolated preview with `node --env-file=../../.env.local` from
`.tmp/build-check`, followed by the existing preload and Next start arguments,
so its runtime form settings are present. Local form checks pass; actual Resend
delivery and sender-domain verification remain unconfirmed because provider
access is blocked in this environment.

The historical master plans describe removed canvas scenes, Three.js, Cloudinary
and earlier page structures. Use the current code and documents above instead.
