import { prisma } from "@/lib/prisma";

/**
 * Live counts behind the navigation hover cards and the command palette.
 * Every query is scoped to one workspace; callers check membership first.
 */
export type WorkspaceSummary = {
  leads: {
    total: number;
    open: number;
    hotOpen: number;
    openValue: number;
    newThisWeek: number;
    byStage: Record<"NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST", number>;
  };
  followUps: { overdue: number; dueToday: number; upcoming: number };
  members: number;
  pendingInvites: number;
};

const DAY = 24 * 60 * 60 * 1000;

export async function getWorkspaceSummary(workspaceId: string, now: Date = new Date()): Promise<WorkspaceSummary> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + DAY);

  const [groups, newThisWeek, overdue, dueToday, upcoming, members, pendingInvites] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status", "priority"],
      where: { workspaceId },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.lead.count({ where: { workspaceId, createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    prisma.followUp.count({ where: { workspaceId, done: false, dueAt: { lt: now } } }),
    prisma.followUp.count({ where: { workspaceId, done: false, dueAt: { gte: now, lt: endOfToday } } }),
    prisma.followUp.count({ where: { workspaceId, done: false, dueAt: { gte: endOfToday } } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.workspaceInvite.count({ where: { workspaceId, acceptedAt: null, expiresAt: { gt: now } } }),
  ]);

  const byStage = { NEW: 0, CONTACTED: 0, QUALIFIED: 0, WON: 0, LOST: 0 };
  let total = 0;
  let open = 0;
  let hotOpen = 0;
  let openValue = 0;
  for (const g of groups) {
    const count = g._count._all;
    total += count;
    byStage[g.status] += count;
    if (g.status !== "WON" && g.status !== "LOST") {
      open += count;
      openValue += Number(g._sum.value ?? 0);
      if (g.priority === "HOT") hotOpen += count;
    }
  }

  return {
    leads: { total, open, hotOpen, openValue: Math.round(openValue), newThisWeek, byStage },
    followUps: { overdue, dueToday, upcoming },
    members,
    pendingInvites,
  };
}
