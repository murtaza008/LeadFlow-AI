import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser, requireUserId } from "@/lib/session";
import { getCurrentWorkspace, ForbiddenError, requireWorkspaceMember } from "@/lib/workspace";
import { handleApiError } from "@/lib/handle-error";
import { onLeadStatusChanged } from "@/lib/automations";
import { serializeLead } from "@/lib/serialize";

const UpdateLeadInput = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().max(120).nullable().optional(),
  title: z.string().trim().max(120).nullable().optional(),
  email: z.email().max(200).nullable().optional().or(z.literal("")),
  phone: z.string().trim().max(40).nullable().optional(),
  source: z.string().trim().max(60).nullable().optional(),
  value: z.number().min(0).max(100_000_000).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

const assigneeSelect = { select: { id: true, displayName: true, email: true } } as const;

async function loadLead(workspaceId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
    include: { assignedTo: assigneeSelect },
  });
  if (!lead) throw new ForbiddenError("Lead not found in this workspace.");
  return lead;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const lead = await loadLead(workspace.id, id);
    const [activities, followUps] = await Promise.all([
      prisma.activity.findMany({
        where: { leadId: id },
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { displayName: true, email: true } } },
      }),
      prisma.followUp.findMany({ where: { leadId: id }, orderBy: { dueAt: "asc" } }),
    ]);

    return NextResponse.json({ ...serializeLead(lead), activities, followUps });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const userId = await requireUserId();
    const workspace = await getCurrentWorkspace(userId);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    const existing = await loadLead(workspace.id, id);
    const input = UpdateLeadInput.parse(await request.json().catch(() => null));
    if (input.assignedToId) await requireWorkspaceMember(input.assignedToId, workspace.id);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...input,
        email: input.email === "" ? null : input.email,
      },
      include: { assignedTo: assigneeSelect },
    });

    if (input.status && input.status !== existing.status) {
      await onLeadStatusChanged(id, workspace.id, userId, existing.status, input.status);
    }

    return NextResponse.json(serializeLead(lead));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const user = await requireSessionUser();
    forbidInDemo(user, "Deleting leads");
    const workspace = await getCurrentWorkspace(user.id);
    if (!workspace) throw new ForbiddenError("No workspace yet.");

    await loadLead(workspace.id, id);
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
