# ClaimCare AI — Deployment Guide

This guide takes ClaimCare AI from the repository to a production deployment.

The app is **branchable**: it builds and runs with no external services (demo
mode). Each integration lights up automatically once its keys are present, so
you can deploy incrementally.

---

## 1. Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase** — Postgres, Auth, Storage (Row Level Security throughout)
- **OpenAI** — AI analysis & document generation (deterministic mock fallback)
- **Stripe** — subscriptions, customer portal, usage quotas
- Document parsing: `pdf-parse`, `mammoth`, optional `tesseract.js` (OCR)

---

## 2. Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project (for real auth/data/storage)
- Optional: an [OpenAI](https://platform.openai.com) API key
- Optional: a [Stripe](https://stripe.com) account
- A host that supports Next.js server output (e.g. **Vercel**)

---

## 3. Local setup

```bash
git clone <repo-url>
cd CLAMECARE
npm install
cp .env.example .env.local   # fill in values (all optional for demo mode)
npm run dev                  # http://localhost:3000
```

Without any keys the app runs in **demo mode** with sample data.

---

## 4. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | prod | Canonical site URL (SEO, redirects, Stripe URLs) |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes* | Server tasks: Stripe webhooks, account deletion |
| `STORAGE_BUCKET_CLAIM_DOCUMENTS` | no | Defaults to `claim-documents` |
| `OPENAI_API_KEY` | no | Real AI (otherwise deterministic mock) |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |
| `OCR_ENABLED` | no | `true` to OCR uploaded images (downloads model) |
| `STRIPE_SECRET_KEY` | no | Stripe billing |
| `STRIPE_WEBHOOK_SECRET` | no | Verify Stripe webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | no | Stripe.js publishable key |
| `STRIPE_PRICE_{PLAN}_{MONTHLY\|YEARLY}` | no | Stripe Price IDs per plan (see §7) |

\* Required for Stripe webhook sync and self-service account deletion.

Never commit `.env.local`. Only `NEXT_PUBLIC_*` values are exposed to the browser.

---

## 5. Supabase setup

### 5.1 Apply the database schema

Migrations live in `supabase/migrations/` and must run **in order**:

```
0001_init.sql              extensions, enums, helper functions
0002_tables.sql            all tables + indexes
0003_rls_triggers.sql      RLS policies, updated_at + signup triggers
0004_storage.sql           private document bucket + storage RLS
0005_ai_analysis.sql       claims.ai_analysis
0006_policy_analysis.sql   claims.policy_analysis
0007_negotiation_analysis.sql  claims.negotiation_analysis
```

**Option A — Supabase CLI (recommended):**

```bash
supabase link --project-ref <your-ref>
supabase db push
```

**Option B — SQL editor:** paste each migration file in order into the
Supabase Dashboard → SQL editor and run them.

This creates 24 tables, ~27 enums, RLS on every table, the `claim-documents`
storage bucket, and the auto-profile-on-signup trigger.

### 5.2 Authentication

In **Authentication → URL Configuration**:
- **Site URL**: your app URL (e.g. `https://app.example.com`)
- **Redirect URLs**: add `https://app.example.com/auth/callback`
  (and `http://localhost:3000/auth/callback` for local dev)

Enable **Email** provider. For **Google** sign-in:
- Create OAuth credentials in Google Cloud Console
- In **Authentication → Providers → Google**, paste the Client ID/Secret
- Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

### 5.3 Keys

From **Project Settings → API**, copy the Project URL, the `anon` key, and the
`service_role` key into your env.

### 5.4 Create the first admin

After signing up once, find your user id in **Authentication → Users**, then in
the SQL editor:

```sql
insert into public.admin_users (user_id)
values ('<your-auth-user-uuid>');
```

You can now reach `/admin` (non-admins get a 404).

---

## 6. OpenAI (optional)

Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`). Without it, all AI
features use a deterministic mock so the product remains fully usable.

---

## 7. Stripe (optional)

1. **Products & prices** — create 4 products (Starter, Plus, Pro, Premium),
   each with a **monthly** and **yearly** price. Copy each Price ID into:

   ```
   STRIPE_PRICE_STARTER_MONTHLY, STRIPE_PRICE_STARTER_YEARLY
   STRIPE_PRICE_PLUS_MONTHLY,    STRIPE_PRICE_PLUS_YEARLY
   STRIPE_PRICE_PRO_MONTHLY,     STRIPE_PRICE_PRO_YEARLY
   STRIPE_PRICE_PREMIUM_MONTHLY, STRIPE_PRICE_PREMIUM_YEARLY
   ```

   (Defaults shown in-app: $29 / $79 / $199 / $399 per month.)

2. **Keys** — set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

3. **Webhook** — add an endpoint at `https://app.example.com/api/stripe/webhook`
   subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.created` / `updated` / `deleted`
   - `invoice.payment_failed`

   Copy its signing secret into `STRIPE_WEBHOOK_SECRET`. The webhook syncs
   `subscriptions` and `usage_limits` via the service-role client.

4. **Customer portal** — enable it in the Stripe Dashboard so “Manage billing”
   works.

---

## 8. Deploy (Vercel)

1. Import the repo into Vercel.
2. Add all environment variables (Production + Preview).
3. Build command `next build`, output is server-rendered automatically.
4. Deploy.

`next.config.ts` already lists `pdf-parse`, `mammoth`, and `tesseract.js` under
`serverExternalPackages` so the document parsers work in the server runtime.

---

## 9. Post-deploy checklist

- [ ] `NEXT_PUBLIC_APP_URL` matches the deployed domain
- [ ] Supabase **Site URL** + **Redirect URLs** include the prod `/auth/callback`
- [ ] Google OAuth redirect URI configured (if using Google)
- [ ] Stripe webhook points at the prod `/api/stripe/webhook`
- [ ] First admin inserted into `admin_users`
- [ ] (Optional) `OCR_ENABLED=true` once outbound access is confirmed
- [ ] Sign up → onboard → upload a doc → run analysis → generate a letter
- [ ] `/sitemap.xml` and `/robots.txt` resolve

---

## 10. Notes

- **Security**: every table uses Row Level Security; documents are isolated per
  user via storage path policies and served through short-lived signed URLs.
- **Legal**: ClaimCare AI is informational only and is not a law firm. The
  Terms/Privacy/Disclaimer pages are templates — have them reviewed by counsel
  before launch.
- **Demo mode**: any unset integration falls back gracefully, so partial
  configurations still deploy and run.
