/**
 * Rebuilds the public demo workspace ("Northwind Digital") and its demo
 * account. Safe to re-run: it resets only the demo workspace and never touches
 * other users.
 *
 *   npm run seed:demo
 *
 * Requires DATABASE_URL and DEMO_PASSWORD (a long random string) in .env.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { resetDemoData } from "../lib/demo-seed";
import { DEMO_EMAIL } from "../lib/demo";

neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Check your .env file.");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
  try {
    const result = await resetDemoData(prisma, { password: process.env.DEMO_PASSWORD ?? "" });
    console.log(`Demo workspace reset: ${result.leads} leads, ${result.activities} activities, ${result.followUps} follow-ups.`);
    console.log(`Sign in with "Try demo", or as ${DEMO_EMAIL} with DEMO_PASSWORD.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
