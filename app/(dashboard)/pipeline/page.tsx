"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Topbar } from "@/components/dashboard/Topbar";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { useLeads, useUpdateLead, type Lead } from "@/lib/hooks/use-leads";
import { formatCurrency, initials, priorityStyle, statusLabel, type Status } from "@/lib/format";

const COLUMNS: { key: Status; label: string }[] = [
  { key: "NEW", label: statusLabel.NEW },
  { key: "CONTACTED", label: statusLabel.CONTACTED },
  { key: "QUALIFIED", label: statusLabel.QUALIFIED },
  { key: "WON", label: statusLabel.WON },
  { key: "LOST", label: statusLabel.LOST },
];

export default function PipelinePage() {
  const { data: leads = [] } = useLeads();
  const update = useUpdateLead();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStatus = useMemo(() => {
    const map: Record<Status, Lead[]> = { NEW: [], CONTACTED: [], QUALIFIED: [], WON: [], LOST: [] };
    for (const l of leads) map[l.status].push(l);
    return map;
  }, [leads]);

  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const leadId = String(e.active.id);
    const target = e.over?.id as Status | undefined;
    if (!target) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === target) return;
    update.mutate(
      { id: leadId, patch: { status: target } },
      { onError: () => toast.error("Could not move lead") },
    );
  }

  return (
    <>
      <Topbar title="Pipeline" />
      <div className="flex-1 overflow-auto p-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {COLUMNS.map((col) => (
              <Column key={col.key} status={col.key} label={col.label} leads={byStatus[col.key]} />
            ))}
          </div>
          <DragOverlay>{activeLead ? <LeadCard lead={activeLead} dragging /> : null}</DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

function Column({ status, label, leads }: { status: Status; label: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = leads.reduce((s, l) => s + l.value, 0);
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-700 text-foreground">{label}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-600 text-muted-foreground">
            {leads.length}
          </span>
        </div>
        <span className="mono-data text-[11px] text-muted-foreground">{formatCurrency(total)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[420px] flex-1 flex-col gap-2 rounded-xl border p-2 transition-colors ${
          isOver ? "border-mint bg-mint-dim/30" : "border-border bg-muted/40"
        }`}
      >
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">Drop leads here</p>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none cursor-grab ${isDragging ? "opacity-40" : ""}`}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  const p = priorityStyle[lead.priority];
  return (
    <a
      href={`/leads/${lead.id}`}
      onClick={(e) => dragging && e.preventDefault()}
      className={`block rounded-lg border border-border bg-card p-3 ${dragging ? "shadow-xl" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-700 text-secondary-foreground">
            {initials(lead.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-600 text-foreground">{lead.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{lead.company ?? "—"}</p>
          </div>
        </div>
        <ScoreBadge score={lead.score} size="sm" />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-600 ${p.className}`}>{p.label}</span>
        <span className="mono-data text-[12px] font-600 text-foreground">{formatCurrency(lead.value)}</span>
      </div>
    </a>
  );
}
