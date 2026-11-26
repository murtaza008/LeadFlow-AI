export type PlanKey = "FREE" | "TEAM" | "AGENCY";

/**
 * Plan copy — safe to import from client components (no Stripe SDK).
 *
 * Only true statements: the app does not gate any feature or enforce any
 * lead/seat limit by plan, so every plan includes everything in EVERY_PLAN
 * and the per-plan line says who it suits, not what it unlocks.
 */
export const PLAN_DETAILS: Record<PlanKey, { name: string; price: number; tagline: string; features: string[] }> = {
  FREE: {
    name: "Starter",
    price: 0,
    tagline: "For one rep trying it on a real pipeline.",
    features: ["Includes every feature", "No card needed"],
  },
  TEAM: {
    name: "Team",
    price: 79,
    tagline: "For a sales team sharing one pipeline.",
    features: ["Includes every feature"],
  },
  AGENCY: {
    name: "Agency",
    price: 199,
    tagline: "For agencies working leads for clients.",
    features: ["Includes every feature"],
  },
};

/** What every plan includes today. */
export const EVERY_PLAN = [
  "AI score 0–100 with reasons for every lead",
  "AI insight and next step per lead",
  "Daily focus picks",
  "Drag-and-drop pipeline",
  "Automatic follow-ups",
  "Analytics",
  "Owner, Admin and Member roles",
];
