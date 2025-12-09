/*
  Warnings:

  - A unique constraint covering the columns `[publicKey]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "publicKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Team_publicKey_key" ON "Team"("publicKey");
