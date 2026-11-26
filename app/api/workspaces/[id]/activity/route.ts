import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { getActivity } from "@/lib/activity";

/** The notifications feed: real workspace events from the last 14 days. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await context.params;
    const userId = await requireUserId();
    await requireWorkspaceMember(userId, workspaceId);
    return NextResponse.json(await getActivity(workspaceId, userId));
  } catch (error) {
    return handleApiError(error);
  }
}
