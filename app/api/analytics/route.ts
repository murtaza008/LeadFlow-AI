import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { RANGES, computeAnalytics, type RangeDays } from "@/lib/analytics-calc";

/**
 * Pipeline analytics for the caller's workspace. `?days=30|90|365` sets the
 * comparison window (default 30); anything else is a 400.
 */
export async function GET(request: Request) {
  try {
    const param = new URL(request.url).searchParams.get("days");
    const days = param === null ? 30 : Number(param);
    if (!RANGES.includes(days as RangeDays)) {
      return NextResponse.json({ error: `days must be one of ${RANGES.join(", ")}` }, { status: 400 });
    }

    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const [leads, closes] = await Promise.all([
      prisma.lead.findMany({
        where: { workspaceId: workspace.id },
        select: {
          id: true,
          name: true,
          company: true,
          status: true,
          value: true,
          score: true,
          source: true,
          createdAt: true,
          updatedAt: true,
          assignedTo: { select: { id: true, displayName: true, email: true } },
        },
      }),
      // When each deal was won or lost, from the timeline (more exact than "last edited").
      prisma.activity.findMany({
        where: {
          workspaceId: workspace.id,
          type: "STATUS_CHANGE",
          OR: [{ body: { endsWith: "to WON." } }, { body: { endsWith: "to LOST." } }],
        },
        orderBy: { createdAt: "asc" },
        select: { leadId: true, createdAt: true },
      }),
    ]);

    const closedAt = new Map<string, Date>();
    for (const c of closes) closedAt.set(c.leadId, c.createdAt); // ascending, so the latest wins

    const rows = leads.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      status: l.status,
      value: Number(l.value),
      score: l.score,
      source: l.source,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      closedAt: closedAt.get(l.id) ?? null,
      owner: l.assignedTo
        ? { id: l.assignedTo.id, name: l.assignedTo.displayName?.trim() || l.assignedTo.email.split("@")[0] }
        : null,
    }));

    return NextResponse.json(computeAnalytics(rows, new Date(), days));
  } catch (error) {
    return handleApiError(error);
  }
}
