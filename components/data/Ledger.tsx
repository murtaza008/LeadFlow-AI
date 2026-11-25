"use client";

import { Fragment, type ReactNode } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HoverCard } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type LedgerItem = {
  label: string;
  value: number | null;
  format?: (n: number) => string;
  /** One short line under the number: a Delta, or context like "across 23 deals". */
  foot?: ReactNode;
  /** The breakdown behind the number, shown on hover and keyboard focus. */
  breakdown?: ReactNode;
};

/**
 * Key numbers as one ruled strip (a ledger), not a row of separate cards.
 * Each number counts to its value (final value in data-value), and cells with a
 * breakdown are focusable so keyboard users get the same detail as hover.
 */
export function Ledger({ items, loading, className }: { items: LedgerItem[]; loading?: boolean; className?: string }) {
  return (
    <dl
      className={cn(
        "panel grid grid-cols-2 overflow-hidden lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none",
        className,
      )}
    >
      {items.map((item, i) => {
        const cell = (
          <div
            tabIndex={item.breakdown ? 0 : undefined}
            className={cn(
              "flex min-w-0 flex-col justify-between gap-3 border-border px-5 py-4 outline-none transition-colors",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t lg:border-t-0",
              i > 0 && "lg:border-l",
              item.breakdown && "cursor-default hover:bg-surface-2 focus-visible:bg-surface-2",
            )}
          >
            <dt className="text-[12.5px] font-medium text-fg-muted">{item.label}</dt>
            <dd className="min-w-0">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="block font-display text-[30px] font-semibold leading-none tracking-[-0.025em] text-fg">
                  {item.value === null ? (
                    <>
                      <span aria-hidden>—</span>
                      <span className="sr-only">Not enough data</span>
                    </>
                  ) : (
                    <AnimatedNumber value={item.value} format={item.format} />
                  )}
                </span>
              )}
              <span className="mt-2 flex min-h-[18px] items-center gap-1.5 text-[12px] text-fg-muted">{!loading && item.foot}</span>
            </dd>
          </div>
        );
        if (!item.breakdown) return <Fragment key={item.label}>{cell}</Fragment>;
        return (
          <HoverCard key={item.label} trigger={cell} side="bottom" align="start" width={290}>
            <p className="font-medium">{item.label}</p>
            {item.breakdown}
          </HoverCard>
        );
      })}
    </dl>
  );
}
