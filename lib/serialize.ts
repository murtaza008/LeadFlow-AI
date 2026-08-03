import type { Lead } from "@/lib/generated/prisma/client";

/** Prisma returns `value` as a Decimal; flatten it to a plain number for the client. */
export function serializeLead(lead: Lead) {
  return { ...lead, value: Number(lead.value) };
}
