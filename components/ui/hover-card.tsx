"use client";

import * as HC from "@radix-ui/react-hover-card";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one hover-preview component used across the app. Hover only adds detail:
 * everything shown here is also reachable by clicking through or by keyboard.
 *
 * `delay`: "short" for nav and KPIs; "long" where people click fast (list rows),
 * so moving the mouse across a list does not pop cards everywhere.
 */
export function HoverCard({
  trigger,
  children,
  side = "bottom",
  align = "start",
  delay = "short",
  className,
  width = 300,
  disabled = false,
}: {
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: "short" | "long";
  className?: string;
  width?: number;
  /** Render only the trigger (e.g. inside the touch navigation drawer). */
  disabled?: boolean;
}) {
  if (disabled) return <>{trigger}</>;
  return (
    <HC.Root openDelay={delay === "long" ? 650 : 280} closeDelay={90}>
      <HC.Trigger asChild>{trigger}</HC.Trigger>
      <HC.Portal>
        <HC.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          style={{ width }}
          className={cn("panel-raised z-50 p-4 text-sm text-fg outline-none", className)}
        >
          {children}
        </HC.Content>
      </HC.Portal>
    </HC.Root>
  );
}

/** Label/value rows for hover cards, as valid dl > div > dt + dd markup. */
export function HoverStats({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="mt-3 space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{r.label}</dt>
          <dd className="tabular font-medium text-fg">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
