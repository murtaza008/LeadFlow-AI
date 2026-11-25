"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { focusCandidates, keepKnownPicks } from "@/lib/focus";
import { SCENE_FOCUS, SCENE_LEADS } from "@/components/landing/scene/leads";
import { cn } from "@/lib/utils";

// The demo's five stored picks plus three other leads from the same workspace.
const PICK_IDS = new Set(SCENE_FOCUS.map((p) => p.leadId));
const START = [
  ...SCENE_LEADS.filter((l) => PICK_IDS.has(l.id)),
  ...SCENE_LEADS.filter((l) => !PICK_IDS.has(l.id) && l.status !== "WON" && l.status !== "LOST").slice(0, 2),
  ...SCENE_LEADS.filter((l) => l.status === "WON").slice(0, 1),
].sort((a, b) => b.score - a.score);

// A test pick with an id that is not in any list, to show it being dropped.
const MADE_UP = { leadId: "lead-not-in-the-list", reason: "" };

/** Runs the app's real focus rules (lib/focus.ts): who is sent to Gemini, and which picks are kept. */
export function FocusDemo() {
  const [closed, setClosed] = useState<Set<string>>(() => new Set(START.filter((l) => l.status === "WON").map((l) => l.id)));

  const leads = useMemo(
    () => START.map((l) => ({ ...l, status: closed.has(l.id) ? ("WON" as const) : l.status === "WON" ? ("QUALIFIED" as const) : l.status })),
    [closed],
  );
  const candidates = focusCandidates(leads);
  const rank = new Map(candidates.map((c, i) => [c.id, i + 1]));
  const kept = new Set(keepKnownPicks([...SCENE_FOCUS, MADE_UP], candidates).map((p) => p.leadId));

  function toggle(id: string) {
    setClosed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="space-y-1">
        {leads.map((l) => {
          const r = rank.get(l.id);
          const isClosed = closed.has(l.id);
          return (
            <li key={l.id} className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[12.5px]">
              <span className="w-5 shrink-0 text-center font-mono text-[11.5px] text-fg-muted">{r ?? "–"}</span>
              <span className={cn("min-w-0 flex-1 truncate", isClosed ? "text-fg-muted line-through" : "text-fg")}>{l.name}</span>
              <span className="tabular shrink-0 font-mono text-[11.5px] text-fg-muted">{l.score}</span>
              <button
                type="button"
                data-press=""
                aria-pressed={isClosed}
                aria-label={`${isClosed ? "Reopen" : "Mark won"}: ${l.name}`}
                onClick={() => toggle(l.id)}
                className={cn(
                  "h-6 shrink-0 rounded border px-1.5 text-[11px] font-medium transition-colors",
                  isClosed ? "border-success-text text-success-text" : "border-border text-fg-muted hover:text-fg",
                )}
              >
                {isClosed ? "Won" : "Open"}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="eyebrow mt-4">Gemini&rsquo;s picks for today</p>
      <ul aria-live="polite" className="mt-2 space-y-1 text-[12.5px]">
        {[...SCENE_FOCUS, MADE_UP].map((p) => {
          const lead = START.find((l) => l.id === p.leadId);
          const ok = kept.has(p.leadId);
          return (
            <li key={p.leadId} className={cn("flex items-center gap-1.5", ok ? "text-fg" : "text-fg-muted")}>
              {ok ? <Check aria-hidden className="size-3.5 shrink-0 text-success-text" /> : <X aria-hidden className="size-3.5 shrink-0 text-danger-text" />}
              <span className={cn("truncate", !ok && "line-through")}>{lead ? lead.name : "A made-up id (test)"}</span>
              <span className="sr-only">{ok ? " kept" : " dropped"}</span>
              {!ok && <span className="shrink-0 text-[11.5px]">not in the list sent</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
