import type { Lead } from "@/lib/generated/prisma/client";

/** Prisma returns `value` as a Decimal; flatten it to a plain number for the client. */
export function serializeLead<T extends Lead>(lead: T) {
  return { ...lead, value: Number(lead.value) };
}
