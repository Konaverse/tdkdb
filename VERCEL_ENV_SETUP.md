# Vercel Environment Variables Setup

When deploying to Vercel, environment variables need to be scoped correctly
so that each environment (Production, Preview, Development) uses the right values.

## How Vercel Scoping Works

Vercel lets you assign each variable to one or more **scopes**:

- **Production** — the live site (`tdkdb.com`)
- **Preview** — auto-generated URLs for pull request deploys (`*.vercel.app`)
- **Development** — used when running `vercel dev` locally

Most variables stay the same across all three scopes. The exceptions are listed below.

---

## Step-by-Step

### 1. Open the Vercel Dashboard

Go to [vercel.com](https://vercel.com) → select the **TDK Design & Build** project → **Settings** → **Environment Variables**.

### 2. Add variables that are the SAME across all scopes

Check all three boxes (Production, Preview, Development) for each of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-01-01` |
| `SANITY_API_TOKEN` | Your Sanity write token |
| `SANITY_REVALIDATE_SECRET` | Your generated secret |
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM_EMAIL` | `noreply@tdkdb.com` |
| `CONTACT_FORM_TO_EMAIL` | `info@tdkdb.com` |
| `INTEREST_FORM_TO_EMAIL` | `info@tdkdb.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_BASE_PATH` | `clients/tdkdb` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-8NSMZB7NPB` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Your Clarity project ID |

### 3. Add `NEXT_PUBLIC_SITE_URL` with DIFFERENT values per scope

This variable must differ because canonical URLs, OG meta tags, and sitemaps
need to point to the correct domain for each environment.

Add it **three separate times**, each with a single scope checked:

| Scope | Value |
|---|---|
| **Production** only | `https://tdkdb.com` |
| **Preview** only | `https://tdkdb-preview.vercel.app` |
| **Development** only | `http://localhost:3000` |

> **Tip:** For Preview, you can also use Vercel's built-in `VERCEL_URL` system
> variable at runtime instead of a hardcoded preview URL. But having an explicit
> value avoids surprises with OG images and canonical tags.

### 4. Redeploy

After adding all variables, trigger a redeployment from the **Deployments** tab
so the new values take effect. Existing deployments won't pick up changes automatically.

---

## Security Reminder

`SANITY_API_TOKEN`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, and
`SANITY_REVALIDATE_SECRET` are **server-only secrets**. They are intentionally
**not** prefixed with `NEXT_PUBLIC_` so Next.js will never bundle them into
client-side JavaScript. Do not change their prefixes.
