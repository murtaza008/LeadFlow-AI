import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { statusLabel, type Status } from "@/lib/format";

const STAGES: Status[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-40", min: 21, max: 40 },
  { label: "41-60", min: 41, max: 60 },
  { label: "61-80", min: 61, max: 80 },
  { label: "81-100", min: 81, max: 100 },
];

function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const leads = await prisma.lead.findMany({ where: { workspaceId: workspace.id } });

    const funnel = STAGES.map((stage) => {
      const inStage = leads.filter((l) => l.status === stage);
      return {
        stage,
        label: statusLabel[stage],
        count: inStage.length,
        value: inStage.reduce((s, l) => s + Number(l.value), 0),
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

    const now = new Date();
    const weeks: { week: string; created: number; won: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = weekKey(d);
      weeks.push({ week: key, created: 0, won: 0 });
    }
    const weekIndex = new Map(weeks.map((w, i) => [w.week, i]));
    for (const l of leads) {
      const key = weekKey(l.createdAt);
      const idx = weekIndex.get(key);
      if (idx !== undefined) weeks[idx].created += 1;
    }
    for (const l of leads.filter((l) => l.status === "WON")) {
      const key = weekKey(l.updatedAt);
      const idx = weekIndex.get(key);
      if (idx !== undefined) weeks[idx].won += 1;
    }

    const total = leads.length;
    const won = leads.filter((l) => l.status === "WON").length;
    const avgScore = total ? Math.round(leads.reduce((s, l) => s + l.score, 0) / total) : 0;

    return NextResponse.json({
      funnel,
      bySource,
      scoreDistribution,
      weekly: weeks,
      totals: { total, won, avgScore, winRate: total ? Math.round((won / total) * 100) : 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
