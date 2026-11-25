"use client";

import { useState } from "react";
import { ClipboardList, Mail, MoveRight, NotebookPen } from "lucide-react";
import { rulesForCreated, rulesForStageChange, type RuleResult, type Stage } from "@/lib/automation-rules";
import { STAGES, STAGE_LABEL } from "@/lib/analytics-calc";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";

type Entry = { id: number; label: string; result: RuleResult; at: Date };


/** Runs the app's real follow-up rules (lib/automation-rules.ts) on a lead you move. */
export function FollowUpDemo() {
  const [stage, setStage] = useState<Stage>("NEW");
  const [log, setLog] = useState<Entry[]>(() => {
    // One clock reading for both, so "due in 1 day" is exact on the server and in the browser.
    const now = new Date();
    return [{ id: 0, label: "Lead added", result: rulesForCreated(now), at: now }];
  });

  function move(to: Stage) {
    if (to === stage) return;
    const now = new Date();
    setLog((l) => [{ id: l[0].id + 1, label: `${STAGE_LABEL[stage]} → ${STAGE_LABEL[to]}`, result: rulesForStageChange(stage, to, now), at: now }, ...l].slice(0, 4));
    setStage(to);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <p className="text-[13.5px] font-semibold text-fg">Hannah Weiss · Ledgerly</p>
        <div role="radiogroup" aria-label="Move the lead to a stage" className="mt-2.5 grid grid-cols-5 gap-1">
          {STAGES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={stage === s}
              data-press=""
              onClick={() => move(s)}
              className={cn(
                "h-8 rounded-md border text-[12px] font-medium transition-colors duration-150",
                stage === s
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {STAGE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <p className="eyebrow mt-4">What LeadFlow writes</p>
      <ol aria-live="polite" className="mt-2 min-h-0 flex-1 space-y-2 overflow-hidden">
        {log.map((e) => (
          <li key={e.id} className="pop rounded-lg border border-border bg-surface p-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-fg">
              {e.id === 0 ? <NotebookPen aria-hidden className="size-3.5 text-fg-subtle" /> : <MoveRight aria-hidden className="size-3.5 text-fg-subtle" />}
              {e.label}
            </p>
            <ul className="mt-1.5 space-y-1 text-[12.5px]">
              {e.result.followUps.map((f) => (
                <li key={f.title} className="flex items-start gap-1.5 text-accent-text">
                  {f.type === "EMAIL" ? <Mail aria-hidden className="mt-0.5 size-3.5 shrink-0" /> : <ClipboardList aria-hidden className="mt-0.5 size-3.5 shrink-0" />}
                  <span>
                    Follow-up: <span className="font-medium">{f.title}</span>, due {timeAgo(f.dueAt, e.at)}
                  </span>
                </li>
              ))}
              {e.result.followUps.length === 0 && <li className="text-fg-muted">No follow-up for this move, only a timeline entry.</li>}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
