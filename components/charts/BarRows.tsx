import type { ReactNode } from "react";
import { staggerStyle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type BarRow = {
  key: string;
  label: ReactNode;
  value: number;
  /** Text shown at the end of the row, e.g. "8 · $183,500". */
  display: ReactNode;
  /** Extra right-hand column, e.g. a win rate. */
  aside?: ReactNode;
};

/**
 * Horizontal bars that grow from the left, one series in the accent colour.
 * A plain list, so it reads in order with a screen reader.
 */
export function BarRows({ rows, label, className }: { rows: BarRow[]; label: string; className?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ol aria-label={label} className={cn("stagger space-y-3", className)}>
      {rows.map((r, i) => (
        <li key={r.key} style={staggerStyle(i)} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1.5">
          <span className="min-w-0 truncate text-[13px] text-fg">{r.label}</span>
          <span className="tabular text-right text-[12.5px] text-fg-muted">{r.display}</span>
          <span className="col-span-2 flex items-center gap-3">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
              <span
                className="grow-x block h-full rounded-full bg-chart-1"
                style={{ width: `${r.value > 0 ? Math.max(2, (r.value / max) * 100) : 0}%`, animationDelay: `${Math.min(i, 15) * 35}ms` }}
              />
            </span>
            {r.aside !== undefined && <span className="w-16 shrink-0 text-right text-[12.5px] text-fg-muted">{r.aside}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
