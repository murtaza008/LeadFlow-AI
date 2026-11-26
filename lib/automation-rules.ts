/**
 * The follow-up rules, as plain data. lib/automations.ts writes what these
 * return to the database; the landing page runs the same functions in its
 * live demo. No database or server imports here.
 */

export type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
export type FollowUpKind = "EMAIL" | "CALL" | "TASK";

export type PlannedFollowUp = { title: string; type: FollowUpKind; dueAt: Date };
export type PlannedEntry = { type: "NOTE" | "STATUS_CHANGE"; body: string };
export type RuleResult = { followUps: PlannedFollowUp[]; timeline: PlannedEntry[] };

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** A new lead gets an email follow-up due in 24 hours. */
export function rulesForCreated(now: Date = new Date()): RuleResult {
  return {
    followUps: [{ title: "Reach out within 24h", type: "EMAIL", dueAt: new Date(now.getTime() + DAY_MS) }],
    timeline: [{ type: "NOTE", body: "Lead created. Follow-up scheduled for tomorrow." }],
  };
}

/** Every stage change is logged; moving into Qualified adds a proposal task due in 2 days. */
export function rulesForStageChange(from: Stage, to: Stage, now: Date = new Date()): RuleResult {
  if (from === to) return { followUps: [], timeline: [] };
  const followUps: PlannedFollowUp[] = [];
  if (to === "QUALIFIED") {
    followUps.push({ title: "Send proposal", type: "TASK", dueAt: new Date(now.getTime() + 2 * DAY_MS) });
  }
  return { followUps, timeline: [{ type: "STATUS_CHANGE", body: `Stage changed from ${from} to ${to}.` }] };
}
