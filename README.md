# LeadFlow AI

An AI-powered CRM that scores every lead 0–100, surfaces the ones ready to buy,
and schedules follow-ups automatically — built entirely on free-tier services.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **Prisma ORM + Neon Postgres** — free serverless Postgres, via `@prisma/adapter-neon`
- **NextAuth v5** — email/password auth (Credentials + bcrypt), JWT sessions
- **Google Gemini** (`@ai-sdk/google` + `ai` SDK) — lead scoring, customer insights, daily focus digest
- **Stripe** — billing, runs in free TEST mode (or demo mode with no keys at all)
- **motion**, **@dnd-kit**, **recharts** — the pipeline kanban, animations, and analytics charts

Nothing in this stack requires a paid plan. Neon, Gemini, and Stripe test mode
are all free; Stripe can even be skipped entirely (see below).

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database (free — Neon)

1. Create a project at [neon.tech](https://neon.tech) (free tier).
2. Copy the pooled connection string into `DATABASE_URL` in `.env`.
3. Push the schema:

```bash
npx prisma migrate dev --name init
```

### 3. Add a Gemini API key (free)

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
and set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env`. Without it, every other
feature still works — AI scoring and insights just show an "AI not configured"
state instead of erroring.

### 4. (Optional) Stripe test mode

Leave `STRIPE_SECRET_KEY` blank to run billing in **demo mode**: upgrading a
plan flips it instantly with no checkout, no Stripe account needed. To wire up
real Stripe Checkout (still free — test mode, no card ever charged), grab test
keys from [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys),
create two recurring Prices, and fill in `STRIPE_SECRET_KEY`,
`STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_TEAM`, and
`STRIPE_PRICE_AGENCY`.

### 5. Set an auth secret

```bash
openssl rand -base64 32
```

Put the output in `NEXTAUTH_SECRET`.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, name your
workspace, and add your first lead.

## Project structure

```
app/
  page.tsx                 marketing landing page
  login/ signup/ onboarding/ invite/[token]/
  (dashboard)/             authenticated app (Shell + Sidebar layout)
    dashboard/              overview, stat cards, AI "focus today" digest
    leads/                  lead table + customer profile (AI score/insights)
    pipeline/                drag-and-drop kanban across pipeline stages
    follow-ups/               automated + manual follow-up tasks
    analytics/                 funnel, source mix, score distribution, trend
    team/ billing/ settings/
  api/                      route handlers backing every page above
components/
  ui/                       Radix-based primitives (button, dialog, table, …)
  landing/ dashboard/ leads/ pipeline/ motion/ auth/
lib/
  prisma.ts auth.ts workspace.ts gemini.ts stripe.ts automations.ts
  hooks/                    React Query hooks used by client components
prisma/schema.prisma        data model
```

## How the AI features work

- **Lead scoring** (`lib/gemini.ts` → `scoreLead`) — Gemini reads a lead's
  title, company, source, deal value, and notes, and returns a 0–100 score, a
  hot/warm/cold priority, and 2–4 written reasons via structured output
  (`generateObject` + zod).
- **Customer insights** (`generateCustomerInsights`) — reads the lead plus its
  recent activity timeline and returns one sharp insight and a concrete next
  action.
- **Daily focus digest** (`recommendDailyFocus`) — ranks a workspace's open
  leads and picks the 3–5 worth a rep's attention today, shown on the
  dashboard.

## Automated follow-ups

Rule-based, no queue or cron required (`lib/automations.ts`):

- Adding a lead schedules a "reach out within 24h" follow-up.
- Moving a lead to **Qualified** schedules a "send proposal" follow-up two
  days out.

Both also drop an entry on the lead's activity timeline.

## Multi-tenancy

One workspace per account for now. Every API route resolves the caller's
workspace from their session and scopes all Prisma queries to it
(`lib/workspace.ts`) — there's no Postgres RLS here, tenant isolation is
enforced in the app layer.

## Deploying to Vercel (free)

The app is zero-config on Vercel — it auto-detects Next.js. `npm run build`
runs `prisma migrate deploy` before `next build`, so every deploy also applies
any pending database migrations to whatever `DATABASE_URL` you set in Vercel.

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Vercel: **Add New → Project**, import the repo. Framework preset
   (Next.js) and build command are auto-detected — no changes needed.
3. Add the same environment variables from `.env` to the Vercel project
   (**Settings → Environment Variables**), for Production (and Preview if you
   want preview deploys to hit the same DB):
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `GOOGLE_GENERATIVE_AI_API_KEY` — your Gemini key
   - `NEXT_PUBLIC_APP_URL` — set to your Vercel URL (e.g.
     `https://leadflow-ai.vercel.app`) once you know it; used for Stripe
     checkout/portal redirect URLs
   - `STRIPE_*` — optional, same as local; leave blank for demo billing mode
   - `NEXTAUTH_URL` is not required on Vercel (Auth.js trusts the host
     automatically when `VERCEL` is set), but harmless to include
4. Deploy. First deploy creates the tables in your Neon DB via
   `prisma migrate deploy`.
5. If you wired up real Stripe Checkout, add a webhook endpoint in the Stripe
   dashboard pointing at `https://<your-domain>/api/webhooks/stripe` and put
   its signing secret in `STRIPE_WEBHOOK_SECRET`.

No paid Vercel plan is required — this runs on the Hobby tier.
