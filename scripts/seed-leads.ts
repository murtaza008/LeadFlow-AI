/**
 * Seeds a demo pipeline into an existing user's workspace.
 *
 *   npx tsx scripts/seed-leads.ts you@example.com --dry   # show what it would do, write nothing
 *   npx tsx scripts/seed-leads.ts you@example.com         # actually insert
 *
 * Safe to re-run: leads are matched by name inside the workspace, so an
 * existing lead is skipped rather than duplicated.
 *
 * The scores, summaries and reasons below are hand-written demo values, not
 * real Gemini output — they exist so the board looks like a pipeline that has
 * been in use. Score a lead from inside the app to see the real AI run.
 */
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const DRY_RUN = process.argv.includes("--dry");
const EMAIL = (
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  process.env.SEED_USER_EMAIL ??
  ""
).toLowerCase();
if (!EMAIL) {
  console.error("Usage: npx tsx scripts/seed-leads.ts you@example.com [--dry]  (or set SEED_USER_EMAIL)");
  process.exit(1);
}

type SeedLead = {
  name: string;
  company: string;
  title: string;
  email: string;
  source: string;
  value: number;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
  score: number;
  priority: "HOT" | "WARM" | "COLD";
  notes: string;
  aiSummary: string;
  aiReasons: string[];
  /** Days ago the lead entered the pipeline — staggers the board so it looks lived-in. */
  daysAgo: number;
  followUp?: { title: string; type: "EMAIL" | "CALL" | "TASK"; inDays: number };
};

