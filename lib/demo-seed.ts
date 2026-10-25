import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "./generated/prisma/client";
import { DEMO_EMAIL } from "./demo";
import {
  DEMO_FOCUS_PICKS,
  DEMO_LEADS,
  DEMO_PEOPLE,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_NAME,
  DEMO_WORKSPACE_SLUG,
  type DemoLead,
  type DemoPersonKey,
} from "./demo-data";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Stage = DemoLead["status"];

function priorityFor(score: number) {
  if (score >= 70) return "HOT" as const;
  if (score >= 40) return "WARM" as const;
  return "COLD" as const;
}

/** The stages a lead passed through, in order, ending at its current stage. */
function stagePath(lead: DemoLead): Stage[] {
  switch (lead.status) {
    case "NEW":
      return ["NEW"];
    case "CONTACTED":
      return ["NEW", "CONTACTED"];
    case "QUALIFIED":
      return ["NEW", "CONTACTED", "QUALIFIED"];
    case "WON":
      return ["NEW", "CONTACTED", "QUALIFIED", "WON"];
    case "LOST":
      return lead.lostFrom === "CONTACTED"
        ? ["NEW", "CONTACTED", "LOST"]
        : ["NEW", "CONTACTED", "QUALIFIED", "LOST"];
  }
}

/** Throws unless every existing demo row really belongs to the demo, so a reset can never touch a real account. */
async function assertDemoRowsAreOurs(prisma: PrismaClient) {
  const emails = Object.values(DEMO_PEOPLE).map((p) => p.email);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    include: { memberships: { select: { workspaceId: true } } },
  });
  for (const user of users) {
    if (user.memberships.some((m) => m.workspaceId !== DEMO_WORKSPACE_ID)) {
      throw new Error(`Refusing to reset: ${user.email} belongs to a non-demo workspace.`);
    }
  }
  const owner = users.find((u) => u.email === DEMO_EMAIL);
  const workspaces = await prisma.workspace.findMany({
    where: { OR: [{ id: DEMO_WORKSPACE_ID }, { slug: DEMO_WORKSPACE_SLUG }] },
    select: { id: true, createdById: true },
  });
  for (const ws of workspaces) {
    if (ws.id !== DEMO_WORKSPACE_ID || (owner && ws.createdById !== owner.id)) {
      throw new Error("Refusing to reset: the demo workspace id or slug is used by another account.");
    }
  }
}

/**
 * Wipes and rebuilds the public demo workspace. Only demo rows are written:
 * the three demo users, the demo workspace (its leads, activities, follow-ups,
 * invites and members) and the demo AI-usage counter. Real users and their
 * workspaces are never read or written beyond the safety check above.
 */
