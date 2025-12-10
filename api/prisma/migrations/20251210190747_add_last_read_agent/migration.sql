/*
  Warnings:

  - A unique constraint covering the columns `[teamId,slug]` on the table `Etiquette` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Etiquette_slug_key";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "lastAgentReadAt" TIMESTAMP(3),
ADD COLUMN     "lastReadByAgentId" TEXT,
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Etiquette_teamId_slug_key" ON "Etiquette"("teamId", "slug");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lastReadByAgentId_fkey" FOREIGN KEY ("lastReadByAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etiquette" ADD CONSTRAINT "Etiquette_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
