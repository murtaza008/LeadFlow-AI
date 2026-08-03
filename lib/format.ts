export function formatCurrency(value: number): string {
  return "$" + Math.round(value).toLocaleString("en-US");
}

export function scoreColorVar(score: number): string {
  if (score >= 70) return "var(--color-mint)";
  if (score >= 40) return "var(--color-amber)";
  return "var(--color-danger)";
}

export type Priority = "HOT" | "WARM" | "COLD";

export const priorityStyle: Record<Priority, { label: string; className: string }> = {
  HOT: { label: "Hot", className: "bg-ember-dim text-ember" },
  WARM: {
    label: "Warm",
    className: "bg-[color-mix(in_oklab,var(--color-amber)_15%,transparent)] text-amber",
  },
  COLD: { label: "Cold", className: "bg-muted text-muted-foreground" },
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
