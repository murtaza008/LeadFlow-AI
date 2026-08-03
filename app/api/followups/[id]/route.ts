import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const UpdateFollowUpInput = z.object({ done: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const existing = await prisma.followUp.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!existing) throw new ForbiddenError("Follow-up not found in this workspace.");

    const { done } = UpdateFollowUpInput.parse(await request.json().catch(() => null));
    const followUp = await prisma.followUp.update({ where: { id }, data: { done } });
    return NextResponse.json(followUp);
  } catch (error) {
    return handleApiError(error);
  }
}
