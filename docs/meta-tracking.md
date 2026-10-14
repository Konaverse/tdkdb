# Meta Pixel and Conversions API

Consent-gated advertising measurement for tdkdb.com. Nothing from Meta loads
or is sent before the visitor accepts in the cookie banner.

## Configuration

| Variable                    | Where                           | Value                                                                   |
| --------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Vercel Production + Preview     | `1247719394125049` (public; inlined into the browser bundle)            |
| `META_CAPI_ACCESS_TOKEN`    | Vercel Production + Preview     | The Conversions API system-user token from Events Manager. Server-only. |
| `META_TEST_EVENT_CODE`      | Vercel Preview only (temporary) | The code shown under Events Manager → Test events. Remove when done.    |

The Graph API version is the one constant `META_GRAPH_API_VERSION` in
`src/lib/meta/config.ts` (v26.0, checked against Meta's changelog on 2026-10-14).

## How it works

- **Consent** (`src/components/consent/`): `tdk_consent=granted|denied`, first-party,
  six months. The banner shows until a choice exists and can be reopened from
  "Cookie settings" in the footer and on the privacy page. Reject revokes the Pixel
  and expires `_fbp`/`_fbc`.
- **Pixel** (`src/components/analytics/MetaPixel.tsx`): injected with `next/script`
  only while consent is granted. PageView on load and on every route change;
  Contact on `tel:`/WhatsApp link clicks; ViewContent on the Almond Suites page
  (`MetaViewContent`); Lead from both forms only after the server confirms delivery,
  with the submission UUID as `eventID`.
- **Conversions API** (`src/lib/meta/capi.ts`): called by `/api/contact` and
  `/api/project-interest` after the studio email is accepted, only when the
  request carries `tdk_consent=granted`. Same `event_id`, same `custom_data` as the
  browser event. Customer fields normalized and SHA-256 hashed; `fbc` rebuilt from
  the landing-page `fbclid` when the cookie is missing. Three-second timeout; a
  failure is logged and the form still succeeds. Brevo delivery is untouched.

Lead parameters, identical in both places:

| Form                    | `content_name`   | `content_category`  |
| ----------------------- | ---------------- | ------------------- |
| `/api/project-interest` | the project name | `property_interest` |
| `/api/contact`          | —                | `general_contact`   |

`pnpm test:forms` covers the server side with an intercepted Graph endpoint:
consent gating, hashing, dedup id, fbc fallback and failure tolerance.

## Test checklist (Events Manager → Data sources → the Pixel → Test events)

Use a Preview deployment with `META_TEST_EVENT_CODE` set, or the browser tab's
test code for Pixel-only checks. Open DevTools → Network, filter `facebook`.

1. **Nothing before consent.** Load the site in a fresh private window. Confirm no
   request to `connect.facebook.net` or `facebook.com`, no `_fbp` cookie, and the
   banner is visible with Accept and Reject side by side.
2. **Reject.** Click Reject: still no Meta requests; `tdk_consent=denied` is set.
   Reload: no banner, still nothing loads.
3. **Accept.** Footer → Cookie settings → Accept. The Pixel script loads and
   `PageView` appears in Test events within seconds (source: Browser).
4. **PageView on navigation.** Click through to Projects and About without a full
   reload: one `PageView` per page.
5. **ViewContent.** Open Almond Suites: `ViewContent` with `content_name: Almond
Suites`. It fires once per page load.
6. **Contact.** Tap the phone number in the footer or Contact page: `Contact`.
7. **Lead, deduplicated.** Submit the Almond register form (any test email). Expect
   two `Lead` rows with the same event ID: one from Browser, one from Server, with
   `content_name: Almond Suites` and `content_category: property_interest`. Events
   Manager marks the pair as deduplicated (the Server row shows "Processed/Dedup").
   Submit the Contact form: the same pair with `content_category: general_contact`.
   On the Server row, check the "Matched" customer parameters include email, phone,
   first name, last name, country, IP, user agent and (when present) fbp/fbc.
8. **Lead only after success.** Submit with the studio email deliberately broken on
   a Preview (e.g. wrong `RESEND_FROM_EMAIL`): the form shows an error and no Lead
   appears from either side.
9. **Withdrawal.** Cookie settings → Reject, then submit a form: no browser Lead,
   no server Lead. `_fbp` and `_fbc` are gone.
10. **fbc from fbclid.** Land on the site via a link with `?fbclid=TEST123`, accept,
    submit a form: the Server Lead's `fbc` ends with `TEST123`.

Remove `META_TEST_EVENT_CODE` from Vercel when testing is finished, or every
production event will be tagged as a test.
