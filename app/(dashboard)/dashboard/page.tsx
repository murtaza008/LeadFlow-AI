"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Check,
  Flame,
  Gauge,
  Hourglass,
  KanbanSquare,
  Plus,
  UserRoundSearch,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { HoverCard, HoverStats } from "@/components/ui/hover-card";
import { Ledger } from "@/components/data/Ledger";
import { Delta } from "@/components/data/Delta";
import { Legend, type Series } from "@/components/charts/ColumnChart";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { LeadHoverCard } from "@/components/leads/LeadHoverCard";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useToggleFollowUp, type FollowUpWithLead } from "@/lib/hooks/use-followups";
import type { Lead } from "@/lib/hooks/use-leads";
import { q } from "@/lib/queries";
import { formatCurrency, statusLabel } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { activityIcons } from "@/components/dashboard/Notifications";
import type { ActivityEvent } from "@/lib/activity";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;
const isOpen = (l: Lead) => l.status !== "WON" && l.status !== "LOST";

function greeting(now: Date) {
  const h = now.getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function change(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 100);
}

const STAGE_SERIES: Series[] = [
  { key: "NEW", label: "New", color: "var(--chart-1)" },
  { key: "CONTACTED", label: "Contacted", color: "var(--chart-2)" },
  { key: "QUALIFIED", label: "Qualified", color: "var(--chart-3)" },
];

