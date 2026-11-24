import { vi } from "vitest";

/** Route handler context for dynamic `[id]` segments. */
export function idContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** Shared state the module mocks below read; tests mutate it per case. */
export const guard = {
  signedIn: true,
  member: true,
  userId: "user-1",
  isDemo: false,
  role: "MEMBER" as "OWNER" | "ADMIN" | "MEMBER",
};

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export const sessionMock = {
  UnauthorizedError,
  requireUserId: vi.fn(async () => {
    if (!guard.signedIn) throw new UnauthorizedError("Unauthorized");
    return guard.userId;
  }),
  requireSessionUser: vi.fn(async () => {
    if (!guard.signedIn) throw new UnauthorizedError("Unauthorized");
    return { id: guard.userId, email: "me@x.example", isDemo: guard.isDemo };
  }),
  forbidInDemo: vi.fn((user: { isDemo: boolean }, action: string) => {
    if (user.isDemo) throw new ForbiddenError(`${action} is turned off in the demo account.`);
  }),
};

export const workspaceMock = {
  ForbiddenError,
  requireWorkspaceMember: vi.fn(async () => {
    if (!guard.member) throw new ForbiddenError("You do not have access to this workspace.");
    return guard.role;
  }),
  requireWorkspaceRole: vi.fn(async (_u: string, _w: string, roles: string[]) => {
    if (!guard.member || !roles.includes(guard.role)) throw new ForbiddenError("You do not have access to this workspace.");
    return guard.role;
  }),
};

export const prismaClientMock = {
  Prisma: { PrismaClientKnownRequestError: class extends Error {} },
};

export function resetGuard() {
  guard.signedIn = true;
  guard.member = true;
  guard.userId = "user-1";
  guard.isDemo = false;
  guard.role = "MEMBER";
}
