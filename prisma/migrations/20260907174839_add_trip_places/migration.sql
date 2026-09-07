-- CreateTable
CREATE TABLE "TripPlace" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripPlace_stopId_idx" ON "TripPlace"("stopId");

-- AddForeignKey
ALTER TABLE "TripPlace" ADD CONSTRAINT "TripPlace_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
