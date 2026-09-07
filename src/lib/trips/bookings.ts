import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

/**
 * Whether the trip has a confirmed booking anywhere on any stop — update.ts's
 * start-date lock calls this. Real query now that #12/#13 model Booking;
 * previously a stand-in stub that always returned false.
 */
export async function hasAnyBooking(tripId: string): Promise<boolean> {
  const count = await prisma.booking.count({ where: { stop: { tripId } } });
  return count > 0;
}

/** Null if the booking doesn't exist — used by the upload-token endpoint to
 * resolve which trip a booking (and so its voucher upload) belongs to. */
export async function getBookingTripId(bookingId: string): Promise<string | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { stop: { select: { tripId: true } } },
  });
  return booking?.stop.tripId ?? null;
}

export interface BookingVoucher {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
}

export interface BookingDetail {
  id: string;
  stopId: string;
  label: string;
  reservedById: string;
  paidById: string;
  userIds: string[];
  vouchers: BookingVoucher[];
}

function toBookingDetail(booking: {
  id: string;
  stopId: string;
  label: string;
  reservedById: string;
  paidById: string;
  users: { membershipId: string }[];
  vouchers: BookingVoucher[];
}): BookingDetail {
  return {
    id: booking.id,
    stopId: booking.stopId,
    label: booking.label,
    reservedById: booking.reservedById,
    paidById: booking.paidById,
    userIds: booking.users.map((user) => user.membershipId),
    vouchers: booking.vouchers,
  };
}

/**
 * Every booking for a stop, full detail included — the Reservas tab's list
 * and its per-booking detail view read from the same array (one query, no
 * per-row round trip once a booking is clicked open).
 */
export async function getBookingsForStop(stopId: string): Promise<BookingDetail[]> {
  const bookings = await prisma.booking.findMany({
    where: { stopId },
    orderBy: { createdAt: "asc" },
    include: { users: true, vouchers: true },
  });

  return bookings.map(toBookingDetail);
}

/** Null when the booking doesn't exist or belongs to a different stop. */
export async function getBooking(stopId: string, bookingId: string): Promise<BookingDetail | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { users: true, vouchers: true },
  });

  if (!booking || booking.stopId !== stopId) return null;

  return toBookingDetail(booking);
}

interface BookingFieldErrors {
  label?: string;
  reservedById?: string;
  paidById?: string;
  userIds?: string;
}

/** Every membership id in the trip a stop belongs to — used to validate
 * reservedBy/paidBy/userIds are real crew, never a free-text/foreign id. */
async function membershipIdsForStop(stopId: string): Promise<Set<string> | null> {
  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { trip: { select: { memberships: { select: { id: true } } } } },
  });
  if (!stop) return null;
  return new Set(stop.trip.memberships.map((membership) => membership.id));
}

function validateBookingFields(
  memberIds: Set<string>,
  { reservedById, paidById, userIds }: { reservedById?: string; paidById?: string; userIds?: string[] },
): BookingFieldErrors | null {
  const fieldErrors: BookingFieldErrors = {};

  if (reservedById !== undefined && !memberIds.has(reservedById)) {
    fieldErrors.reservedById = "Elegí quién la reservó.";
  }
  if (paidById !== undefined && !memberIds.has(paidById)) {
    fieldErrors.paidById = "Elegí quién pagó.";
  }
  if (userIds !== undefined) {
    if (userIds.length === 0) {
      fieldErrors.userIds = "Elegí quién la usa.";
    } else if (userIds.some((id) => !memberIds.has(id))) {
      fieldErrors.userIds = "Uno de los seleccionados no está en el viaje.";
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export interface CreateBookingInput {
  stopId: string;
  label: string;
  reservedById: string;
  paidById: string;
  userIds: string[];
}

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; fieldErrors?: BookingFieldErrors; formError?: string };

export async function createBooking({
  stopId,
  label,
  reservedById,
  paidById,
  userIds,
}: CreateBookingInput): Promise<CreateBookingResult> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return { ok: false, fieldErrors: { label: "Ponele un nombre a la reserva." } };
  }

  const memberIds = await membershipIdsForStop(stopId);
  if (!memberIds) {
    return { ok: false, formError: "La parada no existe." };
  }

  const fieldErrors = validateBookingFields(memberIds, { reservedById, paidById, userIds });
  if (fieldErrors) {
    return { ok: false, fieldErrors };
  }

  const booking = await prisma.booking.create({
    data: {
      stopId,
      label: trimmedLabel,
      reservedById,
      paidById,
      users: { create: userIds.map((membershipId) => ({ membershipId })) },
    },
  });

  return { ok: true, bookingId: booking.id };
}

export interface UpdateBookingInput {
  stopId: string;
  bookingId: string;
  label?: string;
  reservedById?: string;
  paidById?: string;
  userIds?: string[];
}

export type UpdateBookingResult = { ok: true } | { ok: false; fieldErrors?: BookingFieldErrors; formError?: string };

/** Only the fields actually passed are changed — omit one to leave it as is. */
export async function updateBooking({
  stopId,
  bookingId,
  label,
  reservedById,
  paidById,
  userIds,
}: UpdateBookingInput): Promise<UpdateBookingResult> {
  const existing = await prisma.booking.findUnique({ where: { id: bookingId }, select: { stopId: true } });
  if (!existing || existing.stopId !== stopId) {
    return { ok: false, formError: "La reserva no existe en esta parada." };
  }

  if (label !== undefined && !label.trim()) {
    return { ok: false, fieldErrors: { label: "Ponele un nombre a la reserva." } };
  }

  const memberIds = await membershipIdsForStop(stopId);
  if (!memberIds) {
    return { ok: false, formError: "La parada no existe." };
  }

  const fieldErrors = validateBookingFields(memberIds, { reservedById, paidById, userIds });
  if (fieldErrors) {
    return { ok: false, fieldErrors };
  }

  await prisma.$transaction(async (tx) => {
    if (label !== undefined || reservedById !== undefined || paidById !== undefined) {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          ...(label !== undefined ? { label: label.trim() } : {}),
          ...(reservedById !== undefined ? { reservedById } : {}),
          ...(paidById !== undefined ? { paidById } : {}),
        },
      });
    }

    if (userIds !== undefined) {
      await tx.bookingUser.deleteMany({ where: { bookingId } });
      await tx.bookingUser.createMany({
        data: userIds.map((membershipId) => ({ bookingId, membershipId })),
      });
    }
  });

  return { ok: true };
}

export type RemoveBookingResult = { ok: true } | { ok: false; formError?: string };

/** Deletes the booking, its "who's using it" rows, and its voucher file
 * rows (all cascade) — and best-effort cleans up the actual Blob objects
 * too, since leaving orphaned files in storage isn't "deleted." A failed
 * Blob cleanup doesn't block the booking itself from being gone. */
export async function removeBooking(stopId: string, bookingId: string): Promise<RemoveBookingResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { stopId: true, vouchers: { select: { url: true } } },
  });

  if (!booking || booking.stopId !== stopId) {
    return { ok: false, formError: "La reserva no existe en esta parada." };
  }

  await prisma.booking.delete({ where: { id: bookingId } });

  if (booking.vouchers.length > 0) {
    try {
      await del(booking.vouchers.map((voucher) => voucher.url));
    } catch {
      // The DB rows are already gone; a dangling Blob object is a storage
      // leak to clean up later, not a reason to fail the removal itself.
    }
  }

  return { ok: true };
}
