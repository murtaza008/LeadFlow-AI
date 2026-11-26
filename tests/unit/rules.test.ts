import { describe, expect, it } from "vitest";
import { DAY_MS, rulesForCreated, rulesForStageChange } from "@/lib/automation-rules";
import { FOCUS_CANDIDATES, focusCandidates, keepKnownPicks } from "@/lib/focus";
import { computeAnalytics, weekKey, type AnalyticsLead } from "@/lib/analytics-calc";

const now = new Date("2026-11-25T10:00:00Z");

describe("automation rules", () => {
  it("a new lead gets an email follow-up due in 24 hours", () => {
    const r = rulesForCreated(now);
    expect(r.followUps).toEqual([{ title: "Reach out within 24h", type: "EMAIL", dueAt: new Date(now.getTime() + DAY_MS) }]);
    expect(r.timeline[0].type).toBe("NOTE");
  });

  it("moving into Qualified adds a proposal task due in 2 days", () => {
    const r = rulesForStageChange("CONTACTED", "QUALIFIED", now);
    expect(r.followUps).toEqual([{ title: "Send proposal", type: "TASK", dueAt: new Date(now.getTime() + 2 * DAY_MS) }]);
    expect(r.timeline).toEqual([{ type: "STATUS_CHANGE", body: "Stage changed from CONTACTED to QUALIFIED." }]);
  });

  it("other moves are only logged; no move, no entry", () => {
    expect(rulesForStageChange("QUALIFIED", "WON", now).followUps).toEqual([]);
    expect(rulesForStageChange("QUALIFIED", "WON", now).timeline).toHaveLength(1);
    expect(rulesForStageChange("NEW", "NEW", now)).toEqual({ followUps: [], timeline: [] });
  });
});

describe("focus candidates", () => {
  const leads = Array.from({ length: 40 }, (_, i) => ({
    id: `l${i}`,
    score: i,
    status: i % 10 === 0 ? "WON" : i % 7 === 0 ? "LOST" : "NEW",
  }));

  it("keeps open leads only, highest score first, at most 25", () => {
    const c = focusCandidates(leads);
    expect(c).toHaveLength(FOCUS_CANDIDATES);
    expect(c.every((l) => l.status === "NEW")).toBe(true);
    expect(c.map((l) => l.score)).toEqual([...c.map((l) => l.score)].sort((a, b) => b - a));
    expect(c[0].id).toBe("l39");
  });

  it("drops picks the model made up and caps at 5", () => {
    const c = focusCandidates(leads);
    const picks = [{ leadId: "l39" }, { leadId: "invented" }, { leadId: "l38" }, { leadId: "l0" }, ...c.slice(3, 9).map((l) => ({ leadId: l.id }))];
    const kept = keepKnownPicks(picks, c);
    expect(kept).toHaveLength(5);
    expect(kept.map((p) => p.leadId)).not.toContain("invented");
    expect(kept.map((p) => p.leadId)).not.toContain("l0"); // won, so never a candidate
  });
});

describe("computeAnalytics", () => {
  const lead = (status: AnalyticsLead["status"], value: number, score: number, source: string | null, daysAgo: number): AnalyticsLead => ({
    status,
    value,
    score,
    source,
    createdAt: new Date(now.getTime() - daysAgo * DAY_MS),
    updatedAt: new Date(now.getTime() - Math.max(0, daysAgo - 3) * DAY_MS),
  });
  const leads = [
    lead("NEW", 1000, 15, "Referral", 1),
    lead("QUALIFIED", 5000, 72, "Website", 10),
    lead("WON", 8000, 90, "Referral", 20),
    lead("LOST", 2000, 30, "  ", 30),
    lead("WON", 4000, 85, "Website", 200),
  ];

  it("builds the funnel, sources, buckets and totals", () => {
    const a = computeAnalytics(leads, now);
    expect(a.funnel.map((f) => [f.stage, f.count, f.value])).toEqual([
      ["NEW", 1, 1000],
      ["CONTACTED", 0, 0],
      ["QUALIFIED", 1, 5000],
      ["WON", 2, 12000],
      ["LOST", 1, 2000],
    ]);
    expect(a.bySource).toEqual([
      { source: "Referral", count: 2 },
      { source: "Website", count: 2 },
      { source: "Unknown", count: 1 },
    ]);
    expect(a.scoreDistribution.map((b) => b.count)).toEqual([1, 1, 0, 1, 2]);
    expect(a.totals).toEqual({ total: 5, won: 2, avgScore: 58, winRate: 40 });
  });

  it("counts created and won per week over the last 8 weeks only", () => {
    const a = computeAnalytics(leads, now);
    expect(a.weekly).toHaveLength(8);
    expect(a.weekly.at(-1)!.week).toBe(weekKey(now));
    expect(a.weekly.reduce((s, w) => s + w.created, 0)).toBe(4); // the 200-day-old lead is outside
    expect(a.weekly.reduce((s, w) => s + w.won, 0)).toBe(1);
  });

  it("is all zeros for an empty workspace", () => {
    expect(computeAnalytics([], now).totals).toEqual({ total: 0, won: 0, avgScore: 0, winRate: 0 });
  });
});
