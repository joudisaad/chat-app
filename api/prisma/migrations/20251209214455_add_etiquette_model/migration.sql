/*
  Warnings:

  - You are about to drop the column `etiquette` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "etiquette";

-- CreateTable
CREATE TABLE "ConversationEtiquette" (
    "conversationId" TEXT NOT NULL,
    "etiquetteId" TEXT NOT NULL,

    CONSTRAINT "ConversationEtiquette_pkey" PRIMARY KEY ("conversationId","etiquetteId")
);

-- CreateTable
CREATE TABLE "Etiquette" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etiquette_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Etiquette_slug_key" ON "Etiquette"("slug");

-- AddForeignKey
ALTER TABLE "ConversationEtiquette" ADD CONSTRAINT "ConversationEtiquette_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationEtiquette" ADD CONSTRAINT "ConversationEtiquette_etiquetteId_fkey" FOREIGN KEY ("etiquetteId") REFERENCES "Etiquette"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
