"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { CalendarClock, GripVertical, MoreHorizontal, Plus, Search, UserRoundSearch } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/menu";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { LeadHoverCard } from "@/components/leads/LeadHoverCard";
import { useUpdateLead, type Lead } from "@/lib/hooks/use-leads";
import type { FollowUpWithLead } from "@/lib/hooks/use-followups";
import { q } from "@/lib/queries";
import { rulesForStageChange } from "@/lib/automation-rules";
import { formatCurrency, initials, priorityStyle, statusLabel, type Status } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

const STAGES: Status[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

const ownerName = (l: Lead) => (l.assignedTo ? l.assignedTo.displayName?.trim() || l.assignedTo.email.split("@")[0] : null);

/** Quick press-and-settle on the card that was just dropped. Web Animations API, outside React, pointer only. */
function settle(leadId: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-lead-card="${leadId}"]`)?.animate(
      [
        { transform: "scale(1.035)", boxShadow: "0 12px 28px -12px rgba(0,0,0,0.35)" },
        { transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" },
      ],
      { duration: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    );
  });
}

export default function PipelinePage() {
  const leadsQ = useQuery(q.leads());
  const followQ = useQuery(q.followups());
  const update = useUpdateLead();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const leads = useMemo(() => leadsQ.data ?? [], [leadsQ.data]);
  const owners = useMemo(() => [...new Set(leads.map(ownerName).filter((n): n is string => !!n))].sort(), [leads]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (owner === "all" || (owner === "none" ? !l.assignedTo : ownerName(l) === owner)) &&
        (!needle || `${l.name} ${l.company ?? ""} ${l.title ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [leads, search, owner]);

  const byStage = useMemo(() => {
    const map: Record<Status, Lead[]> = { NEW: [], CONTACTED: [], QUALIFIED: [], WON: [], LOST: [] };
    for (const l of visible) map[l.status].push(l);
    for (const s of STAGES) map[s].sort((a, b) => b.score - a.score);
    return map;
  }, [visible]);

  const nextFollowUp = useMemo(() => {
    const m = new Map<string, FollowUpWithLead>();
    for (const f of followQ.data ?? []) {
      if (f.done) continue;
      const cur = m.get(f.leadId);
      if (!cur || f.dueAt < cur.dueAt) m.set(f.leadId, f);
    }
    return m;
  }, [followQ.data]);

  const leadName = (id: string | number) => leads.find((l) => l.id === id)?.name ?? "the lead";
  const stageName = (id: string | number | undefined) => (id ? statusLabel[id as Status] : "nowhere");
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${leadName(active.id)}.`,
    onDragOver: ({ active, over }) => `${leadName(active.id)} is over ${stageName(over?.id)}.`,
    onDragEnd: ({ active, over }) => (over ? `${leadName(active.id)} dropped in ${stageName(over.id)}.` : `${leadName(active.id)} was not moved.`),
    onDragCancel: ({ active }) => `Moving ${leadName(active.id)} was cancelled.`,
  };

  function move(lead: Lead, to: Status, fromPointer: boolean) {
    if (lead.status === to) return;
    const from = lead.status;
    const booked = rulesForStageChange(from, to).followUps[0];
    update.mutate(
      { id: lead.id, patch: { status: to } },
      {
        onError: (err) => toast.error(err instanceof Error ? err.message : "Could not move the lead"),
        onSuccess: () =>
          toast.success(`${lead.name} moved to ${statusLabel[to]}`, {
            description: booked ? `Follow-up added: ${booked.title}, due in 2 days.` : "Logged on the lead's timeline.",
            action: { label: "Undo", onClick: () => move({ ...lead, status: to }, from, false) },
          }),
      },
    );
    if (fromPointer) settle(lead.id);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const lead = leads.find((l) => l.id === e.active.id);
    const to = e.over?.id as Status | undefined;
    if (!lead || !to) return;
    const pointer = typeof PointerEvent !== "undefined" && e.activatorEvent instanceof PointerEvent;
    move(lead, to, pointer);
  }

  const active = leads.find((l) => l.id === activeId) ?? null;
  const openValue = leads.filter((l) => l.status !== "WON" && l.status !== "LOST").reduce((s, l) => s + l.value, 0);

  return (
    <div className="flex flex-col px-5 pt-8 sm:px-8">
      <PageHeader
        eyebrow="Sell"
        title="Pipeline"
        description={
          leadsQ.isLoading
            ? "Loading deals…"
            : `${formatCurrency(openValue)} open across ${leads.filter((l) => l.status !== "WON" && l.status !== "LOST").length} deals. Drag a card, or use its menu, to change its stage.`
        }
        actions={
          <>
            <label className="relative">
              <span className="sr-only">Filter cards</span>
              <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or company"
                className="input-field w-56 pl-8"
              />
            </label>
            <label className="sr-only" htmlFor="owner-filter">
              Owner
            </label>
            <select id="owner-filter" value={owner} onChange={(e) => setOwner(e.target.value)} className="input-field w-40">
              <option value="all">Everyone</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
              <option value="none">Unassigned</option>
            </select>
            <Link href="/leads?new=1" data-press="" className={buttonVariants({ variant: "primary" })}>
              <Plus aria-hidden /> Add a lead
            </Link>
          </>
        }
      />

      {!leadsQ.isLoading && leads.length === 0 ? (
        <div className="panel mt-6">
          <EmptyState
            icon={<UserRoundSearch />}
            title="No deals on the board yet"
            description="Leads you add start in New. Drag them across as the conversation moves."
            action={
              <Link href="/leads?new=1" className={buttonVariants({ variant: "primary" })}>
                Add a lead
              </Link>
            }
          />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} accessibility={{ announcements }}>
          <div
            tabIndex={0}
            role="region"
            aria-label="Pipeline board"
            className="-mx-5 mt-6 flex gap-3 overflow-x-auto px-5 pb-6 outline-none scrollbar-thin sm:-mx-8 sm:px-8"
          >
            {STAGES.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                leads={byStage[stage]}
                loading={leadsQ.isLoading}
                nextFollowUp={nextFollowUp}
                onMove={(lead, to) => move(lead, to, false)}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
            {active ? <CardBody lead={active} next={nextFollowUp.get(active.id)} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

const STAGE_DOT: Record<Status, string> = {
  NEW: "bg-fg-subtle",
  CONTACTED: "bg-cold",
  QUALIFIED: "bg-accent",
  WON: "bg-success",
  LOST: "bg-danger",
};

function Column({
  stage,
  leads,
  loading,
  nextFollowUp,
  onMove,
}: {
  stage: Status;
  leads: Lead[];
  loading: boolean;
  nextFollowUp: Map<string, FollowUpWithLead>;
  onMove: (lead: Lead, to: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((s, l) => s + l.value, 0);
  return (
    <section aria-label={`${statusLabel[stage]}, ${leads.length} deals`} className="flex min-w-[13.5rem] max-w-[20rem] flex-1 shrink-0 basis-0 flex-col max-sm:min-w-[16.5rem]">
      <header className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
          <span aria-hidden className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
          {statusLabel[stage]}
          <span className="tabular rounded-full bg-sunken px-1.5 text-[11.5px] font-medium text-fg-muted">{leads.length}</span>
        </h2>
        <span className="tabular text-[12.5px] text-fg-muted">{formatCurrency(total)}</span>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          "flex max-h-[calc(100dvh-16.5rem-var(--banner-h,0px))] min-h-64 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border p-2 transition-colors duration-150 scrollbar-thin",
          isOver ? "border-accent bg-accent-soft" : "border-border bg-sunken/60",
        )}
      >
        {loading &&
          Array.from({ length: 3 }, (_, i) => <div key={i} aria-hidden className="skeleton h-[104px] shrink-0 rounded-lg" />)}
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} next={nextFollowUp.get(lead.id)} onMove={onMove} />
        ))}
        {!loading && leads.length === 0 && (
          <p className="px-3 py-8 text-center text-[12.5px] text-fg-muted">No deals in {statusLabel[stage]}. Drop one here.</p>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ lead, next, onMove }: { lead: Lead; next?: FollowUpWithLead; onMove: (lead: Lead, to: Status) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id: lead.id });
  // dnd-kit types its listeners loosely; each one is a React event handler.
  const on = (name: string) => listeners?.[name] as ((e: React.SyntheticEvent) => void) | undefined;
  return (
    <div
      ref={setNodeRef}
      data-lead-card={lead.id}
      // Pointer and touch drag start anywhere on the card; keyboard drag uses the grip button.
      onPointerDown={on("onPointerDown")}
      onTouchStart={on("onTouchStart")}
      className={cn("shrink-0 touch-manipulation", isDragging && "opacity-30")}
    >
      <CardBody
        lead={lead}
        next={next}
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            onKeyDown={on("onKeyDown")}
            aria-label={`Move ${lead.name} with the keyboard`}
            className="-ml-1 flex h-7 w-5 cursor-grab items-center justify-center rounded text-fg-subtle hover:text-fg"
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
        }
        menu={
          <Menu>
            <MenuTrigger asChild>
              <button
                type="button"
                aria-label={`Move ${lead.name} to another stage`}
                className="flex size-7 items-center justify-center rounded-md text-fg-subtle hover:bg-sunken hover:text-fg"
              >
                <MoreHorizontal aria-hidden className="size-4" />
              </button>
            </MenuTrigger>
            <MenuContent align="end" className="min-w-44">
              <MenuLabel>Move to</MenuLabel>
              {STAGES.filter((s) => s !== lead.status).map((s) => (
                <MenuItem key={s} onSelect={() => onMove(lead, s)}>
                  <span aria-hidden className={cn("size-2 rounded-full", STAGE_DOT[s])} />
                  {statusLabel[s]}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        }
      />
    </div>
  );
}

function CardBody({
  lead,
  next,
  handle,
  menu,
  overlay,
}: {
  lead: Lead;
  next?: FollowUpWithLead;
  handle?: React.ReactNode;
  menu?: React.ReactNode;
  overlay?: boolean;
}) {
  const tier = priorityStyle[lead.priority];
  const owner = ownerName(lead);
  const late = next && new Date(next.dueAt) < new Date();
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-surface p-3 pl-3.5 shadow-[inset_0_1px_0_var(--highlight),var(--shadow-xs)] transition-[border-color,box-shadow] duration-150 hover:border-border-strong",
        overlay && "rotate-[1.5deg] cursor-grabbing border-border-strong shadow-[var(--shadow-lg)]",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", tier.bar)} />
      <div className="flex items-start gap-1.5">
        {handle}
        <div className="min-w-0 flex-1">
          {overlay ? (
            <p className="truncate text-[13.5px] font-medium text-fg">{lead.name}</p>
          ) : (
            <p className="flex min-w-0 text-[13.5px]">
              <LeadHoverCard lead={lead} />
            </p>
          )}
          <p className="truncate text-[12px] text-fg-muted">{lead.company ?? "No company"}</p>
        </div>
        <ScoreBadge score={lead.score} priority={lead.priority} size="sm" />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="tabular text-[13px] font-medium text-fg">{formatCurrency(lead.value)}</span>
        <span className="flex items-center gap-1">
          {owner ? (
            <span title={owner} className="flex size-6 items-center justify-center rounded-full border border-border bg-surface-2 text-[10px] font-semibold text-fg-muted">
              <span aria-hidden>{initials(owner)}</span>
              <span className="sr-only">Owner: {owner}</span>
            </span>
          ) : (
            <span className="text-[11.5px] text-fg-muted">Unassigned</span>
          )}
          {menu}
        </span>
      </div>
      {next && (
        <p className={cn("mt-2 flex items-center gap-1.5 truncate text-[12px]", late ? "font-medium text-danger-text" : "text-fg-muted")}>
          <CalendarClock aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">
            {next.title} · {late ? `overdue ${timeAgo(next.dueAt).replace(" ago", "")}` : `due ${timeAgo(next.dueAt)}`}
          </span>
        </p>
      )}
      <span className="sr-only">{tier.label} lead</span>
    </article>
  );
}
