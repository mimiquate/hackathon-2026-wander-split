-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reservedById" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingUser" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,

    CONSTRAINT "BookingUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherFile" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_stopId_idx" ON "Booking"("stopId");

-- CreateIndex
CREATE INDEX "BookingUser_membershipId_idx" ON "BookingUser"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingUser_bookingId_membershipId_key" ON "BookingUser"("bookingId", "membershipId");

-- CreateIndex
CREATE INDEX "VoucherFile_bookingId_idx" ON "VoucherFile"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_reservedById_fkey" FOREIGN KEY ("reservedById") REFERENCES "TripMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "TripMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingUser" ADD CONSTRAINT "BookingUser_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingUser" ADD CONSTRAINT "BookingUser_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "TripMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherFile" ADD CONSTRAINT "VoucherFile_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
