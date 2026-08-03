import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceRole } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const UpdateWorkspaceInput = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceRole(userId, id, ["OWNER", "ADMIN"]);
    const body = await request.json().catch(() => null);
    const data = UpdateWorkspaceInput.parse(body);
    const workspace = await prisma.workspace.update({ where: { id }, data });
    return NextResponse.json(workspace);
  } catch (error) {
    return handleApiError(error);
  }
}
