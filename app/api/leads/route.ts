import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { onLeadCreated } from "@/lib/automations";
import { serializeLead } from "@/lib/serialize";

const CreateLeadInput = z.object({
  name: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).optional(),
  title: z.string().trim().max(120).optional(),
  email: z.email().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  source: z.string().trim().max(60).optional(),
  value: z.number().min(0).max(100_000_000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const leads = await prisma.lead.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { score: "desc" },
    });
    return NextResponse.json(leads.map(serializeLead));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const input = CreateLeadInput.parse(await request.json().catch(() => null));
    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        name: input.name,
        company: input.company || null,
        title: input.title || null,
        email: input.email || null,
        phone: input.phone || null,
        source: input.source || null,
        value: input.value ?? 0,
        notes: input.notes || null,
        createdById: userId,
      },
    });

    await onLeadCreated(lead.id, workspace.id, userId);

    return NextResponse.json(serializeLead(lead), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
