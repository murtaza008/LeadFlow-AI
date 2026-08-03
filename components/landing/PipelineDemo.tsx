"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type DemoLead = {
  id: string;
  company: string;
  contact: string;
  value: number;
  score: number;
  hot?: boolean;
  low?: boolean;
};

type Column = { key: string; label: string; leads: DemoLead[] };

const DATASET_A: Column[] = [
  {
    key: "new",
    label: "New",
    leads: [
      { id: "a1", company: "Northwind Labs", contact: "Priya Nair", value: 12400, score: 61 },
      { id: "a2", company: "Vellum & Co", contact: "Marcus Reid", value: 4800, score: 23, low: true },
      { id: "a3", company: "Halcyon Freight", contact: "Dana Wu", value: 9200, score: 48 },
    ],
  },
  {
    key: "contacted",
    label: "Contacted",
    leads: [
      { id: "a4", company: "Brightpath Health", contact: "Leo Fontaine", value: 27500, score: 72 },
      { id: "a5", company: "Cedar Retail", contact: "Ana Sørensen", value: 15600, score: 55 },
    ],
  },
  {
    key: "qualified",
    label: "Qualified",
    leads: [
      { id: "a6", company: "Meridian Cloud", contact: "Jamal Osei", value: 61000, score: 94, hot: true },
      { id: "a7", company: "Tessera Group", contact: "Rin Tanaka", value: 33200, score: 81 },
    ],
  },
  {
    key: "won",
    label: "Won",
    leads: [
      { id: "a8", company: "Oaklight Partners", contact: "Sofia Marín", value: 88400, score: 97 },
      { id: "a9", company: "Kestrel Systems", contact: "Tom Beckett", value: 42000, score: 89 },
    ],
  },
];

const DATASET_B: Column[] = [
  {
    key: "new",
    label: "New",
    leads: [
      { id: "b1", company: "Fathom Analytics", contact: "Wei Chen", value: 7600, score: 51 },
      { id: "b2", company: "Dockside Media", contact: "Ivy Larsen", value: 3200, score: 23, low: true },
      { id: "b3", company: "Arbor Legal", contact: "Omar Haddad", value: 18900, score: 66 },
    ],
  },
  {
    key: "contacted",
    label: "Contacted",
    leads: [
      { id: "b4", company: "Silverline HR", contact: "Grace Okoro", value: 21400, score: 58 },
      { id: "b5", company: "Pinecrest Realty", contact: "Ben Alvarez", value: 12800, score: 44 },
    ],
  },
  {
    key: "qualified",
    label: "Qualified",
    leads: [
      { id: "b6", company: "Nimbus Security", contact: "Ada Volkov", value: 54700, score: 94, hot: true },
      { id: "b7", company: "Lumen Studios", contact: "Kai Bright", value: 29500, score: 77 },
    ],
  },
  {
    key: "won",
    label: "Won",
    leads: [
      { id: "b8", company: "Crestwood Bank", contact: "Nadia Faris", value: 96200, score: 98 },
      { id: "b9", company: "Ironwood Mfg", contact: "Pete Salt", value: 38600, score: 85 },
    ],
  },
];

function dotFor(score: number) {
  if (score >= 70) return "var(--color-mint)";
  if (score >= 40) return "var(--color-amber)";
  return "var(--color-danger)";
}

// Order in which cards reveal their score (left-to-right, top-to-bottom).
function flatOrder(cols: Column[]): string[] {
  const ids: string[] = [];
  const max = Math.max(...cols.map((c) => c.leads.length));
  for (let row = 0; row < max; row++) {
    for (const col of cols) {
      if (col.leads[row]) ids.push(col.leads[row].id);
    }
  }
  return ids;
}

function LeadCard({ lead, revealed, active }: { lead: DemoLead; revealed: boolean; active: boolean }) {
  const dimmed = active && lead.low && revealed;
  const glow = active && lead.hot && revealed;

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.4, ease: "easeInOut" } }}
      animate={{ opacity: dimmed ? 0.5 : 1 }}
      className={cn(
        "relative rounded-[10px] border bg-storm p-3 text-left",
        glow ? "border-mint" : "border-border-dark",
      )}
      style={
        glow
          ? {
              boxShadow:
                "0 0 0 1px var(--color-mint), 0 0 22px -4px color-mix(in oklab, var(--color-mint) 55%, transparent)",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-[13px] font-600 text-leaf">{lead.company}</p>
          <p className="truncate text-[11px] text-fog">{lead.contact}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: revealed ? dotFor(lead.score) : "var(--color-fog)" }}
          />
          {revealed ? (
            <span key={lead.score} className="mono-data animate-score-settle text-[13px] font-600 text-leaf">
              {lead.score}
            </span>
          ) : (
            <span className="mono-data animate-soft-pulse text-[13px] font-600 text-fog">—</span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="mono-data text-[12px] text-mint">{formatCurrency(lead.value)}</span>
        <AnimatePresence>
          {glow && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mono-data rounded-full bg-mint/15 px-1.5 py-0.5 text-[10px] font-600 text-mint"
            >
              🔥 Hot lead
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {dimmed && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mono-data absolute -bottom-2 left-3 rounded bg-danger px-1.5 py-0.5 text-[9px] font-500 text-white"
          >
            Low intent signals
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PipelineDemo() {
  const reduce = useReducedMotion();
  const [dataIdx, setDataIdx] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(false);

  const data = dataIdx % 2 === 0 ? DATASET_A : DATASET_B;

  const columns: Column[] = data.map((col) => {
    const leads = [...col.leads];
    if (active) {
      leads.sort((a, b) => {
        const ah = a.hot && revealedIds.has(a.id) ? 1 : 0;
        const bh = b.hot && revealedIds.has(b.id) ? 1 : 0;
        return bh - ah;
      });
    }
    return { ...col, leads };
  });

  useEffect(() => {
    if (reduce) {
      // Static frame for reduced-motion: show every score already settled.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time static init, not a derived-state sync loop
      setRevealedIds(new Set(flatOrder(DATASET_A)));
      setActive(true);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    function runCycle(idx: number) {
      if (cancelled) return;
      const cols = idx % 2 === 0 ? DATASET_A : DATASET_B;
      const order = flatOrder(cols);
      setDataIdx(idx);
      setRevealedIds(new Set());
      setActive(false);

      order.forEach((id, i) => {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setRevealedIds((prev) => new Set(prev).add(id));
          }, 400 + i * 200),
        );
      });
      const fillDone = 400 + order.length * 200;
      timers.push(setTimeout(() => !cancelled && setActive(true), fillDone + 150));
      timers.push(setTimeout(() => runCycle(idx + 1), fillDone + 150 + 3000));
    }

    runCycle(0);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduce]);

  return (
    <div className="w-full max-w-[820px] px-2" style={{ perspective: "1600px" }}>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transform: reduce ? undefined : "rotateX(-8deg)", transformStyle: "preserve-3d" }}
      >
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border-dark bg-growth/60 p-4 sm:grid-cols-4">
          {columns.map((col) => {
            const total = col.leads.reduce((s, l) => s + l.value, 0);
            return (
              <div key={col.key} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between border-b border-border-dark pb-2">
                  <span className="eyebrow text-fog">{col.label}</span>
                  <span className="mono-data text-[10px] text-fog">{formatCurrency(total)}</span>
                </div>
                {col.leads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} revealed={revealedIds.has(lead.id)} active={active} />
                ))}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
