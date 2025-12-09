/*
  Warnings:

  - Made the column `teamId` on table `Conversation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `teamId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_teamId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "teamId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
