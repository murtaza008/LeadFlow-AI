import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, idContext, resetGuard } from "./helpers";

const prisma = vi.hoisted(() => ({
  activity: { findMany: vi.fn() },
  followUp: { findMany: vi.fn() },
  workspaceMember: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET } = await import("@/app/api/workspaces/[id]/activity/route");
const { buildActivity, ACTIVITY_LIMIT } = await import("@/lib/activity");
const req = new Request("http://test/api/workspaces/ws-1/activity");

const at = (iso: string) => new Date(iso);
const priya = { displayName: "Priya Raman", email: "priya@northwind.demo" };
const lead = (id: string, name: string) => ({ id, name });

describe("buildActivity", () => {
  it("turns rows into readable events, newest first, without the viewer's own actions", () => {
    const feed = buildActivity(
      {
        activities: [
          { id: "a1", type: "STATUS_CHANGE", body: "Stage changed from QUALIFIED to WON.", createdAt: at("2026-11-24T10:00:00Z"), createdById: "u2", createdBy: priya, lead: lead("l1", "Ledgerly") },
          { id: "a2", type: "STATUS_CHANGE", body: "Stage changed from NEW to CONTACTED.", createdAt: at("2026-11-23T10:00:00Z"), createdById: "u2", createdBy: priya, lead: lead("l2", "Harbor Clinics") },
          { id: "a3", type: "AI_SCORE", body: "AI scored this lead 82/100 (HOT): Budget is approved for Q4.", createdAt: at("2026-11-22T10:00:00Z"), createdById: null, createdBy: null, lead: lead("l3", "Tidewater") },
          { id: "a4", type: "CALL", body: "Discovery call.\nSecond line", createdAt: at("2026-11-21T10:00:00Z"), createdById: "u2", createdBy: priya, lead: lead("l1", "Ledgerly") },
          { id: "a5", type: "CALL", body: "My own call", createdAt: at("2026-11-25T09:00:00Z"), createdById: "me", createdBy: { displayName: "Me", email: "me@x.example" }, lead: lead("l1", "Ledgerly") },
          { id: "a6", type: "NOTE", body: "Notes are not notifications", createdAt: at("2026-11-25T08:00:00Z"), createdById: "u2", createdBy: priya, lead: lead("l1", "Ledgerly") },
        ],
        overdue: [{ id: "f1", title: "Send ROI one-pager to Samuel", dueAt: at("2026-11-23T18:00:00Z"), lead: lead("l4", "Freightline") }],
        members: [
          { id: "m1", userId: "me", role: "OWNER", createdAt: at("2026-11-25T07:00:00Z"), user: { displayName: "Me", email: "me@x.example" } },
          { id: "m2", userId: "u3", role: "ADMIN", createdAt: at("2026-11-20T07:00:00Z"), user: { displayName: null, email: "jordan@northwind.demo" } },
        ],
      },
      "me",
    );

    expect(feed.map((e) => e.type)).toEqual([
      "lead.won",
      "followup.overdue",
      "lead.stage",
      "lead.scored",
      "lead.logged",
      "member.joined",
    ]);
    expect(feed[0]).toMatchObject({ title: "Ledgerly was won", detail: "Priya Raman · Qualified → Won", href: "/leads/l1" });
    expect(feed[1]).toMatchObject({ title: "Overdue: Send ROI one-pager to Samuel", detail: "Freightline", href: "/leads/l4" });
    expect(feed[2].detail).toBe("Priya Raman · New → Contacted");
    expect(feed[3]).toMatchObject({ title: "Tidewater scored 82", detail: "Budget is approved for Q4." });
    expect(feed[4]).toMatchObject({ title: "Priya Raman logged a call with Ledgerly", detail: "Discovery call." });
    expect(feed[5]).toMatchObject({ title: "jordan joined", detail: "Added as admin", href: "/team" });
  });

  it("caps the feed", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: `f${i}`,
      title: `Task ${i}`,
      dueAt: new Date(Date.UTC(2026, 10, 1, 0, i)),
      lead: lead("l", "L"),
    }));
    const feed = buildActivity({ activities: [], overdue: many, members: [] }, "me");
    expect(feed).toHaveLength(ACTIVITY_LIMIT);
    expect(feed[0].id).toBe("fu-f59");
  });

  it("is empty for a quiet workspace", () => {
    expect(buildActivity({ activities: [], overdue: [], members: [] }, "me")).toEqual([]);
  });
});

describe("GET /api/workspaces/[id]/activity", () => {
  beforeEach(() => {
    resetGuard();
    prisma.activity.findMany.mockResolvedValue([
      { id: "a1", type: "CALL", body: "Intro call", createdAt: at("2026-11-24T10:00:00Z"), createdById: "u2", createdBy: priya, lead: lead("l1", "Ledgerly") },
    ]);
    prisma.followUp.findMany.mockResolvedValue([]);
    prisma.workspaceMember.findMany.mockResolvedValue([]);
  });

  it("returns 401 when signed out", async () => {
    guard.signedIn = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(401);
  });

  it("returns 403 for a non-member and reads nothing", async () => {
    guard.member = false;
    expect((await GET(req, idContext("ws-1"))).status).toBe(403);
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
  });

  it("reads only this workspace, skips the viewer's own activity and only open overdue follow-ups", async () => {
    const res = await GET(req, idContext("ws-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].type).toBe("lead.logged");

    const actWhere = prisma.activity.findMany.mock.calls[0][0].where;
    expect(actWhere.workspaceId).toBe("ws-1");
    expect(actWhere.OR).toEqual([{ createdById: null }, { createdById: { not: "user-1" } }]);
    expect(prisma.followUp.findMany.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws-1", done: false });
    expect(prisma.workspaceMember.findMany.mock.calls[0][0].where.workspaceId).toBe("ws-1");
  });
});