const LEADS: SeedLead[] = [
  {
    name: "Sarah Chen",
    company: "Vertex Logistics",
    title: "VP of Operations",
    email: "sarah.chen@vertexlog.com",
    source: "Inbound demo request",
    value: 45000,
    status: "QUALIFIED",
    score: 84,
    priority: "HOT",
    notes:
      "Runs a 40-truck fleet, wants route optimisation before Q4. Budget approved.",
    aiSummary:
      "Operations decision maker with approved budget and a hard Q4 deadline — ready to move now.",
    aiReasons: [
      "Budget already approved, no procurement blocker",
      "Clear deadline before Q4 creates urgency",
      "Decision-maker seniority (VP of Operations)",
      "Fleet size of 40 trucks fits the target account profile",
    ],
    daysAgo: 12,
    followUp: { title: "Send Q4 rollout timeline", type: "EMAIL", inDays: 2 },
  },
  {
    name: "Daniel Okafor",
    company: "BrightPath Retail",
    title: "Head of Sales Ops",
    email: "d.okafor@brightpath.io",
    source: "Website form",
    value: 28000,
    status: "CONTACTED",
    score: 61,
    priority: "WARM",
    notes: "Asked for pricing twice. Evaluating two other vendors.",
    aiSummary:
      "Actively comparing vendors and price-sensitive — winnable, but needs differentiation fast.",
    aiReasons: [
      "Requested pricing twice, indicating real intent",
      "Two competing vendors in the evaluation",
      "No stated timeline or budget yet",
    ],
    daysAgo: 8,
    followUp: { title: "Share competitor comparison sheet", type: "EMAIL", inDays: 1 },
  },
  {
    name: "Maria Alvarez",
    company: "Coastal Freight Co",
    title: "Director of Logistics",
    email: "maria@coastalfreight.com",
    // NOTE: the schema has no PROPOSAL stage (NEW / CONTACTED / QUALIFIED / WON / LOST),
    // so the "Proposal" row maps to QUALIFIED — a proposal is out with a qualified lead.
    source: "Referral",
    value: 62000,
    status: "QUALIFIED",
    score: 76,
    priority: "HOT",
    notes: "Referred by Vertex. Wants a 3-month pilot first.",
    aiSummary:
      "Warm referral with a defined pilot path — high close probability, slower ramp to full contract.",
    aiReasons: [
      "Referred by an existing customer (Vertex Logistics)",
      "Proposed a concrete 3-month pilot structure",
      "Deal size above average at $62,000",
      "Pilot-first approach delays full revenue recognition",
    ],
    daysAgo: 19,
    followUp: { title: "Draft 3-month pilot scope", type: "TASK", inDays: 3 },
  },
  {
    name: "Tom Whitfield",
    company: "Harborline Systems",
    title: "Operations Manager",
    email: "tom.w@harborline.dev",
    source: "Cold outreach",
    value: 15000,
    status: "NEW",
    score: 35,
    priority: "COLD",
    notes: "Replied to first email, asked what makes us different.",
    aiSummary:
      "Early-stage curiosity from cold outreach — no budget, timeline or authority confirmed yet.",
    aiReasons: [
      "Only a single reply to cold outreach so far",
      "No budget or timeline discussed",
      "Smallest deal size in the pipeline",
    ],
    daysAgo: 3,
  },
  {
    name: "Priya Raman",
    company: "Solstice Manufacturing",
    title: "Chief Operating Officer",
    email: "p.raman@solsticemfg.com",
    source: "Trade show",
    value: 88000,
    status: "QUALIFIED",
    score: 88,
    priority: "HOT",
    notes: "Met at LogiTech Expo. Decision by end of quarter.",
    aiSummary:
      "Largest open deal, C-level sponsor, and a quarter-end decision date — top priority this week.",
    aiReasons: [
      "C-level sponsor (COO) drives the decision directly",
      "Firm decision date at end of quarter",
      "Highest deal value in the pipeline at $88,000",
      "In-person trade show meeting signals genuine interest",
    ],
    daysAgo: 15,
    followUp: { title: "Book exec walkthrough call", type: "CALL", inDays: 1 },
  },
  {
    name: "Kevin Brooks",
    company: "Ridgeway Distribution",
    title: "Procurement Lead",
    email: "kbrooks@ridgeway.net",
    source: "LinkedIn",
    value: 34000,
    status: "CONTACTED",
    score: 42,
    priority: "COLD",
    notes: "Interested but budget locked until January.",
    aiSummary:
      "Genuine interest blocked by a frozen budget until January — nurture, do not push to close.",
    aiReasons: [
      "Budget explicitly locked until January",
      "Interest confirmed but no near-term path to purchase",
      "Procurement role, typically not the final decision maker",
    ],
    daysAgo: 26,
    followUp: { title: "Re-engage when budget unlocks", type: "TASK", inDays: 21 },
  },
  {
    name: "Anna Kowalski",
    company: "Meridian Cold Chain",
    title: "VP Supply Chain",
    email: "anna.k@meridiancc.com",
    source: "Inbound demo request",
    value: 51000,
    status: "WON",
    score: 91,
    priority: "HOT",
    notes: "Signed annual contract, onboarding next week.",
    aiSummary:
      "Closed won on an annual contract — hand off to onboarding and watch for expansion signals.",
    aiReasons: [
      "Annual contract signed",
      "Onboarding already scheduled",
      "Strong fit for expansion into additional sites",
    ],
    daysAgo: 34,
    followUp: { title: "Kick off onboarding session", type: "CALL", inDays: 4 },
  },
];

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check your .env file.");
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) {
      console.error(`\n✗ No user found with email "${EMAIL}" in this database.`);
      console.error(
        "  The DATABASE_URL in .env may point to a different database than the one\n" +
          "  your deployed app uses. Run again with that connection string, e.g.\n" +
          '  DATABASE_URL="postgresql://…" npx tsx scripts/seed-leads.ts\n',
      );
      process.exitCode = 1;
      return;
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) {
      console.error(
        `\n✗ ${EMAIL} exists but has no workspace yet.\n` +
          "  Log into the app and finish onboarding first, then re-run this script.\n",
      );
      process.exitCode = 1;
      return;
    }

    const workspace = membership.workspace;
    console.log(`\nUser:      ${user.email} (${user.displayName ?? "no name"})`);
    console.log(`Workspace: ${workspace.name} [${workspace.id}]`);
    console.log(`Mode:      ${DRY_RUN ? "DRY RUN — nothing will be written" : "WRITE"}\n`);

    let created = 0;
    let skipped = 0;

    for (const lead of LEADS) {
      const existing = await prisma.lead.findFirst({
        where: { workspaceId: workspace.id, name: lead.name },
        select: { id: true },
      });

      if (existing) {
        console.log(`  – ${lead.name.padEnd(16)} already exists, skipped`);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `  + ${lead.name.padEnd(16)} ${lead.status.padEnd(10)} ${lead.score
            .toString()
            .padStart(3)}  $${lead.value.toLocaleString()}`,
        );
        created++;
        continue;
      }

      const createdAt = new Date(Date.now() - lead.daysAgo * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        const row = await tx.lead.create({
          data: {
            workspaceId: workspace.id,
            createdById: user.id,
            name: lead.name,
            company: lead.company,
            title: lead.title,
            email: lead.email,
            source: lead.source,
            value: lead.value,
            status: lead.status,
            score: lead.score,
            priority: lead.priority,
            notes: lead.notes,
            aiSummary: lead.aiSummary,
            aiReasons: lead.aiReasons,
            scoredAt: createdAt,
            createdAt,
          },
        });

        await tx.activity.createMany({
          data: [
            {
              leadId: row.id,
              workspaceId: workspace.id,
              createdById: user.id,
              type: "NOTE",
              body: lead.notes,
              createdAt,
            },
            {
              leadId: row.id,
              workspaceId: workspace.id,
              createdById: user.id,
              type: "AI_SCORE",
              body: `Scored ${lead.score}/100 · ${lead.priority} — ${lead.aiSummary}`,
              createdAt,
            },
          ],
        });

        if (lead.followUp) {
          await tx.followUp.create({
            data: {
              leadId: row.id,
              workspaceId: workspace.id,
              createdById: user.id,
              title: lead.followUp.title,
              type: lead.followUp.type,
              dueAt: daysFromNow(lead.followUp.inDays),
              done: lead.status === "WON",
            },
          });
        }
      });

      console.log(
        `  + ${lead.name.padEnd(16)} ${lead.status.padEnd(10)} ${lead.score
          .toString()
          .padStart(3)}  $${lead.value.toLocaleString()}`,
      );
      created++;
    }

    console.log(
      `\n${DRY_RUN ? "Would add" : "Added"} ${created} lead${created === 1 ? "" : "s"}` +
        (skipped ? `, skipped ${skipped} that already existed.` : ".") +
        "\n",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error, "\n");
  process.exit(1);
});
