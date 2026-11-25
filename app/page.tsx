import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { Story } from "@/components/landing/Story";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { LandingMotion, Reveal } from "@/components/landing/Reveal";
import { ScreenTabs, type Screen } from "@/components/landing/ScreenTabs";
import { FollowUpDemo } from "@/components/landing/demos/FollowUpDemo";
import { FocusDemo } from "@/components/landing/demos/FocusDemo";
import { FunnelDemo } from "@/components/landing/demos/FunnelDemo";
import { TryDemoButton } from "@/components/demo/TryDemoButton";
import { buttonVariants } from "@/components/ui/button";
import { EVERY_PLAN, PLAN_DETAILS, type PlanKey } from "@/lib/plans";
import { DEMO_AI_CALLS_PER_HOUR } from "@/lib/demo";
import { FOCUS_CANDIDATES, FOCUS_MAX_PICKS, FOCUS_TTL_HOURS, focusCandidates } from "@/lib/focus";
import { formatCurrency } from "@/lib/format";
import { SCENE_FOCUS, SCENE_LEADS } from "@/components/landing/scene/leads";
import { cn } from "@/lib/utils";
import dashboardLight from "@/public/screens/dashboard-light.png";
import dashboardDark from "@/public/screens/dashboard-dark.png";
import pipelineLight from "@/public/screens/pipeline-light.png";
import pipelineDark from "@/public/screens/pipeline-dark.png";
import leadLight from "@/public/screens/lead-light.png";
import leadDark from "@/public/screens/lead-dark.png";
import analyticsLight from "@/public/screens/analytics-light.png";
import analyticsDark from "@/public/screens/analytics-dark.png";

const HEADLINE = "Know which leads to call today.";

export default function Landing() {
  return (
    <LandingMotion>
      <SmoothScroll />
      <Nav />
      <main id="main">
        <Hero />
        <Story />
        <Features />
        <Numbers />
        <Inside />
        <Pricing />
        <FAQ />
        <Closing />
      </main>
      <Footer />
    </LandingMotion>
  );
}

/* ---------- hero: headline left, the demo's real focus list right ---------- */

const heat = (score: number) =>
  score >= 70
    ? { label: "Hot", bar: "bg-hot", text: "text-hot-text" }
    : score >= 40
      ? { label: "Warm", bar: "bg-accent", text: "text-accent-text" }
      : { label: "Cold", bar: "bg-cold", text: "text-cold-text" };

