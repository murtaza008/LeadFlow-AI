import { NextResponse } from "next/server";
import { z } from "zod";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { createWorkspaceWithMembership } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

const CreateWorkspaceInput = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    forbidInDemo(user, "Creating a workspace");
    const userId = user.id;
    const body = await request.json().catch(() => null);
    const { name } = CreateWorkspaceInput.parse(body);
    const workspace = await createWorkspaceWithMembership(userId, name);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
