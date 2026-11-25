import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { LeadStatus } from "@/lib/generated/prisma/enums";
import { rulesForCreated, rulesForStageChange, type RuleResult } from "@/lib/automation-rules";

/**
 * Rule-based follow-up automation. Runs synchronously right after the lead
 * mutation that triggered it — no queue/cron needed, which keeps the stack
 * entirely free to run. The rules themselves live in lib/automation-rules.ts;
 * this file writes their follow-ups and timeline entries in one transaction.
 */

function writeRules(rules: RuleResult, leadId: string, workspaceId: string, userId: string) {
  const ops: Prisma.PrismaPromise<unknown>[] = [
    ...rules.followUps.map((f) =>
      prisma.followUp.create({
        data: { leadId, workspaceId, title: f.title, type: f.type, dueAt: f.dueAt, createdById: userId },
      }),
    ),
    ...rules.timeline.map((t) =>
      prisma.activity.create({
        data: { leadId, workspaceId, type: t.type, body: t.body, createdById: userId },
      }),
    ),
  ];
  return ops.length ? prisma.$transaction(ops) : Promise.resolve([]);
}

export async function onLeadCreated(leadId: string, workspaceId: string, userId: string) {
  await writeRules(rulesForCreated(), leadId, workspaceId, userId);
}

export async function onLeadStatusChanged(
  leadId: string,
  workspaceId: string,
  userId: string,
  from: LeadStatus,
  to: LeadStatus,
) {
  await writeRules(rulesForStageChange(from, to), leadId, workspaceId, userId);
}