function Hero() {
  const words = HEADLINE.split(" ");
  const open = focusCandidates(SCENE_LEADS).length;
  const picks = SCENE_FOCUS.map((p) => ({ ...p, lead: SCENE_LEADS.find((l) => l.id === p.leadId)! }));
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="rise inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12.5px] text-fg-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Sales CRM with AI lead scoring
        </p>
        <h1 className="word-reveal mt-5 text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-fg sm:text-[60px] lg:text-[72px]">
          {words.map((w, i) => (
            <Fragment key={i}>
              {/* The space sits outside the inline-block word, or it collapses. */}
              <span style={{ "--w": i } as React.CSSProperties}>{w}</span>
              {i < words.length - 1 ? " " : null}
            </Fragment>
          ))}
        </h1>
        <p className="rise mt-6 max-w-xl text-[17px] leading-relaxed text-fg-muted [animation-delay:380ms]">
          LeadFlow asks Google Gemini to score every lead from 0 to 100 and explain why, picks the few worth your time
          today, and books the follow-ups when a deal moves.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:460ms]">
          <Link href="/signup" data-press="" className={buttonVariants({ variant: "primary", size: "lg" })}>
            Start free
          </Link>
          <TryDemoButton label="Open the live demo" size="lg" />
        </div>
        <p className="rise mt-4 text-[13px] text-fg-muted [animation-delay:520ms]">
          No sign-up for the demo. It&rsquo;s a shared workspace with {SCENE_LEADS.length} sample leads that resets every day.
        </p>
      </div>

      <Reveal delay={0.15}>
        <figure className="panel-raised overflow-hidden">
          <figcaption className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <span>
              <span className="block text-[14px] font-semibold text-fg">Today&rsquo;s focus</span>
              <span className="block text-[12.5px] text-fg-muted">
                Northwind Digital demo · {picks.length} picks from {open} open leads
              </span>
            </span>
            <span className="eyebrow">Gemini</span>
          </figcaption>
          <ol className="stagger divide-y divide-border">
            {picks.map((p, i) => {
              const h = heat(p.lead.score);
              return (
                <li key={p.leadId} className="grid grid-cols-[22px_1fr_auto] gap-3 px-5 py-3.5" style={{ "--i": i + 4 } as React.CSSProperties}>
                  <span className="pt-0.5 font-mono text-[12px] text-fg-muted">{i + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-fg">
                      {p.lead.name} <span className="font-normal text-fg-muted">· {p.lead.company}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-fg-muted">{p.reason}</span>
                  </span>
                  <span className="flex w-16 flex-col items-end gap-1.5 pt-0.5">
                    <span className={cn("tabular font-mono text-[13px] font-medium", h.text)}>
                      {p.lead.score}
                      <span className="sr-only"> out of 100, {h.label}</span>
                    </span>
                    <span aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-sunken">
                      <span className={cn("grow-x block h-full rounded-full", h.bar)} style={{ width: `${p.lead.score}%` }} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="border-t border-border bg-surface-2 px-5 py-2.5 text-[12px] text-fg-muted">
            Real picks stored in the demo workspace, with Gemini&rsquo;s reasons.
          </p>
        </figure>
      </Reveal>
    </section>
  );
}

/* ---------- features: zig-zag rows, each with a live demo ---------- */

const demos = [
  {
    title: "Follow-ups book themselves",
    body: "Move the lead between stages. These are the rules the app runs when you drag a card on the pipeline: a new lead gets an email follow-up, a qualified one gets a proposal task.",
    file: "lib/automation-rules.ts",
    demo: <FollowUpDemo />,
  },
  {
    title: "Gemini only picks from your list",
    body: "Mark a lead as won and it leaves the list sent to Gemini. When the model answers, any pick that wasn't in that list is thrown away, so it can't invent a lead.",
    file: "lib/focus.ts",
    demo: <FocusDemo />,
  },
  {
    title: "Your funnel, recalculated",
    body: "The demo workspace's 35 leads, run through the same function that draws the Analytics page. Win or lose a deal and the numbers update.",
    file: "lib/analytics-calc.ts",
    demo: <FunnelDemo />,
  },
];

function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <Reveal className="max-w-2xl">
        <h2 id="features-title" className="text-[32px] font-semibold leading-tight text-fg md:text-[42px]">
          Try the logic behind it, right here.
        </h2>
        <p className="mt-3 text-[16px] text-fg-muted">Each panel runs the app&rsquo;s own code in your browser. Nothing below is a recording.</p>
      </Reveal>
      <div className="mt-16 space-y-20 md:space-y-28">
        {demos.map((d, i) => (
          <div key={d.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
            <Reveal className={cn(i % 2 === 1 && "md:order-2")}>
              <p className="font-mono text-[13px] text-accent-text">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-[24px] font-semibold leading-snug text-fg md:text-[28px]">{d.title}</h3>
              <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-fg-muted">{d.body}</p>
              <p className="mt-5 inline-flex rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-[12px] text-fg-muted">
                runs {d.file}
              </p>
            </Reveal>
            <Reveal delay={0.08} className="panel h-[440px] p-5">
              {d.demo}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- numbers: a spec sheet ---------- */

const facts = [
  { value: "0–100", label: "AI score on every lead, with a Hot, Warm or Cold tier and a one-line summary" },
  { value: "2–4", label: "Written reasons behind each score, saved on the lead's timeline" },
  { value: String(FOCUS_CANDIDATES), label: "Highest-scoring open leads that Gemini reviews for today's focus" },
  { value: String(FOCUS_MAX_PICKS), label: `Focus picks at most, each with a reason, reused for ${FOCUS_TTL_HOURS} hours` },
  { value: "5", label: "Pipeline stages: New, Contacted, Qualified, Won and Lost" },
  { value: "3", label: "Roles in a workspace: Owner, Admin and Member" },
];

function Numbers() {
  return (
    <section aria-labelledby="numbers-title" className="border-y border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 id="numbers-title" className="text-[28px] font-semibold leading-tight text-fg md:text-[34px]">
            The numbers behind it
          </h2>
          <p className="mt-3 max-w-sm text-[15px] text-fg-muted">
            Straight from the code, not from a marketing deck. Open the demo and you&rsquo;ll see each one.
          </p>
        </Reveal>
        <dl className="border-t border-border">
          {facts.map((f) => (
            <div key={f.label} className="grid grid-cols-[96px_1fr] items-baseline gap-4 border-b border-border py-4 md:grid-cols-[120px_1fr]">
              <dt className="order-2 text-[14.5px] leading-snug text-fg-muted">{f.label}</dt>
              <dd className="tabular order-1 font-display text-[30px] font-semibold leading-none text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------- inside the app: real screenshots, one tab per screen ---------- */

const screens: Screen[] = [
  {
    id: "today",
    label: "Today",
    caption: "Hot leads, open pipeline value, today's focus picks and the leads with the highest scores.",
    light: dashboardLight,
    dark: dashboardDark,
    alt: "LeadFlow's Today page in the demo workspace",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    caption: "Five columns with each deal's score and value. Drag a card and the rules run.",
    light: pipelineLight,
    dark: pipelineDark,
    alt: "The pipeline board in the demo workspace, with leads in five columns",
  },
  {
    id: "lead",
    label: "Lead profile",
    caption: "The score and its reasons, Gemini's insight and next step, the timeline and the follow-ups.",
    light: leadLight,
    dark: leadDark,
    alt: "A lead profile in the demo workspace with its AI score, reasons and timeline",
  },
  {
    id: "analytics",
    label: "Analytics",
    caption: "The funnel by count and value, lead sources, score spread and weekly wins.",
    light: analyticsLight,
    dark: analyticsDark,
    alt: "The analytics page in the demo workspace",
  },
];

function Inside() {
  return (
    <section id="inside" aria-labelledby="inside-title" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
      <Reveal className="mb-8 max-w-2xl">
        <h2 id="inside-title" className="text-[32px] font-semibold leading-tight text-fg md:text-[42px]">
          The screens your team works in.
        </h2>
      </Reveal>
      <ScreenTabs screens={screens} />
    </section>
  );
}

/* ---------- pricing: one row per plan ---------- */

function Pricing() {
  const plans = Object.entries(PLAN_DETAILS) as [PlanKey, (typeof PLAN_DETAILS)[PlanKey]][];
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <h2 id="pricing-title" className="text-[32px] font-semibold leading-tight text-fg md:text-[42px]">
            Every plan gets the whole product.
          </h2>
          <p className="mt-3 text-[15.5px] text-fg-muted">No feature is locked to a plan. On every plan:</p>
          <ul className="mt-5 space-y-2 text-[14.5px] text-fg">
            {EVERY_PLAN.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
        <div>
          <ul className="panel divide-y divide-border overflow-hidden">
            {plans.map(([key, p]) => (
              <li key={key} className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="flex items-baseline gap-3 text-[18px] font-semibold text-fg">
                    {p.name}
                    <span className="tabular font-display text-[28px] font-semibold text-fg">
                      {p.price === 0 ? "Free" : `$${p.price}`}
                    </span>
                    {p.price > 0 && <span className="text-[13px] font-normal text-fg-muted">a month</span>}
                  </h3>
                  <p className="mt-1 text-[14px] text-fg-muted">{p.tagline}</p>
                  <p className="mt-2 text-[13px] text-fg-muted">{p.features.join(" · ")}</p>
                </div>
                <Link
                  href="/signup"
                  data-press=""
                  className={buttonVariants({ variant: key === "FREE" ? "primary" : "secondary", className: "sm:w-40" })}
                >
                  {p.price === 0 ? "Start free" : `Choose ${p.name}`}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] text-fg-muted">
            This is a portfolio deployment: paid plans go through Stripe in test mode, or switch instantly when Stripe
            isn&rsquo;t set up. No real card is ever charged.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- questions: all open, two columns ---------- */

const faqs = [
  {
    q: "How does the AI score a lead?",
    a: "LeadFlow sends Gemini the lead's title, company, source, deal value, stage and notes. It returns a score from 0 to 100, a Hot, Warm or Cold tier, a one-line summary and 2 to 4 reasons, saved on the lead and its timeline.",
  },
  {
    q: "What creates a follow-up?",
    a: "Two rules. Adding a lead books a \"Reach out within 24h\" email. Moving a lead to Qualified books a \"Send proposal\" task due in 2 days. Every stage change is also written to the timeline.",
  },
  {
    q: "Can my team share one pipeline?",
    a: "Yes. A workspace has Owner, Admin and Member roles. Owners and admins invite teammates and manage the workspace; everyone works the same leads, follow-ups and analytics.",
  },
  {
    q: "What happens without a Gemini key?",
    a: "Leads, pipeline, follow-ups and analytics keep working. Scoring, insights and today's focus say AI isn't set up until you add a free Gemini API key.",
  },
  {
    q: "Can I try it without signing up?",
    a: `Yes. The live demo is a shared workspace with ${SCENE_LEADS.length} sample leads, a team of three and a few weeks of activity. Deleting leads and inviting people are off, live AI is limited to ${DEMO_AI_CALLS_PER_HOUR} calls an hour for everyone, and the data resets daily.`,
  },
  {
    q: "Where does my data live?",
    a: "In one Postgres database. Every request is checked against your workspace, so a lead, activity or follow-up from another workspace is refused.",
  },
];

function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-border bg-surface-2">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 id="faq-title" className="text-[28px] font-semibold leading-tight text-fg md:text-[34px]">
          Questions people ask
        </h2>
        <div className="mt-10 grid gap-x-12 gap-y-9 md:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-[16px] font-semibold text-fg">{f.q}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-fg-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- closing: an inverse band ---------- */

function Closing() {
  const openValue = SCENE_LEADS.filter((l) => l.status !== "WON" && l.status !== "LOST").reduce((s, l) => s + l.value, 0);
  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
      <Reveal className="rounded-2xl bg-inverse px-6 py-14 text-center text-inverse-fg sm:px-12">
        <h2 className="mx-auto max-w-2xl text-[30px] font-semibold leading-tight md:text-[40px]">
          Open the demo and work {formatCurrency(openValue)} of pipeline.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15.5px] text-inverse-muted">
          Drag deals, log a call, tick a follow-up. Or start your own workspace and add your first lead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <TryDemoButton label="Open the live demo" variant="primary" size="lg" />
          <Link href="/signup" data-press="" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Start free <ArrowRight aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
