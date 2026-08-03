import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma/enums";

export class ForbiddenError extends Error {
  constructor(message = "You do not have access to this workspace.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

/** The workspace the user belongs to, plus their role in it. One workspace per user for now. */
export async function getCurrentWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });
  if (!membership) return null;
  return { ...membership.workspace, role: membership.role };
}

export async function createWorkspaceWithMembership(userId: string, name: string) {
  const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      createdById: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });
  return workspace;
}

/** Throws unless the user is a member of the workspace. Returns their role. */
export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string,
): Promise<Role> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!membership) throw new ForbiddenError();
  return membership.role;
}

/** Throws unless the user's role in the workspace is one of `roles`. */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  roles: Role[],
): Promise<Role> {
  const role = await requireWorkspaceMember(userId, workspaceId);
  if (!roles.includes(role)) throw new ForbiddenError();
  return role;
}
