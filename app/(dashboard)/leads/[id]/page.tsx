"use client";

import { use, useMemo, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Gauge,
  Lightbulb,
  Loader2,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  StickyNote,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LeadFormDialog } from "@/components/leads/LeadFormDialog";
import { useCurrentWorkspace } from "@/lib/hooks/use-current-workspace";
import { useToggleFollowUp } from "@/lib/hooks/use-followups";
import {
  useAddActivity,
  useDeleteLead,
  useGenerateInsights,
  useLead,
  useScoreLead,
  useUpdateLead,
  type Activity,
  type LeadDetail,
} from "@/lib/hooks/use-leads";
import { rulesForStageChange } from "@/lib/automation-rules";
import { formatCurrency, initials, priorityStyle, statusLabel, type Status } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const STAGES: Status[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
type LogType = "NOTE" | "CALL" | "EMAIL";

const ENTRY: Record<Activity["type"], { icon: typeof StickyNote; label: string; tone: string }> = {
  NOTE: { icon: StickyNote, label: "Note", tone: "text-fg-muted" },
  CALL: { icon: Phone, label: "Call", tone: "text-cold-text" },
  EMAIL: { icon: Mail, label: "Email", tone: "text-cold-text" },
  STATUS_CHANGE: { icon: ArrowRightLeft, label: "Stage change", tone: "text-accent-text" },
  AI_SCORE: { icon: Gauge, label: "AI score", tone: "text-hot-text" },
};

/** "Stage changed from NEW to CONTACTED." → "Moved from New to Contacted." */
function entryText(a: Activity) {
  if (a.type !== "STATUS_CHANGE") return a.body;
  const m = a.body.match(/from (\w+) to (\w+)/i);
  if (!m) return a.body;
  const label = (s: string) => statusLabel[s.toUpperCase() as Status] ?? s;
  return `Moved from ${label(m[1])} to ${label(m[2])}.`;
}

const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function dayLabel(d: Date, now: Date) {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : dayFmt.format(d);
}

export default function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: lead, isLoading, isError, error } = useLead(id);

  if (isError && !lead) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-[24px] font-semibold text-fg">Lead not found</h1>
        <p className="mt-2 text-[14.5px] text-fg-muted">{error.message || "It may have been deleted, or it belongs to another workspace."}</p>
        <Link href="/leads" className="prose-link mt-4 inline-block text-[14px]">
          Back to leads
        </Link>
      </div>
    );
  }

  if (isLoading || !lead) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8" aria-busy="true">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-4 h-9 w-72" />
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <h1 className="sr-only">Loading lead</h1>
      </div>
    );
  }

  return <Profile lead={lead} />;
}

function Profile({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const { data: ws } = useCurrentWorkspace();
  const update = useUpdateLead();
  const remove = useDeleteLead();
  const tier = priorityStyle[lead.priority];
  const owner = lead.assignedTo ? lead.assignedTo.displayName?.trim() || lead.assignedTo.email.split("@")[0] : "Unassigned";

  function moveTo(to: Status) {
    if (to === lead.status) return;
    const booked = rulesForStageChange(lead.status, to).followUps[0];
    update.mutate(
      { id: lead.id, patch: { status: to } },
      {
        onSuccess: () =>
          toast.success(`Moved to ${statusLabel[to]}`, {
            description: booked ? `Follow-up added: ${booked.title}, due in 2 days.` : "Logged on the timeline.",
          }),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not change the stage"),
      },
    );
  }

  async function onDelete() {
    try {
      await remove.mutateAsync(lead.id);
      toast.success(`${lead.name} deleted`);
      router.push("/leads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the lead");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-3.5" /> Leads
      </Link>

      <header className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-[16px] font-semibold text-fg">
            {initials(lead.name)}
          </span>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[26px] font-semibold leading-tight text-fg md:text-[30px]">
              {lead.name}
              <Badge className={cn("text-[12px]", tier.className)}>{tier.label}</Badge>
            </h1>
            <p className="mt-1 text-[14.5px] text-fg-muted">
              {[lead.title, lead.company].filter(Boolean).join(" · ") || "No company"} · {formatCurrency(lead.value)} · Owner: {owner}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <LeadFormDialog
            lead={lead}
            trigger={
              <Button>
                <Pencil aria-hidden /> Edit
              </Button>
            }
          />
          {ws && !ws.isDemo && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="danger-ghost" aria-label={`Delete ${lead.name}`}>
                  <Trash2 aria-hidden />
                </Button>
              </DialogTrigger>
              <DialogContent title={`Delete ${lead.name}?`} description="The lead, its timeline and its follow-ups are removed. This can't be undone.">
                <div className="flex justify-end gap-2 px-5 py-4">
                  <DialogClose asChild>
                    <Button>Cancel</Button>
                  </DialogClose>
                  <Button variant="danger" onClick={onDelete} disabled={remove.isPending}>
                    {remove.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />}
                    Delete lead
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <StageStepper status={lead.status} onChange={moveTo} pending={update.isPending} />

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Timeline lead={lead} />
        </div>
        <div className="space-y-6">
          <ScoreCard lead={lead} />
          <InsightCard lead={lead} />
          <FollowUps lead={lead} />
          <Details lead={lead} owner={owner} />
        </div>
      </div>
    </div>
  );
}

/** The pipeline stages as a radio group: one click moves the lead. */
function StageStepper({ status, onChange, pending }: { status: Status; onChange: (s: Status) => void; pending: boolean }) {
  const current = STAGES.indexOf(status);
  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + STAGES.length) % STAGES.length;
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  }
  return (
    <div role="radiogroup" aria-label="Stage" aria-busy={pending} className="mt-6 grid max-w-2xl grid-cols-5 gap-1 rounded-lg border border-border bg-surface p-1">
      {STAGES.map((s, i) => {
        const on = s === status;
        const passed = i < current && status !== "LOST";
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-press=""
            onClick={() => onChange(s)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "flex h-9 items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors duration-150",
              on
                ? s === "LOST"
                  ? "bg-danger-soft text-danger-text ring-1 ring-danger-text/40"
                  : s === "WON"
                    ? "bg-success-soft text-success-text ring-1 ring-success-text/40"
                    : "bg-accent text-accent-fg"
                : passed
                  ? "text-fg hover:bg-sunken"
                  : "text-fg-muted hover:bg-sunken hover:text-fg",
            )}
          >
            {passed && <Check aria-hidden className="size-3.5 text-success-text" />}
            {statusLabel[s]}
          </button>
        );
      })}
    </div>
  );
}

