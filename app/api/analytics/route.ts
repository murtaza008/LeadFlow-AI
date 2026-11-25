import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { computeAnalytics } from "@/lib/analytics-calc";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const leads = await prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      select: { status: true, value: true, score: true, source: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(computeAnalytics(leads.map((l) => ({ ...l, value: Number(l.value) }))));
  } catch (error) {
    return handleApiError(error);
  }
}
