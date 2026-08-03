"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Mail, Phone, CheckSquare, Check } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowUps, useToggleFollowUp, type FollowUpWithLead } from "@/lib/hooks/use-followups";
import { relativeDue } from "@/lib/format";

const TYPE_ICON = { EMAIL: Mail, CALL: Phone, TASK: CheckSquare } as const;

export default function FollowUpsPage() {
  const { data: followUps = [], isLoading } = useFollowUps();

  const groups = useMemo(() => {
    const open = followUps.filter((f) => !f.done);
    const done = followUps.filter((f) => f.done);
    const overdue = open.filter((f) => relativeDue(new Date(f.dueAt)).overdue);
    const upcoming = open.filter((f) => !relativeDue(new Date(f.dueAt)).overdue);
    return { overdue, upcoming, done };
  }, [followUps]);

  return (
    <>
      <Topbar title="Follow-ups" />
      <div className="flex-1 space-y-8 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : followUps.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-14 text-center">
            <p className="text-[15px] font-600 text-foreground">No follow-ups yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Follow-ups are scheduled automatically when you add a lead or move it to Qualified.
            </p>
          </div>
        ) : (
          <>
            <Group title="Overdue" tone="text-danger" items={groups.overdue} />
            <Group title="Upcoming" tone="text-foreground" items={groups.upcoming} />
            <Group title="Done" tone="text-muted-foreground" items={groups.done} />
          </>
        )}
      </div>
    </>
  );
}

function Group({ title, tone, items }: { title: string; tone: string; items: FollowUpWithLead[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className={`eyebrow mb-3 ${tone}`}>
        {title} ({items.length})
      </h2>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {items.map((f) => (
            <FollowUpRow key={f.id} followUp={f} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function FollowUpRow({ followUp }: { followUp: FollowUpWithLead }) {
  const toggle = useToggleFollowUp();
  const due = relativeDue(new Date(followUp.dueAt));
  const Icon = TYPE_ICON[followUp.type];

  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <button
        onClick={() => toggle.mutate({ id: followUp.id, done: !followUp.done })}
        aria-label={followUp.done ? "Mark as not done" : "Mark as done"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
          followUp.done ? "border-mint bg-mint text-growth" : "border-border hover:border-mint"
        }`}
      >
        {followUp.done && <Check className="h-3.5 w-3.5" />}
      </button>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-600 ${followUp.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {followUp.title}
        </p>
        <Link href={`/leads/${followUp.leadId}`} className="truncate text-[12px] text-muted-foreground hover:text-mint">
          {followUp.lead.name}
          {followUp.lead.company ? ` · ${followUp.lead.company}` : ""}
        </Link>
      </div>
      <span className={`shrink-0 text-[12px] font-600 ${due.overdue && !followUp.done ? "text-danger" : "text-muted-foreground"}`}>
        {followUp.done ? new Date(followUp.dueAt).toLocaleDateString() : due.label}
      </span>
    </li>
  );
}
