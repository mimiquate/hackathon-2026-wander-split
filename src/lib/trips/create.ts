import { prisma } from "@/lib/prisma";
import { defaultColorIndexFor } from "@/lib/avatar-colors";
import { createInviteToken } from "@/lib/trips/invite";
import { parseCalendarDate } from "@/lib/trips/dates";
import { isTripCurrency } from "@/lib/trips/constants";

export interface CreateTripInput {
  userId: string;
  name: string;
  startDate: string; // "YYYY-MM-DD", straight from <input type="date">
  currency: string; // untrusted; validated against TRIP_CURRENCIES
}

export type CreateTripResult =
  | { ok: true; tripId: string; inviteToken: string }
  | {
      ok: false;
      fieldErrors?: { name?: string; startDate?: string; currency?: string };
      formError?: string;
    };

export async function createTrip({
  userId,
  name,
  startDate,
  currency,
}: CreateTripInput): Promise<CreateTripResult> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, fieldErrors: { name: "Poné un nombre para el viaje." } };
  }

  const parsedStartDate = parseCalendarDate(startDate);
  if (!parsedStartDate) {
    return { ok: false, fieldErrors: { startDate: "Elegí cuándo arranca el viaje." } };
  }

  if (!isTripCurrency(currency)) {
    return { ok: false, fieldErrors: { currency: "Elegí una moneda." } };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const creatorDisplayName = user.name?.trim() || user.email.split("@")[0];

  const trip = await prisma.trip.create({
    data: {
      name: trimmedName,
      startDate: parsedStartDate,
      currency,
      memberships: {
        create: {
          userId,
          role: "admin",
          displayName: creatorDisplayName,
          colorIndex: defaultColorIndexFor(userId),
        },
      },
      invite: { create: { token: createInviteToken() } },
    },
    select: { id: true, invite: { select: { token: true } } },
  });

  if (!trip.invite) {
    throw new Error("trip created without its invite");
  }

  return { ok: true, tripId: trip.id, inviteToken: trip.invite.token };
}
