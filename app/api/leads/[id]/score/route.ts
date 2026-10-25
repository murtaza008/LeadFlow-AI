import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { claimDemoAiCall } from "@/lib/demo-limits";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { scoreLead, AiNotConfiguredError } from "@/lib/gemini";
import { serializeLead } from "@/lib/serialize";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    const userId = user.id;
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const lead = await prisma.lead.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!lead) throw new ForbiddenError("Lead not found in this workspace.");
    if (user.isDemo) await claimDemoAiCall();

    const result = await scoreLead({
      name: lead.name,
      company: lead.company,
      title: lead.title,
      email: lead.email,
      source: lead.source,
      value: Number(lead.value),
      status: lead.status,
      notes: lead.notes,
    });

    const [updated] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          score: result.score,
          priority: result.priority,
          aiSummary: result.summary,
          aiReasons: result.reasons,
          scoredAt: new Date(),
        },
        include: { assignedTo: { select: { id: true, displayName: true, email: true } } },
      }),
      prisma.activity.create({
        data: {
          leadId: id,
          workspaceId: workspace.id,
          type: "AI_SCORE",
          body: `AI scored this lead ${result.score}/100 (${result.priority}): ${result.summary}`,
          createdById: userId,
        },
      }),
    ]);

    return NextResponse.json(serializeLead(updated));
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return handleApiError(error);
  }
}
