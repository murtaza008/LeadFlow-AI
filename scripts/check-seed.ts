/** Quick read-only check of what the seed script created. */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const EMAIL = (process.argv[2] ?? process.env.SEED_USER_EMAIL ?? "").toLowerCase();
if (!EMAIL) {
  console.error("Usage: npx tsx scripts/check-seed.ts you@example.com");
  process.exit(1);
}

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const member = await prisma.workspaceMember.findFirst({
    where: { user: { email: EMAIL } },
    include: { workspace: true },
  });
  if (!member) throw new Error(`No workspace for ${EMAIL}`);

  const wsId = member.workspace.id;
  const leads = await prisma.lead.findMany({
    where: { workspaceId: wsId },
    orderBy: { score: "desc" },
    include: { _count: { select: { activities: true, followUps: true } } },
  });

  console.log(`\nWorkspace: ${member.workspace.name}\n`);
  console.log("SCORE  PRIORITY  STATUS      VALUE      ACTS  F/UPS  NAME");
  for (const l of leads) {
    console.log(
      `${String(l.score).padStart(5)}  ${l.priority.padEnd(8)}  ${l.status.padEnd(10)}  ` +
        `$${Number(l.value).toLocaleString().padEnd(8)}  ${String(l._count.activities).padStart(4)}  ` +
        `${String(l._count.followUps).padStart(5)}  ${l.name}`,
    );
  }

  const total = leads.reduce((sum, l) => sum + Number(l.value), 0);
  console.log(`\n${leads.length} leads · pipeline value $${total.toLocaleString()}\n`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
