import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, idContext, resetGuard } from "./helpers";

const prisma = vi.hoisted(() => ({
  lead: { groupBy: vi.fn(), count: vi.fn() },
  followUp: { count: vi.fn() },
  workspaceMember: { count: vi.fn() },
  workspaceInvite: { count: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/workspaces/[id]/summary/route");
const { getWorkspaceSummary } = await import("@/lib/workspace-summary");
const req = new Request("http://test/api/workspaces/ws-1/summary");

const group = (status: string, priority: string, count: number, value: number) => ({
  status,
  priority,
  _count: { _all: count },
  _sum: { value },
});

beforeEach(() => {
  resetGuard();
  prisma.lead.groupBy.mockResolvedValue([
    group("NEW", "HOT", 2, 10_000),
    group("NEW", "COLD", 3, 1_500.5),
    group("QUALIFIED", "WARM", 4, 40_000),
    group("WON", "HOT", 5, 99_000),
    group("LOST", "COLD", 1, 2_000),
  ]);
  prisma.lead.count.mockResolvedValue(6);
  // overdue, due today, upcoming
  prisma.followUp.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(7);
  prisma.workspaceMember.count.mockResolvedValue(3);
  prisma.workspaceInvite.count.mockResolvedValue(1);
});

describe("getWorkspaceSummary", () => {
  it("adds up open leads, hot leads and open value, leaving closed deals out", async () => {
    const s = await getWorkspaceSummary("ws-1", new Date("2026-11-25T12:00:00Z"));
    expect(s.leads).toEqual({
      total: 15,
      open: 9,
      hotOpen: 2,
      openValue: 51_501,
      newThisWeek: 6,
      byStage: { NEW: 5, CONTACTED: 0, QUALIFIED: 4, WON: 5, LOST: 1 },
    });
    expect(s.followUps).toEqual({ overdue: 2, dueToday: 1, upcoming: 7 });
    expect(s.members).toBe(3);
    expect(s.pendingInvites).toBe(1);
  });

  it("scopes every query to the workspace and counts only open follow-ups and live invites", async () => {
    await getWorkspaceSummary("ws-1");
    expect(prisma.lead.groupBy.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1" });
    expect(prisma.lead.count.mock.calls[0][0].where.workspaceId).toBe("ws-1");
    for (const [args] of prisma.followUp.count.mock.calls) {
      expect(args.where).toMatchObject({ workspaceId: "ws-1", done: false });
    }
    expect(prisma.workspaceMember.count.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1" });
    expect(prisma.workspaceInvite.count.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws-1", acceptedAt: null });
  });
});

describe("GET /api/workspaces/[id]/summary", () => {
  it("returns 401 when signed out", async () => {
    guard.signedIn = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(401);
  });

  it("returns 403 for a non-member and reads nothing", async () => {
    guard.member = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(403);
    expect(prisma.lead.groupBy).not.toHaveBeenCalled();
  });

  it("returns the summary for a member of any role", async () => {
    guard.role = "MEMBER";
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads.open).toBe(9);
    expect(prisma.lead.groupBy.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1" });
  });
});
