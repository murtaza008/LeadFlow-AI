"use client";

import { useMemo, useState } from "react";
import { computeAnalytics, type AnalyticsLead, type Stage } from "@/lib/analytics-calc";
import { SCENE_LEADS } from "@/components/landing/scene/leads";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

// Dates are not used by the numbers shown here; a fixed one keeps server and browser identical.
const EPOCH = new Date("2026-01-01T00:00:00Z");
const START: AnalyticsLead[] = SCENE_LEADS.map((l) => ({
  status: l.status,
  value: l.value,
  score: l.score,
  source: l.source,
  createdAt: EPOCH,
  updatedAt: EPOCH,
}));

/** Moves the top-scoring lead in `from` to `to`; nothing happens if `from` is empty. */
function moveTop(leads: AnalyticsLead[], from: Stage, to: Stage): AnalyticsLead[] {
  let best = -1;
  leads.forEach((l, i) => {
    if (l.status === from && (best < 0 || l.score > leads[best].score)) best = i;
  });
  if (best < 0) return leads;
  return leads.map((l, i) => (i === best ? { ...l, status: to } : l));
}

/** Runs the app's real analytics function (lib/analytics-calc.ts) on the demo workspace's 35 leads. */
export function FunnelDemo() {
  const [leads, setLeads] = useState(START);
  const a = useMemo(() => computeAnalytics(leads, EPOCH), [leads]);
  const max = Math.max(...a.funnel.map((f) => f.count), 1);
  const has = (s: Stage) => leads.some((l) => l.status === s);

  return (
    <div className="flex h-full flex-col">
      <dl className="grid grid-cols-3 gap-2">
        {[
          { label: "Win rate", value: `${a.totals.winRate}%` },
          { label: "Won", value: String(a.totals.won) },
          { label: "Open value", value: formatCurrency(a.funnel.slice(0, 3).reduce((s, f) => s + f.value, 0)) },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-surface-2 px-2.5 py-2">
            <dt className="text-[11.5px] text-fg-muted">{k.label}</dt>
            <dd className="tabular mt-0.5 font-display text-[19px] font-semibold text-fg">{k.value}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 space-y-2" aria-label="Leads per stage">
        {a.funnel.map((f) => (
          <li key={f.stage} className="grid grid-cols-[72px_1fr_28px] items-center gap-2 text-[12.5px]">
            <span className="text-fg-muted">{f.label}</span>
            <span className="h-4 overflow-hidden rounded-sm bg-sunken">
              <span
                className="block h-full rounded-sm bg-chart-1 transition-[width] duration-450 ease-[var(--ease-out-expo)]"
                style={{ width: `${(f.count / max) * 100}%` }}
              />
            </span>
            <span className="tabular text-right font-mono text-fg">{f.count}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto grid grid-cols-3 gap-1.5 pt-4">
        <Button size="sm" disabled={!has("CONTACTED")} onClick={() => setLeads((l) => moveTop(l, "CONTACTED", "QUALIFIED"))}>
          Qualify one
        </Button>
        <Button size="sm" disabled={!has("QUALIFIED")} onClick={() => setLeads((l) => moveTop(l, "QUALIFIED", "WON"))}>
          Win one
        </Button>
        <Button size="sm" disabled={!has("QUALIFIED")} onClick={() => setLeads((l) => moveTop(l, "QUALIFIED", "LOST"))}>
          Lose one
        </Button>
      </div>
      <button type="button" onClick={() => setLeads(START)} className="mt-2 self-start text-[12px] text-fg-muted underline underline-offset-4 hover:text-fg">
        Reset to the demo data
      </button>
    </div>
  );
}
