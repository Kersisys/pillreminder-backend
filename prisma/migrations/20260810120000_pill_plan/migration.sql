-- CreateTable
CREATE TABLE "PillPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "activePills" INTEGER NOT NULL DEFAULT 24,
    "placeboPills" INTEGER NOT NULL DEFAULT 4,
    "startDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PillPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PillPlan_userId_idx" ON "PillPlan"("userId");

-- AddForeignKey
ALTER TABLE "PillPlan" ADD CONSTRAINT "PillPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
