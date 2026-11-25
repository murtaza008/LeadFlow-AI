export function formatCurrency(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

export type Priority = "HOT" | "WARM" | "COLD";

/** Tier for a score when no AI tier is stored (same thresholds as the demo seed). */
export function tierOf(score: number): Priority {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

/** Heat colours: hot = vermilion, warm = ochre (accent family), cold = slate. Never the danger colour. */
export const priorityStyle: Record<Priority, { label: string; className: string; bar: string }> = {
  HOT: { label: "Hot", className: "bg-hot-soft text-hot-text", bar: "bg-hot" },
  WARM: { label: "Warm", className: "bg-accent-soft text-accent-text", bar: "bg-accent" },
  COLD: { label: "Cold", className: "bg-cold-soft text-cold-text", bar: "bg-cold" },
};

export type Status = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

export const statusLabel: Record<Status, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function relativeDue(date: Date): { label: string; overdue: boolean } {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffMs < 0) return { label: "Overdue", overdue: true };
  if (diffDays === 0) return { label: "Due today", overdue: false };
  if (diffDays === 1) return { label: "Due tomorrow", overdue: false };
  return { label: `Due in ${diffDays}d`, overdue: false };
}
