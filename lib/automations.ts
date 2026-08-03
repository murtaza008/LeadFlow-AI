import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { LeadStatus } from "@/lib/generated/prisma/enums";

/**
 * Rule-based follow-up automation. Runs synchronously right after the lead
 * mutation that triggered it — no queue/cron needed, which keeps the stack
 * entirely free to run. Each rule also drops an Activity row so the change
 * shows up on the customer-profile timeline.
 */

export async function onLeadCreated(leadId: string, workspaceId: string, userId: string) {
  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.followUp.create({
      data: {
        leadId,
        workspaceId,
        title: "Reach out within 24h",
        type: "EMAIL",
        dueAt,
        createdById: userId,
      },
    }),
    prisma.activity.create({
      data: {
        leadId,
        workspaceId,
        type: "NOTE",
        body: "Lead created. Follow-up scheduled for tomorrow.",
        createdById: userId,
      },
    }),
  ]);
}

export async function onLeadStatusChanged(
  leadId: string,
  workspaceId: string,
  userId: string,
  from: LeadStatus,
  to: LeadStatus,
) {
  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.activity.create({
      data: {
        leadId,
        workspaceId,
        type: "STATUS_CHANGE",
        body: `Stage changed from ${from} to ${to}.`,
        createdById: userId,
      },
    }),
  ];

  if (to === "QUALIFIED") {
    ops.push(
      prisma.followUp.create({
        data: {
          leadId,
          workspaceId,
          title: "Send proposal",
          type: "TASK",
          dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          createdById: userId,
        },
      }),
    );
  }

  await prisma.$transaction(ops);
}
