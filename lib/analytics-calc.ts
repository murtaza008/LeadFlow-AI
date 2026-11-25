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

export const RANGES = [30, 90, 365] as const;
export type RangeDays = (typeof RANGES)[number];

export type AnalyticsLead = {
  id?: string;
  name?: string;
  company?: string | null;
  status: Stage;
  value: number;
  score: number;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** When the lead moved to Won or Lost (from its timeline). Falls back to updatedAt. */
  closedAt?: Date | null;
  owner?: { id: string; name: string } | null;
};

const DAY = 24 * 60 * 60 * 1000;
const isOpen = (s: Stage) => s !== "WON" && s !== "LOST";
const closedAt = (l: AnalyticsLead) => l.closedAt ?? l.updatedAt;
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null);

/** Sunday that starts the week containing `date`, as YYYY-MM-DD (local time). */
export function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" });
const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export type TrendPoint = { key: string; label: string; created: number; won: number; wonValue: number };

/** Created and won per week (30 and 90 days) or per month (a year). */
function trend(leads: readonly AnalyticsLead[], now: Date, days: number): TrendPoint[] {
  const monthly = days > 90;
  const points: TrendPoint[] = [];
  if (monthly) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      points.push({ key: monthKey(d), label: monthLabel.format(d), created: 0, won: 0, wonValue: 0 });
    }
  } else {
    const weeks = Math.ceil(days / 7);
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * DAY);
      const key = weekKey(d);
      points.push({ key, label: dayLabel.format(new Date(`${key}T12:00:00`)), created: 0, won: 0, wonValue: 0 });
    }
  }
  const index = new Map(points.map((p, i) => [p.key, i]));
  const keyOf = monthly ? monthKey : weekKey;
  for (const l of leads) {
    const c = index.get(keyOf(l.createdAt));
    if (c !== undefined) points[c].created += 1;
    if (l.status === "WON") {
      const w = index.get(keyOf(closedAt(l)));
      if (w !== undefined) {
        points[w].won += 1;
        points[w].wonValue += l.value;
      }
    }
  }
  return points;
}

/** Created / won / lost inside [from, to). */
function periodStats(leads: readonly AnalyticsLead[], from: number, to: number) {
  const inRange = (d: Date) => d.getTime() >= from && d.getTime() < to;
  const won = leads.filter((l) => l.status === "WON" && inRange(closedAt(l)));
  const lost = leads.filter((l) => l.status === "LOST" && inRange(closedAt(l)));
  return {
    created: leads.filter((l) => inRange(l.createdAt)).length,
    won: won.length,
    wonValue: won.reduce((s, l) => s + l.value, 0),
    lost: lost.length,
    winRate: pct(won.length, won.length + lost.length),
  };
}

export function computeAnalytics(leads: readonly AnalyticsLead[], now: Date = new Date(), days: number = 30) {
  const funnel = STAGES.map((stage) => {
    const inStage = leads.filter((l) => l.status === stage);
    return {
      stage,
      label: STAGE_LABEL[stage],
      count: inStage.length,
      value: inStage.reduce((s, l) => s + l.value, 0),
    };
  });

  const sourceMap = new Map<string, { total: number; won: number; lost: number; open: number; openValue: number }>();
  for (const l of leads) {
    const key = l.source?.trim() || "Unknown";
    const s = sourceMap.get(key) ?? { total: 0, won: 0, lost: 0, open: 0, openValue: 0 };
    s.total += 1;
    if (l.status === "WON") s.won += 1;
    else if (l.status === "LOST") s.lost += 1;
    else {
      s.open += 1;
      s.openValue += l.value;
    }
    sourceMap.set(key, s);
  }
  const sources = [...sourceMap.entries()]
    .map(([source, s]) => ({ source, ...s, winRate: pct(s.won, s.won + s.lost) }))
    .sort((a, b) => b.total - a.total || a.source.localeCompare(b.source));
  const bySource = sources.slice(0, 8).map(({ source, total }) => ({ source, count: total }));

  const scoreDistribution = SCORE_BUCKETS.map((b) => ({
    bucket: b.label,
    count: leads.filter((l) => l.score >= b.min && l.score <= b.max).length,
  }));

  // Kept for older clients: the last 8 weeks of created vs won.
  const weekly = trend(leads, now, 56).map((p) => ({ week: p.key, created: p.created, won: p.won }));

  const total = leads.length;
  const won = funnel[3].count;
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;

  const end = now.getTime() + 1;
  const current = periodStats(leads, end - days * DAY, end);
  const previous = periodStats(leads, end - 2 * days * DAY, end - days * DAY);

  const topOpen = leads
    .filter((l) => isOpen(l.status))
    .slice()
    .sort((a, b) => b.value - a.value || b.score - a.score)
    .slice(0, 5)
    .map((l) => ({ id: l.id ?? "", name: l.name ?? "", company: l.company ?? null, status: l.status, value: l.value, score: l.score }));

  const ownerMap = new Map<string, { id: string; name: string; open: number; openValue: number; won: number; wonValue: number }>();
  for (const l of leads) {
    const id = l.owner?.id ?? "unassigned";
    const o = ownerMap.get(id) ?? { id, name: l.owner?.name ?? "Unassigned", open: 0, openValue: 0, won: 0, wonValue: 0 };
    if (isOpen(l.status)) {
      o.open += 1;
      o.openValue += l.value;
    } else if (l.status === "WON") {
      o.won += 1;
      o.wonValue += l.value;
    }
    ownerMap.set(id, o);
  }
  const owners = [...ownerMap.values()].sort((a, b) => b.openValue + b.wonValue - (a.openValue + a.wonValue));

  return {
    days,
    funnel,
    bySource,
    sources,
    scoreDistribution,
    weekly,
    trend: trend(leads, now, days),
    totals: { total, won, avgScore, winRate: total ? Math.round((won / total) * 100) : 0 },
    period: { current, previous },
    topOpen,
    owners,
  };
}

export type Analytics = ReturnType<typeof computeAnalytics>;
