import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { recommendDailyFocus, AiNotConfiguredError } from "@/lib/gemini";

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const leads = await prisma.lead.findMany({
      where: { workspaceId: workspace.id, status: { notIn: ["WON", "LOST"] } },
      orderBy: { score: "desc" },
      take: 25,
    });

    if (leads.length === 0) return NextResponse.json({ picks: [] });

    const picks = await recommendDailyFocus(
      leads.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company,
        title: l.title,
        email: l.email,
        source: l.source,
        value: Number(l.value),
        status: l.status,
        notes: l.notes,
        score: l.score,
        priority: l.priority,
      })),
    );

    const byId = new Map(leads.map((l) => [l.id, l]));
    const enriched = picks
      .map((p) => {
        const lead = byId.get(p.leadId);
        if (!lead) return null;
        return {
          leadId: p.leadId,
          reason: p.reason,
          name: lead.name,
          company: lead.company,
          score: lead.score,
          priority: lead.priority,
          value: Number(lead.value),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return NextResponse.json({ picks: enriched });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return handleApiError(error);
  }
}
