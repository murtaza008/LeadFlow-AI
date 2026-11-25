"use client";

import { useId, useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";

type View = "chart" | "table";

/**
 * A panel with a title and a Chart / Table switch: every chart has a table
 * view with the same numbers. The switch is a radio group (one view at a time).
 */
export function ChartPanel({
  title,
  description,
  chart,
  table,
  footer,
  className,
}: {
  title: string;
  description?: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<View>("chart");
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("panel flex flex-col p-5", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-[15px] font-semibold text-fg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
        </div>
        <Segmented
          label={`${title}: view`}
          value={view}
          onChange={setView}
          options={[
            { value: "chart", label: "Chart" },
            { value: "table", label: "Table" },
          ]}
        />
      </header>
      <div className="mt-5 flex-1">{view === "chart" ? chart : <div className="overflow-x-auto">{table}</div>}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}

/** A small, valid data table for chart table views. */
export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: { label: string; numeric?: boolean }[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-[13px]">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-border">
          {columns.map((c) => (
            <th key={c.label} scope="col" className={cn("eyebrow py-2 pr-3 font-medium", c.numeric ? "text-right" : "text-left")}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            {r.map((cell, j) => (
              <td key={j} className={cn("py-2 pr-3 text-fg", columns[j]?.numeric && "tabular text-right")}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
