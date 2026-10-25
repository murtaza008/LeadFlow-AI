import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/session";
import { getCurrentWorkspace } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const workspace = await getCurrentWorkspace(user.id);
    if (!workspace) return NextResponse.json(null);
    // Only what the client uses; Stripe ids and cached AI picks stay server-side.
    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      brandColor: workspace.brandColor,
      role: workspace.role,
      isDemo: user.isDemo,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
