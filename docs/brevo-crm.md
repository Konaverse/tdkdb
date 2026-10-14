# Brevo website enquiries

The existing Next.js 14.2.35 App Router forms keep Resend as their delivery authority.
CRM delivery starts only after Resend accepts the studio notification. All website
enquiries—including general Contact/homepage forms and other projects—go to Almond
Pipeline's New Inquiry stage, as confirmed by the owner. Their actual property or
service interest is retained; a non-Almond enquiry is never relabelled as Almond.

| Setting            | Configured target                  |
| ------------------ | ---------------------------------- |
| Website Leads list | `3`                                |
| Almond Pipeline    | `6acd18d26b19db2a45b1cef1`         |
| New Inquiry stage  | `0e5173b4643c420bbacdd97cc7d22450` |

## Enable and review

1. Keep `BREVO_ENABLED=false` until rollout is approved. Set server-only
   `BREVO_API_KEY`, `CRON_SECRET`, and the existing Sanity write token. The list,
   pipeline and stage have the confirmed defaults; optional overrides are in
   `.env.example`. Set `BREVO_DEAL_OWNER` to the owner's account email or Brevo
   user ID if deals should be explicitly assigned. Do not use `NEXT_PUBLIC_`
   names for keys, tokens or worker secrets. Keep the existing Resend settings.
2. Enable locally or in an approved Preview environment and run:

   ```text
   node --env-file=.env.local tools/check-brevo-config.cjs
   npm run test:forms
   npm run test:crm
   ```

   The configuration check performs read-only Brevo requests. It verifies the
   list, pipeline/stage membership, standard name attributes, and required secret
   presence. It cannot prove the Sanity token's mutation permissions. Verify
   private queue writes in an approved test environment. The automated delivery
   tests use isolated providers and never send emails or mutate live CRM data.

3. Review a controlled end-to-end test with the account owner before Production:
   the studio email and acknowledgement, list membership, linked deal/stage,
   full notes, attribution, and duplicate replay. CRM delivery records appear in
   Sanity Studio under **CRM deliveries**. No live enquiry was sent by this task.
4. Deploy only after explicit approval. Vercel's configured daily worker runs at
   `06:00 UTC`; Vercel supplies `Authorization: Bearer <CRON_SECRET>`. New enquiries
   also get an immediate CRM attempt, bounded to eight seconds of Brevo work.

## Data and retries

- Contacts are upserted by normalized email, added to list `3`, and linked by
  numeric contact ID. FIRSTNAME/LASTNAME use standard Brevo attributes. Explicit
  international phone numbers populate SMS when valid. Local/ambiguous numbers
  and conflicting shared phone numbers remain intact in notes. Contacts are
  never force-merged; subscription/blacklist flags are never changed.
- Every new enquiry gets its own deal and linked notes. The form keeps the same
  UUID and attribution snapshot through network retries. Edited enquiries get a
  new UUID. Accepted UUIDs are replayed from the durable receipt. Distinct genuine
  enquiries from one email remain separate deals. Older callers without a UUID
  remain supported, but do not get request replay protection.
- First campaign touch is retained in session storage and survives navigation;
  the latest campaign touch and submission page are also captured. Storage denial
  falls back to memory. Only allowlisted UTMs and ad click IDs enter stored URLs;
  unrelated query parameters and fragments are excluded. No marketing consent is
  inferred from a sales enquiry.
- Full messages, residence preferences, original phone values and attribution
  are preserved in notes linked to both the contact and deal. Long messages are
  escaped and split to respect Brevo's 10,000-character note limit.
- Private Sanity IDs use `enquiry.<sha256>` (and `lead.<sha256>` for new property
  archives). The dot deliberately excludes these records from anonymous public
  CMS access. Existing lead documents are not migrated or removed.
- Revision-checked worker leases prevent concurrent processors. Contact IDs,
  deal IDs and completed note parts are checkpointed individually. Rate limits
  respect Retry-After; transient failures are retried with backoff. CRM retries
  never resend the Resend notification or acknowledgement.
- Resend notification and acknowledgement have separate idempotency keys. Its
  provider protection lasts 24 hours; accepted durable receipts remain replayable
  beyond that. If both CMS access and the queue fail, the email still succeeds and
  contains an enquiry reference plus attribution for manual recovery. There is
  no promise of exactly-once email delivery during a prolonged complete CMS outage.

## Recovery

`GET /api/crm/retry` is an authenticated, uncached worker. It retries a bounded
batch and returns counts rather than customer details. A manual authenticated
`POST` can retry one record:

```json
{ "id": "enquiry.<64-character-sha256>", "action": "retry" }
```

