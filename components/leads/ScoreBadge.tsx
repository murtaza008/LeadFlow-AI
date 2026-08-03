"use client";

import { scoreColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ScoreBadge({
  score,
  size = "md",
  animate = false,
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}) {
  const color = scoreColorVar(score);
  const dims = size === "sm" ? "h-7 w-7 text-[11px]" : size === "lg" ? "h-14 w-14 text-[20px]" : "h-9 w-9 text-[13px]";
  return (
    <span
      className={cn(
        "mono-data flex shrink-0 items-center justify-center rounded-lg font-700",
        dims,
        animate && "animate-score-settle",
        className,
      )}
      style={{ color, backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      {score}
    </span>
  );
}
