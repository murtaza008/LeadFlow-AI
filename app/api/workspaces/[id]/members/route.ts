import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceMember(userId, workspaceId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { displayName: true, email: true, avatarUrl: true } } },
    });
    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}
