import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const followUps = await prisma.followUp.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { dueAt: "asc" },
      include: { lead: { select: { name: true, company: true } } },
    });
    return NextResponse.json(followUps);
  } catch (error) {
    return handleApiError(error);
  }
}
