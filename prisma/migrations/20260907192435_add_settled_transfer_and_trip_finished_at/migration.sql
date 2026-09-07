-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "finishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SettledTransfer" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromMembershipId" TEXT NOT NULL,
    "toMembershipId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettledTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettledTransfer_tripId_idx" ON "SettledTransfer"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "SettledTransfer_tripId_fromMembershipId_toMembershipId_amou_key" ON "SettledTransfer"("tripId", "fromMembershipId", "toMembershipId", "amount");

-- AddForeignKey
ALTER TABLE "SettledTransfer" ADD CONSTRAINT "SettledTransfer_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettledTransfer" ADD CONSTRAINT "SettledTransfer_fromMembershipId_fkey" FOREIGN KEY ("fromMembershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettledTransfer" ADD CONSTRAINT "SettledTransfer_toMembershipId_fkey" FOREIGN KEY ("toMembershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
