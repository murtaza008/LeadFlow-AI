# LeadFlow AI

**An AI-powered CRM that scores every lead 0–100, tells your reps who to call today, and schedules the follow-ups for them.**

[![Live demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square)](https://lead-flow-ai-six.vercel.app/)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

**Live demo:** https://lead-flow-ai-six.vercel.app/ — click **Try demo** to explore a fully seeded
workspace without signing up, or sign up with any email to start your own.

LeadFlow AI is a multi-tenant sales CRM. Add leads, and Google Gemini scores each
one on how likely it is to close, explains why, writes a next-best-action from the
lead's activity history, and picks the handful of leads worth a rep's time today.
A drag-and-drop pipeline, rule-based follow-up automation, analytics, team
workspaces and Stripe billing round it out.

The whole stack runs on **free tiers**: Neon Postgres, the Gemini API free key,
Vercel Hobby, and Stripe test mode, which you can skip entirely (billing then runs
in demo mode).

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Public demo mode](#public-demo-mode)
- [Seeding a demo pipeline](#seeding-a-demo-pipeline)
- [How the AI features work](#how-the-ai-features-work)
- [Automated follow-ups](#automated-follow-ups)
- [Multi-tenancy and security](#multi-tenancy-and-security)
- [Billing](#billing)
- [API routes](#api-routes)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)

---

## Features

| Area | What you get |
| --- | --- |
| **Dashboard** | Stat cards (hot leads, open pipeline value, average score, win rate), an AI **"Focus today"** digest, and a priority-leads list |
| **Leads** | Searchable lead table with stage filter; add leads (name, company, title, email, phone, source, deal value, notes) |
| **Lead profile** | AI score badge with priority (Hot / Warm / Cold) and reasons, **Score / Re-score with AI**, AI **customer insight + next action**, edit details and owner, stage selector, activity timeline, log notes / emails / calls, linked follow-ups, delete |
| **Pipeline** | Drag-and-drop kanban (`@dnd-kit`) across New → Contacted → Qualified → Won / Lost; moving a card triggers automations |
| **Follow-ups** | Every follow-up in the workspace grouped into Overdue / Upcoming / Done, tick to complete |
| **Analytics** | Stage funnel (count and value), lead-source mix, score distribution, 8-week created-vs-won trend, totals and win rate (Recharts) |
| **Team** | Member list with roles (Owner / Admin / Member), invite by email with a role |
| **Billing** | Starter (free) / Team ($79) / Agency ($199) plans via Stripe Checkout + Customer Portal, or instant **demo mode** with no Stripe keys |
| **Settings** | Workspace name and brand colour |
| **Marketing site** | Landing page with hero, feature cards, before/after, social proof, pricing, FAQ and CTA, animated with `motion` |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, `proxy.ts`), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, Radix UI primitives, `class-variance-authority`, `motion`, lucide-react, sonner toasts |
| Database | Neon serverless Postgres, Prisma 7 via `@prisma/adapter-neon` (WebSocket driver) |
| Auth | Auth.js (NextAuth v5), Credentials provider, bcrypt (12 rounds), JWT sessions |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/google`), Gemini `gemini-flash-latest`, structured output with `generateObject` + zod |
| Data fetching | TanStack Query against the app's own Route Handlers |
| Charts / DnD | Recharts, `@dnd-kit/core` |
| Payments | Stripe Checkout, Billing Portal and webhooks (test mode), with a demo-mode fallback |

---

## Getting started

### Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- A free [Neon](https://neon.tech) Postgres database
- A free [Gemini API key](https://aistudio.google.com/apikey) (optional, but the AI features need it)

### 1. Clone and install

```bash
git clone <this-repo-url> leadflow-ai
cd leadflow-ai
npm install        # also runs `prisma generate` (postinstall)
```

### 2. Create `.env`

Create a `.env` file in the project root (see [Environment variables](#environment-variables)
for every key):

```bash
# Neon → Connect → copy the pooled connection string
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# openssl rand -base64 32
NEXTAUTH_SECRET="replace-with-a-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# https://aistudio.google.com/apikey (free)
GOOGLE_GENERATIVE_AI_API_KEY=""

# Optional: leave blank for demo billing mode
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_TEAM=""
STRIPE_PRICE_AGENCY=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Without `GOOGLE_GENERATIVE_AI_API_KEY` everything else still works; the AI
score, insight and focus features return a clear "AI is not configured" message
instead of crashing.

### 3. Create the database tables

The repo ships a Prisma migration (`prisma/migrations/…_init`). Apply it:

```bash
npx prisma migrate deploy
```

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, sign up, name your workspace on the onboarding screen,
and add your first lead. Open the lead and click **Score with AI** to run Gemini on it.

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | `prisma migrate deploy && next build` (applies pending migrations first) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Neon Postgres connection string (pooled is fine; the app uses Neon's serverless driver) |
| `NEXTAUTH_SECRET` | **yes** | Signs session JWTs. `AUTH_SECRET` works too (Auth.js v5 reads either) |
| `NEXTAUTH_URL` | no | Local base URL. Not needed on Vercel, where Auth.js trusts the host |
| `GOOGLE_GENERATIVE_AI_API_KEY` | recommended | Enables lead scoring, insights and the daily focus digest |
| `NEXT_PUBLIC_APP_URL` | for Stripe | Base URL for Stripe Checkout / Portal redirects (defaults to `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | no | Turns on real Stripe Checkout; leave empty for demo billing mode |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Verifies `/api/webhooks/stripe` signatures |
| `STRIPE_PRICE_TEAM` / `STRIPE_PRICE_AGENCY` | with Stripe | Recurring Price IDs for the two paid plans |
| `DEMO_PASSWORD` | for the demo | Password of the shared demo account. A long random string; "Try demo" uses it server-side, it never reaches the browser |
| `CRON_SECRET` | for the demo | Protects `/api/cron/demo-reset`; Vercel Cron sends it automatically |
| `SEED_USER_EMAIL` | no | Account for `scripts/seed-leads.ts` if none is passed on the command line |

---

## Public demo mode

Visitors can click **Try demo** (landing page hero or the sign-in page) to land in a
fully populated workspace, **Northwind Digital**, a fictional B2B agency. Nobody types
credentials: `POST /api/demo/login` signs in to the shared `demo@leadflow.demo`
account on the server with `DEMO_PASSWORD`. A banner reminds visitors that the data
resets daily.

**What's seeded** ([`lib/demo-data.ts`](lib/demo-data.ts), [`lib/demo-seed.ts`](lib/demo-seed.ts)):
35 leads across every stage (won and lost included) and five sources, spread over
90 days; a stored AI score, reasons, insight and next action for every lead; today's
focus picks; activity timelines; sent and scheduled follow-ups; and two teammates
(Admin and Member) who own part of the pipeline. The workspace is on the Agency plan,
so every feature is unlocked. All AI output is stored, so browsing the demo makes no
Gemini calls. Every name, email (`.example`) and phone number (`555-01xx`) is fictional.

**Seeding and reset.** `npm run seed:demo` builds or rebuilds the demo workspace. It
only ever writes the demo users, the demo workspace and the demo AI-usage counter,
and it refuses to run if a demo email or the demo workspace id belongs to a real
account. Dates are relative to the day it runs, so the data always looks current. A
Vercel Cron job ([`vercel.json`](vercel.json)) calls `/api/cron/demo-reset` daily at
00:00 UTC to undo visitors' changes.

**What visitors can and can't do.** Dragging leads through the pipeline, editing lead
details, adding notes, adding leads and ticking follow-ups all work. Deleting leads,
inviting teammates, joining or creating other workspaces, changing workspace settings,
Stripe checkout and the billing portal are blocked server-side with a friendly message
(`forbidInDemo()` in [`lib/session.ts`](lib/session.ts)). Live AI scoring and insights
are capped at 10 calls per hour, shared by all demo visitors ([`lib/demo-limits.ts`](lib/demo-limits.ts)).
Sign-ups with the reserved `leadflow.demo` / `northwind.demo` domains are rejected.

## Seeding a demo pipeline

`scripts/seed-leads.ts` fills an **existing** account's workspace with 7 realistic
leads across every stage, each with notes, an activity timeline and a follow-up,
so the dashboard, pipeline and analytics look like a CRM in use. Sign up and finish
onboarding first, then:

```bash
npx tsx scripts/seed-leads.ts you@example.com --dry   # preview, writes nothing
npx tsx scripts/seed-leads.ts you@example.com         # insert
npx tsx scripts/check-seed.ts you@example.com         # read-only summary table
```

It is safe to re-run: leads are matched by name and skipped if they already exist.
The seeded scores and reasons are hand-written demo values; click **Re-score with AI**
on a lead to see a real Gemini run.

---

## How the AI features work

All three live in [`lib/gemini.ts`](lib/gemini.ts) and use `generateObject` with a
zod schema, so the model must return typed, validated data rather than free text.
The model is `gemini-flash-latest`, a rolling alias that keeps working as Google
retires dated model versions.

| Feature | Route | Input → output |
| --- | --- | --- |
| **Lead scoring** (`scoreLead`) | `POST /api/leads/[id]/score` | Title, company, source, deal value, stage and notes → `score` 0–100, `priority` HOT/WARM/COLD, one-line summary and 2–4 reasons. Saved on the lead and logged to its timeline |
| **Customer insights** (`generateCustomerInsights`) | `POST /api/leads/[id]/insights` | The lead plus its recent activity → one sharp insight and one concrete next action, saved on the lead |
| **Daily focus** (`recommendDailyFocus`) | `GET /api/recommendations` | The workspace's top 25 open leads → the 3–5 to work today with a reason each. Ids the model returns are checked against the input list, so it cannot invent a lead. Picks are cached on the workspace for 6 hours |

---

## Automated follow-ups

Rule-based and synchronous, so no queue, worker or cron is needed
([`lib/automations.ts`](lib/automations.ts)):

| Trigger | Automation |
| --- | --- |
| A lead is created | "Reach out within 24h" email follow-up due tomorrow, plus a timeline note |
| A lead's stage changes | A "Stage changed from X to Y" entry on the timeline |
| A lead moves to **Qualified** | "Send proposal" task due in 2 days |

---

## Multi-tenancy and security

- **One workspace per account.** Every API route resolves the caller's workspace
  from the session ([`lib/workspace.ts`](lib/workspace.ts)) and scopes every Prisma
  query by `workspaceId`. A lead, activity or follow-up id from another workspace
  returns 403. Isolation is enforced in the application layer (no Postgres RLS).
- **Roles.** Owners and Admins can invite members, rename the workspace and change
  the plan; Members work the pipeline.
- **Route protection.** [`proxy.ts`](proxy.ts) (Next.js 16's name for middleware)
  redirects signed-out visitors away from the app pages using an edge-safe Auth.js
  config; the API routes check the session themselves.
- **Passwords** are hashed with bcrypt; inputs are validated with zod on every route.
- **Stripe webhooks** are verified with the signing secret before anything is written.

---

## Billing

| Plan | Price | Listed features |
| --- | --- | --- |
| Starter | $0 | 500 leads / mo, 1 seat, AI scoring, manual follow-ups |
| Team | $79 / mo | 10,000 leads / mo, 5 seats, automated follow-ups, analytics, AI daily focus |
| Agency | $199 / mo | Unlimited leads, 20 seats, custom scoring weights, priority support |

- **Demo mode (no Stripe keys):** choosing a plan updates the workspace instantly
  with no checkout, so the whole product is clickable without a Stripe account.
- **Stripe test mode:** create two recurring Prices in the
  [Stripe test dashboard](https://dashboard.stripe.com/test/products), fill in the
  `STRIPE_*` variables, and plan changes go through Stripe Checkout. The Customer
  Portal handles cancellations. For local webhooks run
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and put the printed
  secret in `STRIPE_WEBHOOK_SECRET`. The webhook handles
  `checkout.session.completed`, `customer.subscription.updated` and
  `customer.subscription.deleted`.

---

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account (email, password ≥ 8 chars, optional name) |
| `*` | `/api/auth/[...nextauth]` | Auth.js sign-in / sign-out / session |
| `POST` | `/api/workspaces` | Create the user's workspace (onboarding) |
| `GET` | `/api/workspaces/current` | Current workspace and the caller's role |
| `PATCH` | `/api/workspaces/[id]` | Rename / change brand colour (Owner, Admin) |
| `GET` | `/api/workspaces/[id]/members` | Members with roles |
| `GET` `POST` | `/api/workspaces/[id]/invites` | Pending invites / create an invite (Owner, Admin) |
| `GET` `POST` | `/api/invites/[token]` | Read an invite / accept it |
| `GET` `POST` | `/api/leads` | List leads (by score) / create a lead (runs the "lead created" automation) |
| `GET` `PATCH` `DELETE` | `/api/leads/[id]` | Lead with activities and follow-ups / update (stage change runs automations) / delete |
| `POST` | `/api/leads/[id]/activities` | Log a note, email or call |
| `POST` | `/api/leads/[id]/score` | AI score the lead |
| `POST` | `/api/leads/[id]/insights` | AI insight + next action |
| `GET` | `/api/recommendations` | AI daily focus picks |
| `GET` | `/api/followups` | All follow-ups in the workspace |
| `PATCH` | `/api/followups/[id]` | Mark done / not done |
| `GET` | `/api/analytics` | Funnel, sources, score distribution, weekly trend, totals |
| `POST` | `/api/billing/checkout` | Start Stripe Checkout (or switch plan in demo mode) |
| `POST` | `/api/billing/portal` | Open the Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |
| `POST` | `/api/demo/login` | "Try demo": sign in to the shared demo account |
| `GET` | `/api/cron/demo-reset` | Rebuild the demo workspace (Vercel Cron, `CRON_SECRET`) |

---

## Project structure

```
app/
  page.tsx                  Marketing landing page
  login/ signup/            Auth pages
  onboarding/               Create your workspace
  invite/[token]/           Accept a team invite
  (dashboard)/              Signed-in app (Shell + Sidebar layout)
    dashboard/              Stat cards, AI "Focus today", priority leads
    leads/                  Lead table; leads/[id] is the customer profile
    pipeline/               Drag-and-drop kanban
    follow-ups/             Overdue / upcoming / done
    analytics/              Charts
    team/ billing/ settings/
  api/                      Route handlers (see API routes)
components/
  ui/                       Radix-based primitives (button, dialog, select, table, tabs, …)
  landing/                  Landing page sections
  dashboard/                Shell, Sidebar, Topbar
  leads/                    LeadFormDialog, ScoreBadge
  motion/                   Reveal, CountUp
  auth/                     Shared login / sign-up form
lib/
  gemini.ts                 AI scoring, insights, daily focus
  automations.ts            Follow-up rules
  workspace.ts              Tenant resolution and role checks
  auth.ts, auth.config.ts   Auth.js (full config / edge-safe config)
  demo.ts, demo-data.ts,     Public demo account: constants, seeded content,
  demo-seed.ts, demo-limits.ts  reset logic, hourly AI cap
  prisma.ts, stripe.ts, plans.ts, serialize.ts, format.ts, handle-error.ts
  hooks/                    TanStack Query hooks
  generated/prisma/         Generated Prisma client (do not edit)
prisma/
  schema.prisma             Data model
  migrations/               SQL migrations
  seed-demo.ts              `npm run seed:demo`: rebuild the demo workspace
scripts/
  seed-leads.ts             Demo pipeline seeder
  check-seed.ts             Read-only check of seeded data
proxy.ts                    Route protection
vercel.json                 Daily demo-reset cron
```

### Data model

`User` ─< `WorkspaceMember` >─ `Workspace` ─< `Lead` ─< `Activity` / `FollowUp`,
plus `WorkspaceInvite`. Enums: `Role` (OWNER, ADMIN, MEMBER), `WorkspacePlan`
(FREE, TEAM, AGENCY), `LeadStatus` (NEW, CONTACTED, QUALIFIED, WON, LOST),
`LeadPriority` (HOT, WARM, COLD), `ActivityType`, `FollowUpType`.

---

## Deploying to Vercel

The app deploys to the free Hobby tier with no extra configuration.

1. Push the repo to GitHub and import it at https://vercel.com/new. The Next.js
   preset and build command are detected automatically.
2. Add environment variables (Production, and Preview if you want previews to use
   the same database):
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — a new `openssl rand -base64 32` value
   - `GOOGLE_GENERATIVE_AI_API_KEY` — your Gemini key
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL, e.g. `https://lead-flow-ai-six.vercel.app`
   - `STRIPE_*` — optional; leave unset for demo billing. Only test-mode keys are accepted
   - `DEMO_PASSWORD`, `CRON_SECRET` — two long random strings, for the public demo
3. Deploy. `npm run build` runs `prisma migrate deploy` first, so the first deploy
   creates the tables and later deploys apply new migrations.
4. Run `npm run seed:demo` once against the production database to create the demo
   workspace (the daily cron keeps it fresh afterwards).
5. If you use real Stripe Checkout, add a webhook endpoint at
   `https://<your-domain>/api/webhooks/stripe` in the Stripe dashboard and put its
   signing secret in `STRIPE_WEBHOOK_SECRET`.

---

## Known limitations

- **Invites are not emailed.** Creating an invite stores it (valid 14 days), but no
  email is sent and the UI does not show the link. The invitee needs the URL
  `/invite/<token>`, where the token is on the `WorkspaceInvite` row.
- **Plan limits are not enforced.** Lead and seat limits on the pricing table are
  plan copy; the API does not cap them.
- **One workspace per user**, and there is no UI to remove members or change roles yet.
- **No manual follow-up creation.** Follow-ups come from the automations (and the
  seed script); you can complete them but not add your own yet.
- **Free-tier Gemini** has per-minute rate limits; scoring many leads quickly can
  return a rate-limit error. Wait a moment and retry.
