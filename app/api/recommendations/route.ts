import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { recommendDailyFocus, AiNotConfiguredError } from "@/lib/gemini";

/** Picks are reused for this long before Gemini is asked again. */
const FOCUS_TTL_MS = 6 * 60 * 60 * 1000;

type Pick = { leadId: string; reason: string };

function storedPicks(value: unknown): Pick[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (p): p is Pick => typeof p?.leadId === "string" && typeof p?.reason === "string",
  );
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    const workspace = await getCurrentWorkspace(user.id);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const leads = await prisma.lead.findMany({
      where: { workspaceId: workspace.id, status: { notIn: ["WON", "LOST"] } },
      orderBy: { score: "desc" },
      take: 25,
    });

    if (leads.length === 0) return NextResponse.json({ picks: [] });

    // The demo always serves its stored picks so browsing it never calls Gemini.
    const cached = storedPicks(workspace.focusPicks);
    const fresh = workspace.focusAt && Date.now() - workspace.focusAt.getTime() < FOCUS_TTL_MS;
    let picks: Pick[];
    if (cached && (user.isDemo || fresh)) {
      picks = cached;
    } else {
      picks = await recommendDailyFocus(
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
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { focusPicks: picks, focusAt: new Date() },
      });
    }

    // Leads that have since closed or been deleted drop out of cached picks here.
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
