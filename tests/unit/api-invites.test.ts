import { beforeEach, describe, expect, it, vi } from "vitest";
import { guard, idContext, resetGuard } from "./helpers";

const prisma = vi.hoisted(() => ({ workspaceInvite: { findMany: vi.fn(), create: vi.fn() } }));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/session", async () => (await import("./helpers")).sessionMock);
vi.mock("@/lib/workspace", async () => (await import("./helpers")).workspaceMock);
vi.mock("@/lib/generated/prisma/client", async () => (await import("./helpers")).prismaClientMock);

const { GET, POST } = await import("@/app/api/workspaces/[id]/invites/route");
const get = () => GET(new Request("http://test/api/workspaces/ws-1/invites"), idContext("ws-1"));
const post = (body: unknown) =>
  POST(new Request("http://test/api/workspaces/ws-1/invites", { method: "POST", body: JSON.stringify(body) }), idContext("ws-1"));

const row = { id: "i1", email: "sam@x.example", role: "ADMIN", token: "secret-token", expiresAt: new Date(), createdAt: new Date() };

describe("GET /api/workspaces/[id]/invites", () => {
  beforeEach(() => {
    resetGuard();
    prisma.workspaceInvite.findMany.mockResolvedValue([row]);
  });

  it("returns 401 signed out and 403 for a non-member", async () => {
    guard.signedIn = false;
    expect((await get()).status).toBe(401);
    resetGuard();
    guard.member = false;
    expect((await get()).status).toBe(403);
    expect(prisma.workspaceInvite.findMany).not.toHaveBeenCalled();
  });

  it("gives the invite link token to Owners and Admins", async () => {
    for (const role of ["OWNER", "ADMIN"] as const) {
      guard.role = role;
      const body = await (await get()).json();
      expect(body[0].token).toBe("secret-token");
    }
  });

  it("hides the token from Members, so they can't use an Admin invite", async () => {
    guard.role = "MEMBER";
    const body = await (await get()).json();
    expect(body[0]).toMatchObject({ email: "sam@x.example", role: "ADMIN" });
    expect(body[0].token).toBeUndefined();
  });

  it("only reads pending invites of this workspace", async () => {
    await get();
    expect(prisma.workspaceInvite.findMany.mock.calls[0][0].where).toEqual({ workspaceId: "ws-1", acceptedAt: null });
  });
});

describe("POST /api/workspaces/[id]/invites", () => {
  beforeEach(() => {
    resetGuard();
    prisma.workspaceInvite.create.mockResolvedValue(row);
  });

  it("lets Owners and Admins invite, not Members", async () => {
    guard.role = "MEMBER";
    expect((await post({ email: "a@x.example" })).status).toBe(403);
    guard.role = "ADMIN";
    expect((await post({ email: "a@x.example" })).status).toBe(201);
  });

  it("is turned off for the demo account", async () => {
    guard.role = "OWNER";
    guard.isDemo = true;
    expect((await post({ email: "a@x.example" })).status).toBe(403);
    expect(prisma.workspaceInvite.create).not.toHaveBeenCalled();
  });

  it("rejects a bad email", async () => {
    guard.role = "OWNER";
    expect((await post({ email: "not-an-email" })).status).toBe(400);
  });
});
