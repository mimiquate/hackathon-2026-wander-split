-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripMembership" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "colorIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInvite" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInviteReservation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "claimedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripInviteReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripMembership_userId_idx" ON "TripMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripMembership_tripId_userId_key" ON "TripMembership"("tripId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvite_tripId_key" ON "TripInvite"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvite_token_key" ON "TripInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TripInviteReservation_claimedByMembershipId_key" ON "TripInviteReservation"("claimedByMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "TripInviteReservation_tripId_email_key" ON "TripInviteReservation"("tripId", "email");

-- AddForeignKey
ALTER TABLE "TripMembership" ADD CONSTRAINT "TripMembership_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMembership" ADD CONSTRAINT "TripMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInvite" ADD CONSTRAINT "TripInvite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInviteReservation" ADD CONSTRAINT "TripInviteReservation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInviteReservation" ADD CONSTRAINT "TripInviteReservation_claimedByMembershipId_fkey" FOREIGN KEY ("claimedByMembershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