export default function TodayPage() {
  const { data: session } = useSession();
  const { data: ws } = useCurrentWorkspace();
  const leadsQ = useQuery(q.leads());
  const followQ = useQuery(q.followups());
  const analyticsQ = useQuery(q.analytics(30));
  const leads = useMemo(() => leadsQ.data ?? [], [leadsQ.data]);
  const focusQ = useQuery({ ...q.focus(), enabled: leads.length > 0 });
  const activityQ = useQuery({ ...q.activity(ws?.id ?? ""), enabled: !!ws });

  const now = useMemo(() => new Date(), []);
  const name = (session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "").split(" ")[0];
  const byId = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const open = leads.filter(isOpen);
  const hotOpen = open.filter((l) => l.priority === "HOT");
  const openValue = open.reduce((s, l) => s + l.value, 0);

  const followups = followQ.data ?? [];
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const due = followups
    .filter((f) => !f.done && new Date(f.dueAt) <= endOfToday)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const overdue = due.filter((f) => new Date(f.dueAt) < now);

  const period = analyticsQ.data?.period;
  const loading = leadsQ.isLoading || followQ.isLoading;

  const dateLine = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-1.5">{dateLine}</p>
          <h1 className="text-[28px] font-semibold leading-tight text-fg md:text-[32px]">
            {greeting(now)}
            {name ? `, ${name}` : ""}.
          </h1>
          <p className="mt-1.5 text-[14.5px] text-fg-muted">
            {loading
              ? "Loading your day…"
              : due.length === 0
                ? "Nothing is due today. A good day to work your hot leads."
                : `${due.length} follow-up${due.length === 1 ? "" : "s"} to do today${overdue.length ? `, ${overdue.length} of them overdue` : ""}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pipeline" data-press="" className={buttonVariants({ variant: "secondary" })}>
            <KanbanSquare aria-hidden /> Open pipeline
          </Link>
          <Link href="/leads?new=1" data-press="" className={buttonVariants({ variant: "primary" })}>
            <Plus aria-hidden /> Add a lead
          </Link>
        </div>
      </header>

      {!loading && leads.length === 0 ? (
        <div className="panel mt-8">
          <EmptyState
            icon={<UserRoundSearch />}
            title="Your pipeline is empty"
            description="Add your first lead. LeadFlow books a follow-up for it right away, and you can score it with AI from its profile."
            action={
              <Link href="/leads?new=1" className={buttonVariants({ variant: "primary" })}>
                Add a lead
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <Ledger
            className="mt-8"
            loading={loading}
            items={[
              {
                label: "Open pipeline",
                value: openValue,
                format: formatCurrency,
                foot: <span>Across {open.length} open deals</span>,
                breakdown: (
                  <HoverStats
                    rows={(["NEW", "CONTACTED", "QUALIFIED"] as const).map((s) => {
                      const inStage = open.filter((l) => l.status === s);
                      return { label: statusLabel[s], value: `${inStage.length} · ${formatCurrency(inStage.reduce((t, l) => t + l.value, 0))}` };
                    })}
                  />
                ),
              },
              {
                label: "Hot leads still open",
                value: hotOpen.length,
                foot: <span>Scored Hot by the AI</span>,
                breakdown: (
                  <>
                    <HoverStats
                      rows={(["NEW", "CONTACTED", "QUALIFIED"] as const).map((s) => ({
                        label: statusLabel[s],
                        value: hotOpen.filter((l) => l.status === s).length,
                      }))}
                    />
                    <p className="mt-2 text-[12.5px] text-fg-muted">Hot in New means nobody has contacted them yet.</p>
                  </>
                ),
              },
              {
                label: "Won, last 30 days",
                value: period ? period.current.wonValue : null,
                format: formatCurrency,
                foot: period && (
                  <>
                    <Delta value={change(period.current.wonValue, period.previous.wonValue)} good="up" />
                    <span>vs previous 30 days</span>
                  </>
                ),
                breakdown: period && (
                  <HoverStats
                    rows={[
                      { label: "Deals won", value: period.current.won },
                      { label: "Deals lost", value: period.current.lost },
                      { label: "Won, previous 30 days", value: formatCurrency(period.previous.wonValue) },
                    ]}
                  />
                ),
              },
              {
                label: "Due today",
                value: due.length,
                foot: overdue.length ? (
                  <span className="font-medium text-danger-text">{overdue.length} overdue</span>
                ) : (
                  <span>None overdue</span>
                ),
                breakdown: (
                  <HoverStats
                    rows={[
                      { label: "Overdue", value: overdue.length },
                      { label: "Due later today", value: due.length - overdue.length },
                      { label: "Open in total", value: followups.filter((f) => !f.done).length },
                    ]}
                  />
                ),
              },
            ]}
          />

          <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <FocusPanel loading={focusQ.isLoading || leadsQ.isLoading} picks={focusQ.data?.picks ?? []} note={focusQ.data?.error ?? (focusQ.isError ? focusQ.error.message : undefined)} byId={byId} />
              <DuePanel items={due} now={now} byId={byId} loading={followQ.isLoading} />
            </div>
            <div className="space-y-6">
              <AttentionPanel leads={leads} followups={followups} now={now} loading={loading} />
              <StageMix leads={open} loading={loading} />
              <ActivityPanel events={activityQ.data} loading={activityQ.isLoading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ id, title, description, action, children }: { id: string; title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="panel p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[15px] font-semibold text-fg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
        </div>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FocusPanel({
  picks,
  loading,
  note,
  byId,
}: {
  picks: { leadId: string; reason: string; name: string; company: string | null; score: number; value: number }[];
  loading: boolean;
  note?: string;
  byId: Map<string, Lead>;
}) {
  return (
    <Panel id="focus" title="Today's focus" description="Picked by Gemini from your 25 highest-scoring open leads">
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : note ? (
        <p className="text-[14px] text-fg-muted">{note}</p>
      ) : picks.length === 0 ? (
        <p className="text-[14px] text-fg-muted">No open leads to pick from. Add a lead or reopen a deal.</p>
      ) : (
        <ol className="stagger -mx-2 divide-y divide-border">
          {picks.map((p, i) => {
            const lead = byId.get(p.leadId);
            return (
              <li key={p.leadId} style={staggerStyle(i)} className="grid grid-cols-[20px_minmax(0,1fr)_auto] gap-3 px-2 py-3">
                <span className="pt-0.5 font-mono text-[12px] text-fg-muted">{i + 1}</span>
                <div className="min-w-0">
                  <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[14px]">
                    {lead ? <LeadHoverCard lead={lead} /> : <span className="truncate font-medium">{p.name}</span>}
                    {p.company && <span className="truncate text-fg-muted max-sm:basis-full max-sm:text-[13px]">· {p.company}</span>}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{p.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ScoreBadge score={p.score} priority={lead?.priority} size="sm" />
                  <span className="tabular text-[12px] text-fg-muted">{formatCurrency(p.value)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

function DuePanel({ items, now, byId, loading }: { items: FollowUpWithLead[]; now: Date; byId: Map<string, Lead>; loading: boolean }) {
  const toggle = useToggleFollowUp();
  return (
    <Panel
      id="due"
      title="Due today"
      description="Follow-ups due by the end of today, oldest first"
      action={
        <Link href="/follow-ups" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline">
          All follow-ups <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      }
    >
      {loading ? (
        <Skeleton className="h-32" />
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 text-[14px] text-fg-muted">
          <CalendarCheck2 aria-hidden className="size-4 text-success-text" /> All caught up for today.
        </p>
      ) : (
        <ul className="stagger -mx-2 divide-y divide-border">
          {items.slice(0, 8).map((f, i) => {
            const late = new Date(f.dueAt) < now;
            const lead = byId.get(f.leadId);
            return (
              <li key={f.id} style={staggerStyle(i)} className="flex items-center gap-3 px-2 py-2.5">
                <button
                  type="button"
                  data-press=""
                  disabled={toggle.isPending}
                  aria-label={`Mark done: ${f.title} (${f.lead.name})`}
                  onClick={() => toggle.mutate({ id: f.id, done: true })}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border-strong text-transparent transition-colors hover:border-success-text hover:text-success-text"
                >
                  <Check aria-hidden className="size-3.5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] text-fg">{f.title}</p>
                  <p className="flex min-w-0 items-center gap-1 text-[12.5px] text-fg-muted">
                    {lead ? <LeadHoverCard lead={lead} className="font-normal text-fg-muted" /> : <span className="truncate">{f.lead.name}</span>}
                    {f.lead.company && <span className="truncate">· {f.lead.company}</span>}
                  </p>
                </div>
                <span className={cn("shrink-0 text-[12.5px]", late ? "font-medium text-danger-text" : "text-fg-muted")}>
                  {late ? `Overdue ${timeAgo(f.dueAt, now).replace(" ago", "")}` : "Today"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {items.length > 8 && (
        <p className="mt-3 text-[13px] text-fg-muted">
          and {items.length - 8} more in{" "}
          <Link href="/follow-ups" className="prose-link">
            Follow-ups
          </Link>
          .
        </p>
      )}
    </Panel>
  );
}

function AttentionPanel({ leads, followups, now, loading }: { leads: Lead[]; followups: FollowUpWithLead[]; now: Date; loading: boolean }) {
  const openFollow = new Set(followups.filter((f) => !f.done).map((f) => f.leadId));
  const rows = [
    {
      key: "hot-new",
      icon: Flame,
      tone: "text-hot-text",
      title: "Hot leads nobody has contacted",
      leads: leads.filter((l) => l.priority === "HOT" && l.status === "NEW"),
    },
    {
      key: "qualified-no-task",
      icon: BellRing,
      tone: "text-accent-text",
      title: "Qualified with no open follow-up",
      leads: leads.filter((l) => l.status === "QUALIFIED" && !openFollow.has(l.id)),
    },
    {
      key: "quiet",
      icon: Hourglass,
      tone: "text-fg-muted",
      title: "Open deals quiet for 14+ days",
      leads: leads.filter((l) => isOpen(l) && now.getTime() - new Date(l.updatedAt).getTime() > 14 * DAY),
    },
    {
      key: "unscored",
      icon: Gauge,
      tone: "text-cold-text",
      title: "Leads without an AI score",
      leads: leads.filter((l) => !l.scoredAt),
    },
  ].filter((r) => r.leads.length > 0);

  return (
    <Panel id="attention" title="Needs attention" description="Worked out from your leads and follow-ups">
      {loading ? (
        <Skeleton className="h-28" />
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-[14px] text-fg-muted">
          <Check aria-hidden className="size-4 text-success-text" /> Nothing stands out right now.
        </p>
      ) : (
        <ul className="stagger space-y-3">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={r.key} style={staggerStyle(i)} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
                  <Icon aria-hidden className={cn("size-4 shrink-0", r.tone)} />
                  <span className="flex-1">{r.title}</span>
                  <span className="tabular rounded-full bg-sunken px-2 text-[12px] text-fg-muted">{r.leads.length}</span>
                </p>
                <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-6 text-[13px]">
                  {r.leads.slice(0, 3).map((l) => (
                    <LeadHoverCard key={l.id} lead={l} className="font-normal text-fg-muted" />
                  ))}
                  {r.leads.length > 3 && <span className="text-fg-muted">+{r.leads.length - 3} more</span>}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function StageMix({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  const total = leads.length || 1;
  const parts = STAGE_SERIES.map((s) => {
    const inStage = leads.filter((l) => l.status === s.key);
    return { ...s, count: inStage.length, value: inStage.reduce((t, l) => t + l.value, 0) };
  });
  return (
    <Panel
      id="mix"
      title="Open deals by stage"
      description={`${leads.length} open deals`}
      action={
        <Link href="/analytics" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-text hover:underline">
          Analytics <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      }
    >
      {loading ? (
        <Skeleton className="h-16" />
      ) : (
        <>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={parts.map((p) => `${p.label} ${p.count}`).join(", ")}>
            {parts.map((p) =>
              p.count ? (
                <HoverCard
                  key={p.key}
                  trigger={<span className="grow-x block h-full" style={{ width: `${(p.count / total) * 100}%`, background: p.color }} />}
                  side="top"
                  width={220}
                >
                  <p className="font-medium">{p.label}</p>
                  <HoverStats rows={[{ label: "Deals", value: p.count }, { label: "Value", value: formatCurrency(p.value) }]} />
                </HoverCard>
              ) : null,
            )}
          </div>
          <div className="mt-3">
            <Legend series={STAGE_SERIES} />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
            {parts.map((p) => (
              <div key={p.key}>
                <dt className="text-fg-muted">{p.label}</dt>
                <dd className="tabular font-medium text-fg">
                  {p.count} · {formatCurrency(p.value)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </Panel>
  );
}

function ActivityPanel({ events: all, loading }: { events?: ActivityEvent[]; loading: boolean }) {
  // Overdue follow-ups are already in "Due today"; this panel is what people did.
  const events = all?.filter((e) => e.type !== "followup.overdue");
  return (
    <Panel id="activity" title="Team activity" description="What teammates did in the last 14 days">
      {loading ? (
        <Skeleton className="h-28" />
      ) : !events || events.length === 0 ? (
        <p className="text-[14px] text-fg-muted">Nothing yet. Teammates&rsquo; calls, stage changes and AI scores appear here.</p>
      ) : (
        <ul className="stagger space-y-3">
          {events.slice(0, 5).map((e, i) => {
            const { icon: Icon, tone } = activityIcons[e.type];
            return (
            <li key={e.id} style={staggerStyle(i)} className="flex gap-3">
              <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone)} />
              <div className="min-w-0">
                <Link href={e.href} className="block truncate text-[13.5px] font-medium text-fg hover:underline">
                  {e.title}
                </Link>
                <p className="truncate text-[12.5px] text-fg-muted">
                  {e.detail ? `${e.detail} · ` : ""}
                  {timeAgo(e.at)}
                </p>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
