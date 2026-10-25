
-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "focusAt" TIMESTAMP(3),
ADD COLUMN     "focusPicks" JSONB;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "aiInsight" TEXT,
ADD COLUMN     "aiNextAction" TEXT,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "insightAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DemoUsage" (
    "window" TEXT NOT NULL,
    "aiCalls" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DemoUsage_pkey" PRIMARY KEY ("window")
);

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

