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

| Today | Pipeline |
| --- | --- |
| ![Today page, light theme](public/screens/dashboard-light.png) | ![Pipeline board, dark theme](public/screens/pipeline-dark.png) |
| **Lead profile** | **Analytics** |
| ![Lead profile, dark theme](public/screens/lead-dark.png) | ![Analytics, light theme](public/screens/analytics-light.png) |

Screenshots are taken from the live demo workspace by `npm run screens`.

---

## Contents

- [Features](#features)
- [Design system](#design-system)
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
- [Testing](#testing)
- [Performance](#performance)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Known limitations](#known-limitations)

---

## Features

| Area | What you get |
| --- | --- |
| **Today** | Personal greeting, a ledger of key numbers (open pipeline, hot leads still open, won in the last 30 days vs the 30 before, due today) with the breakdown behind each on hover, Gemini's focus picks, due and overdue follow-ups you can tick off, "needs attention" (hot leads nobody contacted, qualified deals with no task, deals quiet 14+ days, unscored leads), open deals by stage and team activity |
| **Leads** | Search, stage and tier filters, sort by score, value, newest or last change; a table with owner, next follow-up and last change (cards on phones); hover a name to preview the lead |
| **Lead profile** | Stage stepper, timeline grouped by day with a note / call / email composer, AI score with reasons, AI insight and next step, follow-ups, details and notes, edit and delete |
| **Pipeline** | Five columns with value totals; drag cards with mouse, touch or keyboard, or use each card's "Move to" menu; a toast names the follow-up the rules booked, with Undo; instant search and owner filters |
| **Follow-ups** | Overdue / due today / upcoming / done, filter by email, call or task, tick to complete |
| **Analytics** | 30 / 90 days or 12 months: leads added and deals won per week or month, period-over-period comparisons, pipeline by stage, sources with win rate, AI score spread, biggest open deals and a per-owner table. Every chart has a table view |
| **Team** | Members with roles and owned deals, pending invites with a copy-link button, invite form for Owners and Admins |
| **Billing / Settings** | Plan rows with Stripe Checkout and Portal (Owners and Admins); workspace name and brand colour; theme |
| **Everywhere** | Ctrl/Cmd+K command palette (pages, leads, actions), notifications built from real workspace events, light / dark / system themes, mobile navigation drawer |
| **Landing page** | A CSS 3D scroll story of the demo workspace's 35 leads (capture, score, focus, pipeline, follow-ups), live demos that run the app's own rules, real screenshots, honest pricing |

---

## Design system

- **One accent, calm surfaces.** Ochre (`#8a5d00` light, `#e3a940` dark) on cool graphite
  greys. Every colour is a CSS variable with a light and a dark value in
  [`app/globals.css`](app/globals.css); Tailwind utilities read the variable, so one class
  works in both themes. The app sidebar is a dark graphite rail in both themes.
- **Lead heat has its own scale.** Hot = vermilion, Warm = ochre, Cold = slate. Errors,
  overdue and delete use crimson, a clearly different hue from the accent.
- **Contrast is checked, not guessed.** `npm run check:contrast` tests every
  text/background pair in both themes against WCAG AA (4.5:1, 3:1 for icons and large text).
- **Charts** use a fixed categorical order (ochre, blue, rose) validated for colour-blind
  separation, one y-axis, bars that grow from the baseline, rich tooltips and a table view.
  They are small SVG components, not a chart library.
- **Depth** comes from 1px borders, layered surfaces (bg, surface, surface-2) and small
  shadows, with an inset top highlight in dark mode. No gradients, glass or glow.
- **Motion helps, never decorates.** Expo-out easing, 150 to 450 ms. Page changes use view
  transitions; numbers count up (final value in `data-value`); lists rise in, capped at
  15 items; buttons press. Feedback runs outside React with the Web Animations API, on
  pointer input only. Everything is off with `prefers-reduced-motion`.
- **Themes** (light, dark, system) are applied before first paint; switching reveals the
  new theme in a circle from the toggle. Printed pages stay light.
- **Type:** Bricolage Grotesque for headings, Geist for text, Geist Mono for numbers and labels.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, `proxy.ts`, React view transitions), React 19, TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 with CSS-variable tokens, Radix UI primitives, `class-variance-authority`, lucide-react, sonner toasts, next-themes |
| Motion | CSS and the Web Animations API in the app; `motion` (LazyMotion) and Lenis on the landing page only |
| Database | Neon serverless Postgres, Prisma 7 via `@prisma/adapter-neon` (WebSocket driver) |
| Auth | Auth.js (NextAuth v5), Credentials provider, bcrypt (12 rounds), JWT sessions |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/google`), Gemini `gemini-flash-latest` with a `gemini-flash-lite-latest` fallback, structured output with `generateObject` + zod |
| Data fetching | TanStack Query against the app's own Route Handlers, shared query keys for hover prefetch |
| Drag and drop | `@dnd-kit/core` (pointer, touch and keyboard sensors) |
| Payments | Stripe Checkout, Billing Portal and webhooks (test mode only), with a demo-mode fallback |
| Tests | Vitest (logic and API routes), Playwright + axe-core (end to end and accessibility) |

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
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Vitest unit and API-route tests |
| `npm run test:e2e` | Playwright end-to-end and accessibility tests (needs a build) |
| `npm run check:contrast` | WCAG AA check of every colour pair in both themes |
| `npm run verify` | All of the above, in order |
| `npm run screens` | Regenerate the README and landing screenshots from the demo workspace |
| `npm run bundle:report` | First-load JS per route against a running server |
| `npm run seed:demo` | Build or rebuild the public demo workspace |

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
| **Daily focus** (`recommendDailyFocus`) | `GET /api/recommendations` | The workspace's top 25 open leads → up to 5 to work today with a reason each. Ids the model returns are checked against the input list ([`lib/focus.ts`](lib/focus.ts)), so it cannot invent a lead. Picks are cached on the workspace for 6 hours |

**When Gemini is busy or slow.** The main model gets 10 seconds. If it times out or Google
answers 429 or 5xx, the same request goes to `gemini-flash-lite-latest` (also free). Real
errors such as a 400 are not hidden: the API returns 502 with Gemini's message, and "both
models busy" comes back as 503 with a plain explanation, shown inline on the lead. A cancel
from the caller is respected. Unit tests cover the busy, slow, bad-request and cancel cases
([`tests/unit/gemini-fallback.test.ts`](tests/unit/gemini-fallback.test.ts)).

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

| Plan | Price | What it includes |
| --- | --- | --- |
| Starter | $0 | Every feature |
| Team | $79 / mo | Every feature |
| Agency | $199 / mo | Every feature |

No feature is gated and no lead or seat limit is enforced by plan, so the pricing copy
([`lib/plans.ts`](lib/plans.ts)) says exactly that. Only Owners and Admins can change the plan.

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
| `GET` | `/api/workspaces/[id]/summary` | Live counts for the navigation hover cards (any member) |
| `GET` | `/api/workspaces/[id]/activity` | Notifications feed: teammates' stage changes, AI scores, calls and emails, overdue follow-ups and new members (last 14 days) |
| `GET` `POST` | `/api/workspaces/[id]/invites` | Pending invites (the invite-link token only for Owners and Admins) / create an invite (Owner, Admin) |
| `GET` `POST` | `/api/invites/[token]` | Read an invite / accept it |
| `GET` `POST` | `/api/leads` | List leads (by score) / create a lead (runs the "lead created" automation) |
| `GET` `PATCH` `DELETE` | `/api/leads/[id]` | Lead with activities and follow-ups / update (stage change runs automations) / delete |
| `POST` | `/api/leads/[id]/activities` | Log a note, email or call |
| `POST` | `/api/leads/[id]/score` | AI score the lead |
| `POST` | `/api/leads/[id]/insights` | AI insight + next action |
| `GET` | `/api/recommendations` | AI daily focus picks |
| `GET` | `/api/followups` | All follow-ups in the workspace |
| `PATCH` | `/api/followups/[id]` | Mark done / not done |
| `GET` | `/api/analytics?days=30\|90\|365` | Funnel, sources with win rate, score spread, trend, this period vs the previous one (close dates from the timeline), biggest open deals, per-owner totals |
| `POST` | `/api/billing/checkout` | Start Stripe Checkout (or switch plan in demo mode) |
| `POST` | `/api/billing/portal` | Open the Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |
| `POST` | `/api/demo/login` | "Try demo": sign in to the shared demo account |
| `GET` | `/api/cron/demo-reset` | Rebuild the demo workspace (Vercel Cron, `CRON_SECRET`) |

---

## Testing

```bash
npm run verify      # contrast, lint, typecheck, unit tests, build, end-to-end
```

- **Unit and API tests (Vitest, `tests/unit`).** The pure rules shared by the app and the
  landing demos (follow-up automations, focus candidates, analytics), the Gemini fallback,
  and the newer API routes: signed out (401), not a member (403), workspace scoping, roles
  (invite tokens only for Owners and Admins), demo guardrails and bad input (400).
- **End to end (Playwright, `tests/e2e`).** Public pages, the landing story and its live
  demos (including with JavaScript off and with reduced motion), the app shell, Today,
  Analytics, the pipeline, leads and lead profile, and every remaining page.
- **Accessibility.** An axe WCAG 2.1 AA scan of every page and every dialog, menu, hover
  card and drawer, in both themes, after animations finish. A check also fails if a page
  scrolls sideways at 390px.
- **Which database.** Signed-in tests use the shared demo account on the database in
  `.env`, read-only: nothing is dragged, submitted, ticked or deleted, and the AI routes
  are answered locally, so no Gemini calls are made. Two workers, one retry and a warm-up
  step keep the remote database from causing timeouts.
- **Review screenshots.** `SCREENS_DIR=./shots SCREENS=shell,landing,data,workflow,remaining
  npx playwright test --project=screens` captures every screen in light and dark, with
  menus, hover cards, a mid-drag frame and phone width.

---

## Performance

First-load JavaScript per route (gzip), measured with `npm run bundle:report` against a
production build, before the redesign and after it.

| Route | Before | After | Change |
| --- | ---: | ---: | ---: |
| `/` | 266.4 kB | 290.8 kB | +24.4 kB |
| `/login` | 261.6 kB | 239.3 kB | -22.3 kB |
| `/signup` | 261.6 kB | 239.3 kB | -22.3 kB |
| `/this-page-does-not-exist` | 201.9 kB | 225.8 kB | +23.9 kB |
| `/dashboard` | 281.2 kB | 298.3 kB | +17.1 kB |
| `/leads` | 266.4 kB | 304.3 kB | +37.9 kB |
| `/leads/demo-lead-01` | 315.2 kB | 307.3 kB | -7.9 kB |
| `/pipeline` | 266.3 kB | 309.3 kB | +43.0 kB |
| `/follow-ups` | 252.7 kB | 295.1 kB | +42.4 kB |
| `/analytics` | 358.1 kB | 297.0 kB | -61.1 kB |
| `/team` | 263.8 kB | 294.0 kB | +30.2 kB |
| `/billing` | 252.5 kB | 291.6 kB | +39.1 kB |
| `/settings` | 253.9 kB | 292.6 kB | +38.7 kB |

- Analytics is about 61 kB lighter: Recharts was replaced by small SVG chart components.
  date-fns, tw-animate-css and several unused Radix packages are gone too.
- The 3D landing scene and the command palette are separate chunks, loaded on demand
  (the scene when the story scrolls into view, the palette on first Ctrl/Cmd+K or when idle).
- The app pages carry a richer shell than before (live hover previews, notifications,
  account menu, theme switch), which is most of their increase.
- After sign-in, every page's code is prefetched while the browser is idle; hovering a nav
  item also prefetches that page's data.

---

## Project structure

```
app/
  page.tsx                  Landing page (CSS 3D story, live demos, pricing, FAQ)
  login/ signup/            Auth pages; onboarding/; invite/[token]/; not-found; error
  (dashboard)/              Signed-in app: dashboard (Today), leads, leads/[id], pipeline,
                            follow-ups, analytics, team, billing, settings
  api/                      Route handlers (see API routes)
components/
  ui/                       Primitives: button, dialog/sheet, menu, select, segmented,
                            hover-card, animated-number, primitives (panel, badge, ...)
  dashboard/                Shell, Sidebar (rail), AppBar, CommandPalette, Notifications,
                            UserMenu, nav
  data/ charts/             Ledger, Delta; ColumnChart, BarRows, ChartPanel (chart/table)
  leads/                    LeadFormDialog, LeadHoverCard, ScoreBadge
  landing/                  Nav, Footer, Story + scene/ (CSS 3D), demos/, ScreenTabs, TiltShot
  auth/ demo/ layout/ brand/
lib/
  automation-rules.ts       Follow-up rules (pure; used by the API and the landing demo)
  focus.ts                  Focus candidates and pick checks (pure)
  analytics-calc.ts         Analytics maths (pure)
  automations.ts            Writes the rules' follow-ups and timeline entries
  gemini.ts                 AI scoring, insights, daily focus, timeout + fallback
  activity.ts, workspace-summary.ts   Notifications feed and nav counts
  queries.ts                Shared TanStack Query keys and fetchers
  workspace.ts, session.ts, auth*.ts, demo*.ts, plans.ts, stripe.ts, press.ts, time.ts, ...
scripts/                    check-contrast, bundle-report, screens, seed scripts
tests/unit/ tests/e2e/      Vitest and Playwright suites
prisma/                     Schema, migrations, demo seed
```

### Data model

`User` ─< `WorkspaceMember` >─ `Workspace` ─< `Lead` ─< `Activity` / `FollowUp`,
plus `WorkspaceInvite` and `DemoUsage`. Enums: `Role` (OWNER, ADMIN, MEMBER),
`WorkspacePlan` (FREE, TEAM, AGENCY), `LeadStatus` (NEW, CONTACTED, QUALIFIED, WON, LOST),
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

- **Invites are not emailed.** Creating an invite stores it (valid 14 days); Owners and
  Admins copy its link from the Team page and send it themselves.
- **Plan limits are not enforced.** Every plan includes every feature, and the pricing says so.
- **One workspace per user**, and there is no way yet to remove members or change roles
  (the API doesn't support it).
- **No manual follow-up creation.** Follow-ups come from the automations (and the seed
  scripts); you can complete them but not add your own yet.
- **Free-tier Gemini** has per-minute limits. The app falls back to a lighter model when the
  main one is busy; if both are busy it says so and you can retry a minute later.
