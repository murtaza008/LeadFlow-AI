import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    return NextResponse.json(workspace);
  } catch (error) {
    return handleApiError(error);
  }
}
