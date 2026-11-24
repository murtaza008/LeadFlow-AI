import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { getWorkspaceSummary } from "@/lib/workspace-summary";

/** Live counts for the navigation hover cards. Any member may read them. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceMember(userId, workspaceId);
    return NextResponse.json(await getWorkspaceSummary(workspaceId));
  } catch (error) {
    return handleApiError(error);
  }
}
