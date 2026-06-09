# ClaimCare AI

**The AI assistant that helps Americans fight unfair insurance claim denials.**

Upload your denial letter, understand what went wrong, build your evidence file,
and generate a professional appeal letter in minutes.

> ClaimCare AI provides informational assistance only and does not provide legal
> advice. It is not a law firm. For legal advice, consult a licensed attorney.

---

## Features

- **Auth** — email/password + Google OAuth, legal consents, account deletion
- **Onboarding** — 8-step claim creation wizard
- **Dashboard** — claims overview, filters, deadlines, recommended actions
- **Claim workspace** (12 tabs): Overview, AI Analysis, Documents, Evidence,
  Policy, Timeline, Letters, Messages, Complaint, Negotiation, AI Coach, Activity
- **Secure document vault** — Supabase Storage, RLS, signed URLs, text
  extraction (PDF/DOCX/text + optional image OCR)
- **AI engine** — claim analysis, scoring, evidence checklist, appeal letters,
  policy review, complaint drafting, negotiation strategy, email assistant,
  contextual claim coach (OpenAI, with a deterministic mock fallback)
- **Exports** — letters and a full claim packet to PDF (print)
- **Billing** — Stripe plans, customer portal, usage quotas
- **Resource library** — guides, templates, checklists (premium gating)
- **Notifications & activity log**
- **Support** — FAQ + tickets
- **Admin** — metrics, users, claims, support, and editable knowledge base,
  insurance companies, and state regulations

Every feature degrades gracefully when its integration isn't configured, so the
app runs in **demo mode** with sample data out of the box.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres +
Auth + Storage, RLS) · OpenAI · Stripe.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — runs in demo mode without keys
npm run dev                  # http://localhost:3000
```

```bash
npm run build   # production build
npm run lint    # eslint
```

## Project structure

```
src/
  app/                 routes (marketing, auth, (app) shell, admin, api, packet)
  components/          UI primitives + feature components
  lib/
    ai/                modular AI functions (analyze, letters, coach, policy, …)
    billing/           Stripe plans, actions, quotas
    data/              server data loaders (with demo fallbacks)
    supabase/          server/browser/admin clients + session proxy
    documents/         upload, extraction (PDF/DOCX/OCR)
    types/             DB enums + row interfaces
supabase/migrations/   ordered SQL schema (0001–0007 + storage)
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full guide: Supabase schema +
auth + storage, OpenAI, Stripe (prices + webhook), Vercel, and the post-deploy
checklist.

## Environment variables

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser; everything
else is server-only.
