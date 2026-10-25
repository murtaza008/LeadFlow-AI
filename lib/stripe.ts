import Stripe from "stripe";
import type { WorkspacePlan } from "@/lib/generated/prisma/enums";
import { PLAN_DETAILS } from "@/lib/plans";

export { PLAN_DETAILS };

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;

/** Throws if Stripe isn't configured — callers should check `isStripeConfigured()` first. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is unset).");
  }
  // This is a portfolio deployment: never charge real cards.
  if (!/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY)) {
    throw new Error("Refusing to use a live Stripe key. Use a test-mode key (sk_test_...).");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

export const PLAN_PRICE_ENV: Record<Exclude<WorkspacePlan, "FREE">, string | undefined> = {
  TEAM: process.env.STRIPE_PRICE_TEAM,
  AGENCY: process.env.STRIPE_PRICE_AGENCY,
};
