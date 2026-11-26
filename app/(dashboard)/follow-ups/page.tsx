"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, ClipboardList, Mail, Phone } from "lucide-react";
import { PageHeader, EmptyState, Skeleton, staggerStyle } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { buttonVariants } from "@/components/ui/button";
import { Ledger } from "@/components/data/Ledger";
import { LeadHoverCard } from "@/components/leads/LeadHoverCard";
import { useToggleFollowUp, type FollowUpWithLead } from "@/lib/hooks/use-followups";
import type { Lead } from "@/lib/hooks/use-leads";
import { q } from "@/lib/queries";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type Kind = "ALL" | FollowUpWithLead["type"];
const TYPE = {
  EMAIL: { icon: Mail, label: "Email" },
  CALL: { icon: Phone, label: "Call" },
  TASK: { icon: ClipboardList, label: "Task" },
} as const;

const DAY = 86_400_000;

export default function FollowUpsPage() {
  const followQ = useQuery(q.followups());
  const leadsQ = useQuery(q.leads());
  const [kind, setKind] = useState<Kind>("ALL");
  const now = useMemo(() => new Date(), []);

  const byId = useMemo(() => new Map((leadsQ.data ?? []).map((l) => [l.id, l])), [leadsQ.data]);
  const all = useMemo(() => followQ.data ?? [], [followQ.data]);

  const groups = useMemo(() => {
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const items = all.filter((f) => kind === "ALL" || f.type === kind);
    const open = items.filter((f) => !f.done).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return [
      { key: "overdue", title: "Overdue", tone: "text-danger-text", items: open.filter((f) => new Date(f.dueAt) < now) },
      { key: "today", title: "Due today", tone: "text-fg", items: open.filter((f) => new Date(f.dueAt) >= now && new Date(f.dueAt) <= endOfToday) },
      { key: "upcoming", title: "Upcoming", tone: "text-fg", items: open.filter((f) => new Date(f.dueAt) > endOfToday) },
      {
        key: "done",
        title: "Done in the last 14 days",
        tone: "text-fg-muted",
        items: items
          .filter((f) => f.done && now.getTime() - new Date(f.dueAt).getTime() < 14 * DAY)
          .sort((a, b) => b.dueAt.localeCompare(a.dueAt)),
      },
    ];
  }, [all, kind, now]);

  const open = all.filter((f) => !f.done);
  const count = (key: string) => groups.find((g) => g.key === key)?.items.length ?? 0;
  let index = 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader
        eyebrow="Sell"
        title="Follow-ups"
        description="Calls, emails and tasks, booked by the rules when leads are added or qualified. Tick one when it's done."
        actions={
          <Segmented
            label="Type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "ALL", label: "All" },
              { value: "EMAIL", label: "Email" },
              { value: "CALL", label: "Call" },
              { value: "TASK", label: "Task" },
            ]}
          />
        }
      />

      <Ledger
        className="mt-8"
        loading={followQ.isLoading}
        items={[
          { label: "Overdue", value: open.filter((f) => new Date(f.dueAt) < now).length },
          { label: "Due today", value: count("today") },
          { label: "Upcoming", value: count("upcoming") },
          { label: "Done, last 14 days", value: count("done") },
        ]}
      />

      {followQ.isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className="panel mt-6">
          <EmptyState
            icon={<CalendarCheck2 />}
            title="No follow-ups yet"
            description="Adding a lead books a 24-hour email follow-up, and qualifying one books a proposal task."
            action={
              <Link href="/leads?new=1" className={buttonVariants({ variant: "primary" })}>
                Add a lead
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) =>
            g.items.length === 0 ? null : (
              <section key={g.key} aria-labelledby={`g-${g.key}`} className="panel overflow-hidden">
                <h2 id={`g-${g.key}`} className={cn("flex items-center gap-2 border-b border-border bg-surface-2 px-5 py-3 text-[14px] font-semibold", g.tone)}>
                  {g.title}
                  <span className="tabular rounded-full bg-sunken px-2 text-[12px] font-medium text-fg-muted">{g.items.length}</span>
                </h2>
                <ul className="stagger divide-y divide-border">
                  {g.items.map((f) => (
                    <Row key={f.id} f={f} lead={byId.get(f.leadId)} now={now} i={index++} />
                  ))}
                </ul>
              </section>
            ),
          )}
          {groups.every((g) => g.items.length === 0) && (
            <p className="panel px-5 py-8 text-center text-[14px] text-fg-muted">No {TYPE[kind as keyof typeof TYPE]?.label.toLowerCase()} follow-ups.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ f, lead, now, i }: { f: FollowUpWithLead; lead?: Lead; now: Date; i: number }) {
  const toggle = useToggleFollowUp();
  const t = TYPE[f.type];
  const Icon = t.icon;
  const late = !f.done && new Date(f.dueAt) < now;
  return (
    <li style={staggerStyle(i)} className="flex items-center gap-4 px-5 py-3">
      <input
        type="checkbox"
        checked={f.done}
        disabled={toggle.isPending}
        onChange={(e) => toggle.mutate({ id: f.id, done: e.target.checked })}
        aria-label={`${f.done ? "Mark not done" : "Mark done"}: ${f.title} (${f.lead.name})`}
        className="size-4 shrink-0 accent-[var(--accent)]"
      />
      <Icon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[14px]", f.done ? "text-fg-muted line-through" : "text-fg")}>
          {f.title}
          <span className="sr-only"> ({t.label})</span>
        </p>
        <p className="flex min-w-0 items-center gap-1 text-[12.5px] text-fg-muted">
          {lead ? <LeadHoverCard lead={lead} className="font-normal text-fg-muted" /> : <span className="truncate">{f.lead.name}</span>}
          {f.lead.company && <span className="truncate">· {f.lead.company}</span>}
        </p>
      </div>
      <span className={cn("shrink-0 text-right text-[12.5px]", late ? "font-medium text-danger-text" : "text-fg-muted")}>
        {f.done ? "Done" : late ? `Overdue ${timeAgo(f.dueAt, now).replace(" ago", "")}` : `Due ${timeAgo(f.dueAt, now)}`}
      </span>
    </li>
  );
}
