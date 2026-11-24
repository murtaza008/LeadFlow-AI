import { prisma } from "@/lib/prisma";
import { statusLabel, type Status } from "@/lib/format";

/**
 * The notifications feed: real events from the workspace, newest first.
 * Built from teammates' activity on leads (stage changes, AI scores, logged
 * calls and emails), follow-ups that have gone overdue, and people joining.
 * The viewer's own actions are left out; they already know about those.
 */
export type ActivityEventType =
  | "lead.stage"
  | "lead.won"
  | "lead.scored"
  | "lead.logged"
  | "followup.overdue"
  | "member.joined";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  title: string;
  detail: string | null;
  href: string;
  at: string;
};

export const ACTIVITY_LIMIT = 25;
export const ACTIVITY_WINDOW_DAYS = 14;

type Person = { displayName: string | null; email: string } | null;

export type ActivitySources = {
  activities: {
    id: string;
    type: "NOTE" | "STATUS_CHANGE" | "AI_SCORE" | "EMAIL" | "CALL";
    body: string;
    createdAt: Date;
    createdById: string | null;
    createdBy: Person;
    lead: { id: string; name: string };
  }[];
  overdue: { id: string; title: string; dueAt: Date; lead: { id: string; name: string } }[];
  members: { id: string; userId: string; role: "OWNER" | "ADMIN" | "MEMBER"; createdAt: Date; user: NonNullable<Person> }[];
};

function who(p: Person): string {
  if (!p) return "Someone";
  return p.displayName?.trim() || p.email.split("@")[0];
}

/** "Stage changed from QUALIFIED to WON." → "Qualified → Won" */
function stageChange(body: string): { to: string | null; text: string } {
  const m = body.match(/from (\w+) to (\w+)/i);
  if (!m) return { to: null, text: firstLine(body) };
  const label = (s: string) => statusLabel[s.toUpperCase() as Status] ?? s;
  return { to: m[2].toUpperCase(), text: `${label(m[1])} → ${label(m[2])}` };
}

function firstLine(text: string, max = 90): string {
  const line = text.split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

/** Pure: turns the raw rows into feed events. Exported for tests. */
export function buildActivity(src: ActivitySources, viewerId: string): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const a of src.activities) {
    if (a.createdById === viewerId) continue;
    const href = `/leads/${a.lead.id}`;
    const at = a.createdAt.toISOString();
    const name = who(a.createdBy);
    if (a.type === "STATUS_CHANGE") {
      const change = stageChange(a.body);
      const won = change.to === "WON";
      events.push({
        id: `act-${a.id}`,
        type: won ? "lead.won" : "lead.stage",
        title: won ? `${a.lead.name} was won` : `${a.lead.name} moved stage`,
        detail: `${name} · ${change.text}`,
        href,
        at,
      });
    } else if (a.type === "AI_SCORE") {
      const score = a.body.match(/(\d{1,3})\/100/)?.[1];
      events.push({
        id: `act-${a.id}`,
        type: "lead.scored",
        title: score ? `${a.lead.name} scored ${score}` : `${a.lead.name} was scored`,
        detail: firstLine(a.body.replace(/^AI scored this lead \d+\/100 \(\w+\):\s*/, "")),
        href,
        at,
      });
    } else if (a.type === "CALL" || a.type === "EMAIL") {
      events.push({
        id: `act-${a.id}`,
        type: "lead.logged",
        title: `${name} logged ${a.type === "CALL" ? "a call" : "an email"} with ${a.lead.name}`,
        detail: firstLine(a.body),
        href,
        at,
      });
    }
  }

  for (const f of src.overdue) {
    events.push({
      id: `fu-${f.id}`,
      type: "followup.overdue",
      title: `Overdue: ${firstLine(f.title, 70)}`,
      detail: f.lead.name,
      href: `/leads/${f.lead.id}`,
      at: f.dueAt.toISOString(),
    });
  }

  for (const m of src.members) {
    if (m.userId === viewerId) continue;
    events.push({
      id: `member-${m.id}`,
      type: "member.joined",
      title: `${who(m.user)} joined`,
      detail: `Added as ${m.role.toLowerCase()}`,
      href: "/team",
      at: m.createdAt.toISOString(),
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, ACTIVITY_LIMIT);
}

export async function getActivity(workspaceId: string, viewerId: string, now: Date = new Date()) {
  const since = new Date(now.getTime() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const person = { select: { displayName: true, email: true } } as const;
  const [activities, overdue, members] = await Promise.all([
    prisma.activity.findMany({
      where: {
        workspaceId,
        createdAt: { gte: since, lte: now },
        type: { in: ["STATUS_CHANGE", "AI_SCORE", "CALL", "EMAIL"] },
        OR: [{ createdById: null }, { createdById: { not: viewerId } }],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        type: true,
        body: true,
        createdAt: true,
        createdById: true,
        createdBy: person,
        lead: { select: { id: true, name: true } },
      },
    }),
    prisma.followUp.findMany({
      where: { workspaceId, done: false, dueAt: { gte: since, lt: now } },
      orderBy: { dueAt: "desc" },
      take: 15,
      select: { id: true, title: true, dueAt: true, lead: { select: { id: true, name: true } } },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, userId: true, role: true, createdAt: true, user: person },
    }),
  ]);
  return buildActivity({ activities, overdue, members }, viewerId);
}
