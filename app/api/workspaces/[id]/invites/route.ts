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
    await requireWorkspaceMember(userId, workspaceId);

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invites);
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
