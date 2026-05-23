# Production Launch Checklist

> **Status:** Pre-launch  
> **Domain:** tdkdb.com  
> **Last updated:** 2026-02-25
>
> This is a living document. Update it as items are completed or new items emerge.

---

## 1. Domain & DNS

- [ ] Connect `tdkdb.com` to Vercel (Settings → Domains)
- [ ] Add `www.tdkdb.com` as a redirect domain (non-www is canonical)
- [ ] Verify DNS propagation is complete (`nslookup tdkdb.com`)
- [ ] Confirm HTTPS certificate is issued and active (Vercel auto-provisions via Let's Encrypt)
- [ ] Test `www.tdkdb.com` redirects to `https://tdkdb.com` (our `next.config.mjs` redirect)

---

## 2. Environment Variables on Vercel

- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://tdkdb.com` for Production scope
- [ ] `NEXT_PUBLIC_SITE_URL` set to preview URL for Preview scope
- [ ] `NEXT_PUBLIC_SITE_URL` set to `http://localhost:3000` for Development scope
- [ ] All other env vars are set (see `VERCEL_ENV_SETUP.md` for full list)
- [ ] Trigger a redeployment after setting/changing any env vars
- [ ] Verify no env vars are missing: check build logs for startup errors

---

## 3. Security Headers

Run a scan at [securityheaders.com](https://securityheaders.com/?q=https://tdkdb.com) once the domain is live.

All 6 must be green:

- [ ] `Strict-Transport-Security` — `max-age=31536000; includeSubDomains; preload`
- [ ] `X-Frame-Options` — `DENY`
- [ ] `X-Content-Type-Options` — `nosniff`
- [ ] `Referrer-Policy` — `strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` — `camera=(), microphone=(), geolocation=()`
- [ ] `Content-Security-Policy` — present and not blocking legitimate resources

### CSP Troubleshooting

If something breaks after launch, open browser DevTools → Console and look for
`Refused to load` errors. The fix is adding the blocked domain to the relevant
CSP directive in both `vercel.json` and `next.config.mjs`.

---

## 4. SEO & Indexing

- [ ] Visit `https://tdkdb.com/robots.txt` — confirm it returns valid rules
- [ ] Visit `https://tdkdb.com/sitemap.xml` — confirm it lists pages
- [ ] Submit sitemap to Google Search Console (`https://search.google.com/search-console`)
- [ ] Verify `x-robots-tag` is **not** `noindex` on production (Vercel adds this only on preview)
- [ ] Check canonical URLs point to `https://tdkdb.com/...` (not preview URLs)
- [ ] Test OG meta tags with [opengraph.xyz](https://www.opengraph.xyz/) for key pages:
  - [ ] Homepage (`/en`)
  - [ ] A project page (`/en/projects/armonia`)
  - [ ] An insight page

---

## 5. Analytics

- [ ] Google Analytics: confirm GA4 tag fires on page load (GA Debug extension or Realtime report)
- [ ] Measurement ID `G-8NSMZB7NPB` is receiving data
- [ ] Microsoft Clarity: confirm session recordings are appearing
- [ ] Verify analytics scripts are not blocked by CSP (check DevTools Console)

---

## 6. Email (Resend)

- [ ] Send a test submission through the contact form on production
- [ ] Send a test submission through the project interest form
- [ ] Confirm emails arrive at `info@tdkdb.com`
- [ ] Confirm sender shows as `noreply@tdkdb.com`
- [ ] Check Resend dashboard for delivery status and no bounces

---

## 7. CMS (Sanity)

- [ ] Sanity Studio is accessible at `https://tdkdb.com/studio`
- [ ] Published content loads correctly on the frontend
- [ ] ISR revalidation webhook is configured in Sanity:
  - URL: `https://tdkdb.com/api/revalidate`
  - Secret: matches `SANITY_REVALIDATE_SECRET` env var
  - Trigger: on create, update, delete
- [ ] Edit a document in Sanity → verify the page updates within the revalidation window
- [ ] Verify `SANITY_API_TOKEN` is **not** exposed in client-side JS (DevTools → Sources → search for the token value)
- [ ] **CONTENT ENTRY PENDING:** Add real content for 'Almond' project into Sanity Studio
- [ ] **CONTENT ENTRY PENDING:** Add real content for 'Insights' articles into Sanity Studio

---

## 8. Images & Media

- [ ] Cloudinary images load correctly (check Network tab for `res.cloudinary.com`)
- [ ] Homepage image sequences load and play smoothly
- [ ] Verify `/sequences/*` assets return `Cache-Control: public, max-age=31536000, immutable`
- [ ] Verify `/fonts/*` assets return the same cache headers
- [ ] Run Lighthouse on homepage — check no significant image-related warnings

---

## 9. i18n Routing

- [ ] `https://tdkdb.com` redirects to `https://tdkdb.com/en`
- [ ] `https://tdkdb.com/el` loads the Greek locale layout (content can be placeholder)
- [ ] Switching locales preserves the current page path
- [ ] `hreflang` tags are present in `<head>` for both `en` and `el`

---

## 10. Performance

Run [PageSpeed Insights](https://pagespeed.web.dev/) on the live production URL.

- [ ] Mobile Performance score ≥ 90
- [ ] Desktop Performance score ≥ 95
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] No render-blocking resources flagged
- [ ] Verify `removeConsole` is working: no `console.log` output in production DevTools

---

## 11. Deployment Protection

- [ ] Decide on preview protection policy (keep enabled or open for client review)
- [ ] If keeping enabled: share Vercel team access with stakeholders who need preview URLs
- [ ] Production deployment is **not** behind auth (public-facing)

---

## 12. Final Smoke Test

Visit each of these on the live domain and confirm no errors:

- [ ] `https://tdkdb.com` → redirects to `/en`
- [ ] `https://tdkdb.com/en` — homepage loads, canvas plays
- [ ] `https://tdkdb.com/en/about`
- [ ] `https://tdkdb.com/en/services`
- [ ] `https://tdkdb.com/en/projects`
- [ ] `https://tdkdb.com/en/projects/[any-slug]`
- [ ] `https://tdkdb.com/en/insights`
- [ ] `https://tdkdb.com/en/contact` — form submits
- [ ] `https://tdkdb.com/en/privacy-policy`
- [ ] `https://tdkdb.com/en/terms`
- [ ] `https://tdkdb.com/studio` — Sanity Studio loads
- [ ] `https://tdkdb.com/nonexistent-page` — 404 page renders

---

## Notes & Issues

_Add any issues discovered during checks here._

| Date       | Issue                                                                                                                                                                                                                                                                  | Status |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2026-02-27 | **Creative idea — transparent door on last approach frame:** Make the door opening in the final approach frame transparent/alpha-cut so the teal bloom gradient shows through it. Would reinforce the threshold metaphor visually. Low priority, deferred post-launch. | Idea   |
