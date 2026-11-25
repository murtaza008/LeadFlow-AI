import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Change vs the previous period. `good` says which direction is good news;
 * "neutral" keeps volume changes uncoloured (more chats is not good or bad).
 * Always shown with an arrow and words, never colour alone.
 */
export function Delta({
  value,
  unit = "%",
  good = "neutral",
  className,
}: {
  value: number | null;
  unit?: "%" | " pts";
  good?: "up" | "down" | "neutral";
  className?: string;
}) {
  if (value === null) {
    return <span className={cn("text-[12px] text-fg-muted", className)}>Nothing to compare with yet</span>;
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : ArrowRight;
  const positive = good === "up" ? value > 0 : good === "down" ? value < 0 : null;
  const tone =
    value === 0 || positive === null
      ? "text-fg-muted"
      : positive
        ? "text-success-text"
        : "text-danger-text";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-medium tabular", tone, className)}>
      <Icon aria-hidden className="size-3.5" />
      {value > 0 ? "+" : ""}
      {value}
      {unit}
    </span>
  );
}
