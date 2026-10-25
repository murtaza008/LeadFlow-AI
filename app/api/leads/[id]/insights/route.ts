import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { claimDemoAiCall } from "@/lib/demo-limits";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { generateCustomerInsights, AiNotConfiguredError } from "@/lib/gemini";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    const workspace = await getCurrentWorkspace(user.id);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const lead = await prisma.lead.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!lead) throw new ForbiddenError("Lead not found in this workspace.");
    if (user.isDemo) await claimDemoAiCall();

    const activities = await prisma.activity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { body: true },
    });

    const insights = await generateCustomerInsights(
      {
        name: lead.name,
        company: lead.company,
        title: lead.title,
        email: lead.email,
        source: lead.source,
        value: Number(lead.value),
        status: lead.status,
        notes: lead.notes,
      },
      activities.map((a) => a.body),
    );

    await prisma.lead.update({
      where: { id },
      data: { aiInsight: insights.insight, aiNextAction: insights.nextAction, insightAt: new Date() },
    });

    return NextResponse.json(insights);
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return handleApiError(error);
  }
}