function Card({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="panel p-5">
      <header className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-[15px] font-semibold text-fg">
          {title}
        </h2>
        {action}
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ScoreCard({ lead }: { lead: LeadDetail }) {
  const score = useScoreLead(lead.id);
  const tier = priorityStyle[lead.priority];
  return (
    <Card id="score" title="AI score">
      <div className="flex items-start gap-4">
        <div className={cn("flex size-16 shrink-0 flex-col items-center justify-center rounded-xl", tier.className)}>
          <span className="font-display text-[26px] font-semibold leading-none">
            <AnimatedNumber value={lead.score} />
          </span>
          <span className="mt-0.5 text-[11px] font-medium">{tier.label}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-fg">{lead.scoredAt ? "Likelihood to close, out of 100" : "Not scored yet"}</p>
          {lead.aiSummary && <p className="mt-1 text-[13.5px] leading-relaxed text-fg-muted">{lead.aiSummary}</p>}
          {lead.scoredAt && <p className="mt-1 text-[12px] text-fg-muted">Scored {timeAgo(lead.scoredAt)}</p>}
        </div>
      </div>
      {lead.aiReasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {lead.aiReasons.map((r) => (
            <li key={r} className="flex gap-2 text-[13.5px] text-fg">
              <span aria-hidden className={cn("mt-2 size-1.5 shrink-0 rounded-full", tier.bar)} />
              {r}
            </li>
          ))}
        </ul>
      )}
      {score.isError && (
        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger-text">
          {score.error.message}
        </p>
      )}
      <Button
        className="mt-4 w-full"
        disabled={score.isPending}
        onClick={() => score.mutate(undefined, { onSuccess: () => toast.success("Scored by Gemini") })}
      >
        {score.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <RefreshCw aria-hidden />}
        {score.isPending ? "Scoring with Gemini…" : lead.scoredAt ? "Re-score with AI" : "Score with AI"}
      </Button>
    </Card>
  );
}

function InsightCard({ lead }: { lead: LeadDetail }) {
  const insights = useGenerateInsights(lead.id);
  const insight = insights.data?.insight ?? lead.aiInsight;
  const next = insights.data?.nextAction ?? lead.aiNextAction;
  return (
    <Card id="insight" title="Insight and next step">
      {insight ? (
        <div key={insight} className="pop">
          <p className="text-[14px] leading-relaxed text-fg">{insight}</p>
          {next && (
            <p className="mt-3 flex gap-2 rounded-md border border-border bg-accent-soft px-3 py-2.5 text-[13.5px] text-fg">
              <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
              <span>
                <span className="font-semibold">Next: </span>
                {next}
              </span>
            </p>
          )}
          {lead.insightAt && !insights.data && <p className="mt-2 text-[12px] text-fg-muted">Written {timeAgo(lead.insightAt)}</p>}
        </div>
      ) : (
        <p className="text-[14px] text-fg-muted">Gemini reads this lead and its recent timeline, then suggests one concrete next step.</p>
      )}
      {insights.isError && (
        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger-text">
          {insights.error.message}
        </p>
      )}
      <Button className="mt-4 w-full" disabled={insights.isPending} onClick={() => insights.mutate()}>
        {insights.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Lightbulb aria-hidden />}
        {insights.isPending ? "Asking Gemini…" : insight ? "Refresh insight" : "Get an insight"}
      </Button>
    </Card>
  );
}

function FollowUps({ lead }: { lead: LeadDetail }) {
  const toggle = useToggleFollowUp();
  const now = new Date();
  const items = [...lead.followUps].sort((a, b) => Number(a.done) - Number(b.done) || a.dueAt.localeCompare(b.dueAt));
  return (
    <Card id="followups" title="Follow-ups">
      {items.length === 0 ? (
        <p className="text-[14px] text-fg-muted">None. Moving this lead to Qualified books a proposal task.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((f) => {
            const late = !f.done && new Date(f.dueAt) < now;
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-md px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={f.done}
                  disabled={toggle.isPending}
                  onChange={(e) => toggle.mutate({ id: f.id, done: e.target.checked })}
                  aria-label={`${f.done ? "Mark not done" : "Mark done"}: ${f.title}`}
                  className="size-4 shrink-0 accent-[var(--accent)]"
                />
                <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", f.done ? "text-fg-muted line-through" : "text-fg")}>{f.title}</span>
                <span className={cn("shrink-0 text-[12.5px]", late ? "font-medium text-danger-text" : "text-fg-muted")}>
                  {f.done ? "Done" : late ? `Overdue ${timeAgo(f.dueAt, now).replace(" ago", "")}` : `Due ${timeAgo(f.dueAt, now)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Details({ lead, owner }: { lead: LeadDetail; owner: string }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Email", value: lead.email ? <a href={`mailto:${lead.email}`} className="prose-link break-all">{lead.email}</a> : "Not set" },
    { label: "Phone", value: lead.phone ? <a href={`tel:${lead.phone}`} className="prose-link">{lead.phone}</a> : "Not set" },
    { label: "Source", value: lead.source ?? "Not set" },
    { label: "Deal value", value: formatCurrency(lead.value) },
    { label: "Owner", value: owner },
    { label: "Added", value: `${new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` },
  ];
  return (
    <Card id="details" title="Details">
      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 text-[13.5px]">
            <dt className="shrink-0 text-fg-muted">{r.label}</dt>
            <dd className="min-w-0 text-right text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
      {lead.notes && (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-3">
          <h3 className="eyebrow">Notes</h3>
          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-fg">{lead.notes}</p>
        </div>
      )}
    </Card>
  );
}

function Timeline({ lead }: { lead: LeadDetail }) {
  const add = useAddActivity(lead.id);
  const [type, setType] = useState<LogType>("NOTE");
  const [body, setBody] = useState("");
  const now = useMemo(() => new Date(), []);

  const groups = useMemo(() => {
    const out: { day: string; items: Activity[] }[] = [];
    for (const a of lead.activities) {
      const day = dayLabel(new Date(a.createdAt), now);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(a);
      else out.push({ day, items: [a] });
    }
    return out;
  }, [lead.activities, now]);

  function submit() {
    const text = body.trim();
    if (!text) return;
    setBody("");
    add.mutate(
      { body: text, type },
      {
        onError: (err) => {
          setBody(text);
          toast.error(err instanceof Error ? err.message : "Could not save that");
        },
      },
    );
  }

  const placeholder = type === "CALL" ? "What was said on the call?" : type === "EMAIL" ? "What did you send or receive?" : "Write a note for the team";
  let index = 0;

  return (
    <Card id="timeline" title="Timeline">
      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <Segmented
          label="Type of entry"
          value={type}
          onChange={setType}
          options={[
            { value: "NOTE", label: "Note" },
            { value: "CALL", label: "Call" },
            { value: "EMAIL", label: "Email" },
          ]}
        />
        <label htmlFor="log-body" className="sr-only">
          {ENTRY[type].label} text
        </label>
        <textarea
          id="log-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={3}
          className="input-field mt-2.5 h-auto resize-y py-2 leading-relaxed"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[12px] text-fg-muted">Ctrl + Enter to save</span>
          <Button variant="primary" size="sm" onClick={submit} disabled={!body.trim()}>
            Log {ENTRY[type].label.toLowerCase()}
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="mt-5 text-[14px] text-fg-muted">Nothing logged yet. Calls, emails, notes, stage changes and AI scores all appear here.</p>
      ) : (
        <div className="mt-5 space-y-5">
          {groups.map((g) => (
            <section key={g.day} aria-label={g.day}>
              <h3 className="eyebrow mb-2">{g.day}</h3>
              <ol className="stagger relative space-y-3 border-l border-border pl-5">
                {g.items.map((a) => {
                  const e = ENTRY[a.type];
                  const Icon = e.icon;
                  const pending = a.id.startsWith("pending-");
                  const who = a.createdBy ? a.createdBy.displayName?.trim() || a.createdBy.email.split("@")[0] : pending ? "You" : "LeadFlow";
                  return (
                    <li key={a.id} style={staggerStyle(index++)} className={cn("relative", pending && "opacity-70")}>
                      <span aria-hidden className="absolute -left-[29px] top-0.5 flex size-[18px] items-center justify-center rounded-full border border-border bg-surface">
                        <Icon className={cn("size-3", e.tone)} />
                      </span>
                      <p className="text-[12.5px] text-fg-muted">
                        <span className="font-medium text-fg">{e.label}</span> · {who} · {pending ? "saving…" : timeFmt.format(new Date(a.createdAt))}
                      </p>
                      <p className="mt-0.5 whitespace-pre-line text-[14px] leading-relaxed text-fg">{entryText(a)}</p>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
