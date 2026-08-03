import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const AddActivityInput = z.object({
  body: z.string().trim().min(1).max(2000),
  type: z.enum(["NOTE", "EMAIL", "CALL"]).default("NOTE"),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const lead = await prisma.lead.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!lead) throw new ForbiddenError("Lead not found in this workspace.");

    const input = AddActivityInput.parse(await request.json().catch(() => null));
    const activity = await prisma.activity.create({
      data: {
        leadId: id,
        workspaceId: workspace.id,
        type: input.type,
        body: input.body,
        createdById: userId,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
