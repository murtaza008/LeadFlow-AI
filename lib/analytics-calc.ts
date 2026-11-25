/**
 * Pipeline analytics as a pure function of a workspace's leads. Used by
 * GET /api/analytics and by the landing page's live funnel demo.
 */

export type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

export const STAGES: Stage[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export const STAGE_LABEL: Record<Stage, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

export const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
] as const;

export type AnalyticsLead = {
  status: Stage;
  value: number;
  score: number;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Sunday that starts the week containing `date`, as YYYY-MM-DD (local time). */
export function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export function computeAnalytics(leads: readonly AnalyticsLead[], now: Date = new Date()) {
  const funnel = STAGES.map((stage) => {
    const inStage = leads.filter((l) => l.status === stage);
    return {
      stage,
      label: STAGE_LABEL[stage],
      count: inStage.length,
      value: inStage.reduce((s, l) => s + l.value, 0),
    };
  });

  const sourceCounts = new Map<string, number>();
  for (const l of leads) {
    const key = l.source?.trim() || "Unknown";
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const bySource = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const scoreDistribution = SCORE_BUCKETS.map((b) => ({
    bucket: b.label,
    count: leads.filter((l) => l.score >= b.min && l.score <= b.max).length,
  }));

  const weeks: { week: string; created: number; won: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push({ week: weekKey(d), created: 0, won: 0 });
  }
  const weekIndex = new Map(weeks.map((w, i) => [w.week, i]));
  for (const l of leads) {
    const idx = weekIndex.get(weekKey(l.createdAt));
    if (idx !== undefined) weeks[idx].created += 1;
    if (l.status === "WON") {
      const wonIdx = weekIndex.get(weekKey(l.updatedAt));
      if (wonIdx !== undefined) weeks[wonIdx].won += 1;
    }
  }

  const total = leads.length;
  const won = funnel[3].count;
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;

  return {
    funnel,
    bySource,
    scoreDistribution,
    weekly: weeks,
    totals: { total, won, avgScore, winRate: total ? Math.round((won / total) * 100) : 0 },
  };
}

export type Analytics = ReturnType<typeof computeAnalytics>;