If a creation response was lost, the worker first searches the exact deal name
or the note's enquiry marker. It does not blindly create a second record or
reset an existing deal's sales stage. An unresolved outcome is marked `review`.
Check Brevo before using either of these recovery actions:

```json
{"id":"enquiry.<64-character-sha256>","action":"confirm-absent-deal","confirmedAbsent":true}
{"id":"enquiry.<64-character-sha256>","action":"confirm-absent-note","confirmedAbsent":true}
```

If no queue record exists because Sanity was unavailable, confirm the studio
notification in Resend and reconstruct the original fields from that email and
any archived lead. Save the following shape under ignored `.tmp/`, using the
email's enquiry reference and accepted notification ID:

```json
{
  "id": "enquiry.<64-character-reference-from-notification>",
  "emailId": "<accepted-Resend-notification-ID>",
  "submittedAt": "<original-ISO-timestamp>",
  "enquiry": {
    "kind": "interest",
    "name": "<original-name>",
    "email": "<original-email>",
    "phone": "<original-phone>",
    "message": "<original-message>",
    "projectSlug": "almond-suites",
    "projectName": "Almond Suites",
    "projectType": "",
    "unitPreference": "<original-preference>",
    "attribution": {}
  }
}
```

Copy the original attribution into that object as well. Validate with
`node tools/restore-crm-enquiry.cjs .tmp/recovery.json`; add `--apply` with the
server environment loaded to create the private queue record after restoring
Sanity. It uses create-if-missing, never sends email, and never calls Brevo.
The worker then delivers the restored enquiry normally. Do not commit recovery
files containing customer data.

## Meta lead alerts (Brevo webhook)

Meta Instant Form leads sync into list `4` ("TDK | Meta Leads") with FIRSTNAME,
SMS, INTERESTED_UNIT, PURCHASE_TIMELINE and LEAD_ROLE. Brevo's "Notify by email"
automation cannot include those, so `POST /api/webhooks/brevo-lead`
(`src/lib/crm/lead-alert.ts`) replaces it:

- Brevo's marketing webhook for "contact added to a list" calls the route with
  `?secret=<BREVO_WEBHOOK_SECRET>` (an `x-webhook-secret` header also works).
  A missing or wrong secret is a 401; nothing else is ever not a 200.
- Only `list_addition`/`listAddition` events naming list `4`
  (`BREVO_META_LEADS_LIST_ID`) act; other events and lists are ignored.
- The route reads the full contact from Brevo with `BREVO_API_KEY` (this does
  not depend on `BREVO_ENABLED`) and sends one Greek alert through Resend to
  `LEAD_ALERT_TO_EMAIL` (falls back to `CONTACT_FORM_TO_EMAIL`): name, phone
  as a `tel:` link, email, unit, timeline, buyer/agent, then "Καλέστε εντός 5
  λεπτών." Attribute values have underscores replaced by spaces. A LEAD_ROLE of
  "μεσίτης" prefixes the subject with "[ΜΕΣΙΤΗΣ] ".
- Idempotency: an in-memory map allows one alert per email per ten minutes on
  a given function instance, and a Resend idempotency key hashed from the
  lead's email, the list id and Brevo's event time (`ts`, else `date_time`/
  `date`, else the current minute) drops a duplicate that reaches another
  instance within 24 h. Brevo's event `id` is NOT unique per event and must
  never be used: keying on it refused every real lead after the first with
  409 `invalid_idempotent_request`. If Resend answers 409 anyway, the alert
  is resent once without a key rather than dropped. A failed attempt releases
  the guard so Brevo's retry can succeed.
- `pnpm test:lead-alert` runs the route against an isolated Brevo and Resend.

Brevo setup: Contacts → Settings → Webhooks → Add a new webhook (marketing
webhooks; the Transactional section has its own). URL:
`https://tdkdb.com/api/webhooks/brevo-lead?secret=<BREVO_WEBHOOK_SECRET>`,
event "Contact added to a list". Brevo cannot restrict a webhook to one list;
the route does that.

## API references

- [Brevo contact creation/upsert](https://developers.brevo.com/reference/create-contact)
- [Brevo deal creation](https://developers.brevo.com/reference/create-a-deal)
- [Brevo deal lookup filters](https://developers.brevo.com/reference/get-all-deals)
- [Brevo note creation](https://developers.brevo.com/reference/create-a-note)
- [Brevo note lookup](https://developers.brevo.com/reference/get-all-notes)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Sanity transactions and revision checks](https://www.sanity.io/docs/content-lake/transactions)
- [Vercel cron usage](https://vercel.com/docs/cron-jobs/usage-and-pricing)
