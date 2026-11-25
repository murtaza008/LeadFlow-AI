import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, resetGuard } from "./helpers";
import { computeAnalytics, type AnalyticsLead } from "@/lib/analytics-calc";

const prisma = vi.hoisted(() => ({
  lead: { findMany: vi.fn() },
  activity: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/analytics/route");
const req = (q = "") => new Request(`http://test/api/analytics${q}`);

const DAY = 86_400_000;
const now = new Date("2026-11-25T12:00:00Z");
const ago = (d: number) => new Date(now.getTime() - d * DAY);

describe("computeAnalytics periods", () => {
  const lead = (p: Partial<AnalyticsLead> & Pick<AnalyticsLead, "status">): AnalyticsLead => ({
    value: 1000,
    score: 50,
    source: "Referral",
    createdAt: ago(5),
    updatedAt: ago(1),
    ...p,
  });

  it("compares the last N days with the N days before, using the close date", () => {
    const leads = [
      lead({ status: "WON", value: 5000, createdAt: ago(40), closedAt: ago(10) }),
      lead({ status: "WON", value: 3000, createdAt: ago(70), closedAt: ago(45) }),
      lead({ status: "LOST", createdAt: ago(20), closedAt: ago(3) }),
      lead({ status: "LOST", createdAt: ago(80), closedAt: ago(50) }),
      lead({ status: "LOST", createdAt: ago(80), closedAt: ago(55) }),
      // Edited yesterday but won 100 days ago: counts in neither window.
      lead({ status: "WON", createdAt: ago(120), updatedAt: ago(1), closedAt: ago(100) }),
      lead({ status: "NEW", createdAt: ago(2) }),
    ];
    const a = computeAnalytics(leads, now, 30);
    expect(a.period.current).toEqual({ created: 2, won: 1, wonValue: 5000, lost: 1, winRate: 50 });
    expect(a.period.previous).toEqual({ created: 1, won: 1, wonValue: 3000, lost: 2, winRate: 33 });
  });

  it("has no win rate when nothing closed", () => {
    expect(computeAnalytics([lead({ status: "NEW" })], now, 30).period.current.winRate).toBeNull();
  });

  it("breaks sources down with a win rate over closed deals only", () => {
    const a = computeAnalytics(
      [
        lead({ status: "WON", source: "Website" }),
        lead({ status: "LOST", source: "Website" }),
        lead({ status: "NEW", source: "Website", value: 700 }),
        lead({ status: "NEW", source: null }),
      ],
      now,
    );
    expect(a.sources[0]).toEqual({ source: "Website", total: 3, won: 1, lost: 1, open: 1, openValue: 700, winRate: 50 });
    expect(a.sources[1]).toMatchObject({ source: "Unknown", winRate: null });
  });

  it("buckets the trend by week for 30/90 days and by month for a year", () => {
    expect(computeAnalytics([], now, 30).trend).toHaveLength(5);
    expect(computeAnalytics([], now, 90).trend).toHaveLength(13);
    const year = computeAnalytics([lead({ status: "NEW", createdAt: ago(40) })], now, 365).trend;
    expect(year).toHaveLength(12);
    expect(year.reduce((s, p) => s + p.created, 0)).toBe(1);
  });

  it("lists the biggest open deals and sums per owner", () => {
    const a = computeAnalytics(
      [
        lead({ id: "a", name: "A", status: "NEW", value: 100, owner: { id: "u1", name: "Priya" } }),
        lead({ id: "b", name: "B", status: "QUALIFIED", value: 900, owner: { id: "u1", name: "Priya" } }),
        lead({ id: "c", name: "C", status: "WON", value: 400, owner: { id: "u2", name: "Jordan" } }),
        lead({ id: "d", name: "D", status: "CONTACTED", value: 50 }),
      ],
      now,
    );
    expect(a.topOpen.map((t) => t.id)).toEqual(["b", "a", "d"]);
    expect(a.owners[0]).toEqual({ id: "u1", name: "Priya", open: 2, openValue: 1000, won: 0, wonValue: 0 });
    expect(a.owners.find((o) => o.id === "unassigned")).toMatchObject({ open: 1, openValue: 50 });
  });
});

describe("GET /api/analytics", () => {
  beforeEach(() => {
    resetGuard();
    prisma.lead.findMany.mockResolvedValue([
      {
        id: "l1",
        name: "Elena",
        company: "Brightline",
        status: "WON",
        value: "96000.00",
        score: 90,
        source: "Referral",
        createdAt: ago(20),
        updatedAt: ago(1),
        assignedTo: { id: "u1", displayName: null, email: "alex@x.example" },
      },
    ]);
    prisma.activity.findMany.mockResolvedValue([{ leadId: "l1", createdAt: ago(4) }]);
  });

  it("returns 401 when signed out", async () => {
    guard.signedIn = false;
    expect((await GET(req())).status).toBe(401);
  });

  it("returns 403 without a workspace and reads nothing", async () => {
    guard.member = false;
    expect((await GET(req())).status).toBe(403);
    expect(prisma.lead.findMany).not.toHaveBeenCalled();
  });

  it("rejects an unknown range before touching the database", async () => {
    expect((await GET(req("?days=7"))).status).toBe(400);
    expect((await GET(req("?days=abc"))).status).toBe(400);
    expect(prisma.lead.findMany).not.toHaveBeenCalled();
  });

  it("reads only the caller's workspace and uses the timeline for close dates", async () => {
    const res = await GET(req("?days=90"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.days).toBe(90);
    expect(body.period.current.wonValue).toBe(96000);
    expect(body.owners[0].name).toBe("alex");
    expect(prisma.lead.findMany.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1" });
    expect(prisma.activity.findMany.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws-1", type: "STATUS_CHANGE" });
  });
});
