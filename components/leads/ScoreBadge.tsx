import { priorityStyle, tierOf, type Priority } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The AI score in its tier colour. Pass `priority` when the lead has a stored tier. */
export function ScoreBadge({
  score,
  priority,
  size = "md",
  animate = false,
  className,
}: {
  score: number;
  priority?: Priority;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}) {
  const tier = priority ?? tierOf(score);
  const dims = size === "sm" ? "h-6 min-w-7 px-1 text-[12px]" : size === "lg" ? "h-14 w-14 text-[22px]" : "h-8 min-w-9 px-1.5 text-[13px]";
  return (
    <span
      className={cn(
        "tabular inline-flex shrink-0 items-center justify-center rounded-md font-mono font-semibold",
        dims,
        priorityStyle[tier].className,
        animate && "pop",
        className,
      )}
    >
      {score}
      <span className="sr-only">, {priorityStyle[tier].label}</span>
    </span>
  );
}