export async function resetDemoData(prisma: PrismaClient, options: { password: string; now?: Date }) {
  const { password } = options;
  if (!password || password.length < 16) {
    throw new Error("DEMO_PASSWORD must be set to a random value of at least 16 characters.");
  }
  const now = (options.now ?? new Date()).getTime();
  await assertDemoRowsAreOurs(prisma);

  const ownerHash = await bcrypt.hash(password, 12);
  // Teammates exist to own leads and activity, not to sign in.
  const teammateHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  return prisma.$transaction(
    async (tx) => {
      const userIds = {} as Record<DemoPersonKey, string>;
      for (const [key, person] of Object.entries(DEMO_PEOPLE) as [DemoPersonKey, (typeof DEMO_PEOPLE)[DemoPersonKey]][]) {
        const passwordHash = person.email === DEMO_EMAIL ? ownerHash : teammateHash;
        const user = await tx.user.upsert({
          where: { email: person.email },
          update: { passwordHash, displayName: person.name, avatarUrl: null },
          create: { email: person.email, passwordHash, displayName: person.name },
        });
        userIds[key] = user.id;
      }

      const workspace = {
        name: DEMO_WORKSPACE_NAME,
        slug: DEMO_WORKSPACE_SLUG,
        plan: "AGENCY" as const,
        brandColor: "#00c27c",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdById: userIds.alex,
        focusPicks: DEMO_FOCUS_PICKS,
        focusAt: new Date(now),
      };
      await tx.workspace.upsert({
        where: { id: DEMO_WORKSPACE_ID },
        update: workspace,
        create: { id: DEMO_WORKSPACE_ID, ...workspace },
      });

      const where = { workspaceId: DEMO_WORKSPACE_ID };
      await tx.lead.deleteMany({ where });
      await tx.activity.deleteMany({ where });
      await tx.followUp.deleteMany({ where });
      await tx.workspaceInvite.deleteMany({ where });
      await tx.workspaceMember.deleteMany({ where });
      await tx.demoUsage.deleteMany({});

      await tx.workspaceMember.createMany({
        data: (Object.keys(DEMO_PEOPLE) as DemoPersonKey[]).map((key, i) => ({
          workspaceId: DEMO_WORKSPACE_ID,
          userId: userIds[key],
          role: DEMO_PEOPLE[key].role,
          createdAt: new Date(now - (120 - i * 10) * DAY),
        })),
      });

      const leads = [];
      const activities = [];
      const followUps = [];

      for (const [index, lead] of DEMO_LEADS.entries()) {
        const by = userIds[lead.owner];
        // Stagger creation times through the day so the timeline doesn't look generated.
        const start = now - lead.daysAgo * DAY - ((index * 5) % 9) * HOUR;
        const end = lead.closedDaysAgo != null ? now - lead.closedDaysAgo * DAY : now - 6 * HOUR;
        const at = (f: number) => new Date(start + f * (end - start));
        const base = { leadId: lead.id, workspaceId: DEMO_WORKSPACE_ID };
        const priority = priorityFor(lead.score);

        // Same entries the app writes in lib/automations.ts and the score route.
        activities.push({ ...base, type: "NOTE" as const, body: "Lead created. Follow-up scheduled for tomorrow.", createdById: by, createdAt: new Date(start) });

        const introDue = new Date(start + DAY);
        const introSent = lead.status !== "NEW" || (lead.daysAgo >= 3 && lead.id !== "demo-lead-22");
        followUps.push({ ...base, title: "Reach out within 24h", type: "EMAIL" as const, dueAt: introDue, done: introSent, createdById: by, createdAt: new Date(start), updatedAt: introSent ? new Date(start + Math.min(0.8 * DAY, 0.12 * (end - start))) : new Date(start) });
        if (introSent) {
          activities.push({
            ...base,
            type: "EMAIL" as const,
            body: `Automated follow-up sent: intro email to ${lead.name.split(" ")[0]} with relevant case studies and a link to book a call.`,
            createdById: by,
            createdAt: new Date(start + Math.min(0.8 * DAY, 0.12 * (end - start))),
          });
        }

        const path = stagePath(lead);
        const stageAt: Partial<Record<Stage, Date>> = { NEW: new Date(start) };
        const stageFractions: Partial<Record<Stage, number>> = { CONTACTED: 0.15, QUALIFIED: 0.5, WON: 1, LOST: 1 };
        for (let i = 1; i < path.length; i++) {
          const stage = path[i];
          stageAt[stage] = at(stageFractions[stage]!);
          activities.push({ ...base, type: "STATUS_CHANGE" as const, body: `Stage changed from ${path[i - 1]} to ${stage}.`, createdById: by, createdAt: stageAt[stage]! });
          if (stage === "QUALIFIED") {
            const due = new Date(stageAt.QUALIFIED!.getTime() + 2 * DAY);
            const done = due.getTime() < now;
            followUps.push({ ...base, title: "Send proposal", type: "TASK" as const, dueAt: due, done, createdById: by, createdAt: stageAt.QUALIFIED!, updatedAt: done ? due : stageAt.QUALIFIED! });
          }
        }

        const scoredAt = stageAt.QUALIFIED
          ? new Date(stageAt.QUALIFIED.getTime() + 0.02 * (end - start))
          : new Date(start + Math.min(2 * HOUR, 0.05 * (end - start)));
        activities.push({ ...base, type: "AI_SCORE" as const, body: `AI scored this lead ${lead.score}/100 (${priority}): ${lead.summary}`, createdById: by, createdAt: scoredAt });

        for (const entry of lead.log) {
          activities.push({ ...base, type: entry.type, body: entry.body, createdById: by, createdAt: at(entry.at) });
        }

        if (lead.next) {
          const dueAt = new Date(now + lead.next.inDays * DAY + 3 * HOUR);
          followUps.push({ ...base, title: lead.next.title, type: lead.next.type, dueAt, done: lead.next.done ?? false, createdById: by, createdAt: new Date(end), updatedAt: new Date(end) });
        }

        leads.push({
          id: lead.id,
          workspaceId: DEMO_WORKSPACE_ID,
          name: lead.name,
          company: lead.company,
          title: lead.title,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          value: lead.value,
          score: lead.score,
          priority,
          status: lead.status,
          aiSummary: lead.summary,
          aiReasons: lead.reasons,
          aiInsight: lead.insight,
          aiNextAction: lead.nextAction,
          insightAt: scoredAt,
          notes: lead.notes,
          scoredAt,
          createdById: by,
          assignedToId: by,
          createdAt: new Date(start),
          // Analytics buckets "won" deals by updatedAt, so it must be the close date.
          updatedAt: new Date(end),
        });
      }

      await tx.lead.createMany({ data: leads });
      await tx.activity.createMany({ data: activities });
      await tx.followUp.createMany({ data: followUps });

      return { workspaceId: DEMO_WORKSPACE_ID, leads: leads.length, activities: activities.length, followUps: followUps.length };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
}
