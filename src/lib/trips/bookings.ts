/**
 * Stand-in for #12/#13's real "does this trip have a confirmed booking
 * anywhere" query — Booking doesn't exist as a Prisma model yet. Always
 * returns false today. update.ts's start-date lock already calls this by
 * signature, so nothing else needs to change once #12/#13 land a real
 * Booking model — swap this body for a real count query.
 *
 * Kept in its own module (not inlined in update.ts) so a test can
 * vi.spyOn it to exercise the lock path without a real Booking model.
 */
export async function hasAnyBooking(tripId: string): Promise<boolean> {
  void tripId;
  return false;
}
