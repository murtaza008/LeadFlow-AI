import { prisma } from "@/lib/prisma";
import { DEMO_AI_CALLS_PER_HOUR, DemoLimitError } from "@/lib/demo";

function utcHourKey(date = new Date()) {
  return date.toISOString().slice(0, 13);
}

/**
 * Claims one of this hour's shared demo AI calls, or throws DemoLimitError.
 * A single conditional upsert, so visitors scoring at the same moment can't
 * both slip past the cap. Claimed before the Gemini call, so failed calls
 * count too.
 */
export async function claimDemoAiCall(): Promise<void> {
  const rows = await prisma.$queryRaw<{ aiCalls: number }[]>`
    INSERT INTO "DemoUsage" ("window", "aiCalls") VALUES (${utcHourKey()}, 1)
    ON CONFLICT ("window") DO UPDATE SET "aiCalls" = "DemoUsage"."aiCalls" + 1
    WHERE "DemoUsage"."aiCalls" < ${DEMO_AI_CALLS_PER_HOUR}
    RETURNING "aiCalls"`;
  if (rows.length === 0) throw new DemoLimitError();
}
