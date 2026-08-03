export type PlanKey = "FREE" | "TEAM" | "AGENCY";

/** Plan copy — safe to import from client components (no Stripe SDK). */
export const PLAN_DETAILS: Record<
  PlanKey,
  { name: string; price: number; tagline: string; features: string[] }
> = {
  FREE: {
    name: "Starter",
    price: 0,
    tagline: "For solo reps testing the water.",
    features: ["500 leads / mo", "1 team seat", "AI scoring", "Manual follow-ups"],
  },
  TEAM: {
    name: "Team",
    price: 79,
    tagline: "For growing sales teams that live in the pipeline.",
    features: [
      "10,000 leads / mo",
      "5 team seats",
      "Automated follow-ups",
      "Analytics + reports",
      "AI daily focus digest",
    ],
  },
  AGENCY: {
    name: "Agency",
    price: 199,
    tagline: "For agencies running many client pipelines.",
    features: [
      "Unlimited leads",
      "20 team seats",
      "Custom scoring weights",
      "Priority support",
      "Dedicated CSM",
    ],
  },
};
