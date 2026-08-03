import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { handleApiError } from "@/lib/handle-error";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: { name: true } } },
    });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      workspaceName: invite.workspace.name,
      accepted: Boolean(invite.acceptedAt),
      expired: invite.expiresAt < new Date(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const userId = await requireUserId();

    const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
    if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "This invite was already used." }, { status: 409 });
    }
    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    await prisma.$transaction([
      prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
        create: { workspaceId: invite.workspaceId, userId, role: invite.role },
        update: {},
      }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ workspaceId: invite.workspaceId });
  } catch (error) {
    return handleApiError(error);
  }
}
