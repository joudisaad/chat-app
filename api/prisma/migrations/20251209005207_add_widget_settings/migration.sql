-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "launcherColor" TEXT NOT NULL DEFAULT '#22c55e',
    "launcherTextColor" TEXT NOT NULL DEFAULT '#020617',
    "launcherPosition" TEXT NOT NULL DEFAULT 'right',
    "launcherLabel" TEXT NOT NULL DEFAULT 'Chat',

    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WidgetSettings_teamId_key" ON "WidgetSettings"("teamId");

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
