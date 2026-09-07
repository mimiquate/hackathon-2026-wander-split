-- CreateTable
CREATE TABLE "TripNote" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripNote_stopId_idx" ON "TripNote"("stopId");

-- CreateIndex
CREATE INDEX "TripNote_membershipId_idx" ON "TripNote"("membershipId");

-- AddForeignKey
ALTER TABLE "TripNote" ADD CONSTRAINT "TripNote_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripNote" ADD CONSTRAINT "TripNote_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
