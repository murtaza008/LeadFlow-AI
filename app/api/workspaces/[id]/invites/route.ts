import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser, requireUserId } from "@/lib/session";
import { requireWorkspaceMember, requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const CreateInviteInput = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    const role = await requireWorkspaceMember(userId, workspaceId);

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, token: true, expiresAt: true, createdAt: true },
    });
    // The token is the invite link. Only people who may invite get it, so a
    // Member can't copy an Admin invite and join with more rights.
    const canInvite = role === "OWNER" || role === "ADMIN";
    return NextResponse.json(invites.map(({ token, ...rest }) => (canInvite ? { ...rest, token } : rest)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await context.params;
    const user = await requireSessionUser();
    const userId = user.id;
    await requireWorkspaceRole(userId, workspaceId, ["OWNER", "ADMIN"]);
    forbidInDemo(user, "Inviting team members");

    const { email, role } = CreateInviteInput.parse(await request.json().catch(() => null));
    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: email.toLowerCase().trim(),
        role,
        invitedById: userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
