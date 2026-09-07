import { prisma } from "@/lib/prisma";
import { formatCalendarDate, parseCalendarDate } from "@/lib/trips/dates";
import { hasAnyBooking } from "@/lib/trips/bookings";
import { START_DATE_LOCKED_MESSAGE } from "@/lib/trips/constants";

export interface TripEditPanel {
  tripId: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  canEditStartDate: boolean;
}

/**
 * Everything the "Datos del viaje" dialog needs to render its defaults and
 * gate the start-date field ahead of any submit attempt. Null when the
 * trip doesn't exist.
 */
export async function getTripEditPanel(tripId: string): Promise<TripEditPanel | null> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, name: true, startDate: true },
  });
  if (!trip) return null;

  return {
    tripId: trip.id,
    name: trip.name,
    startDate: formatCalendarDate(trip.startDate),
    canEditStartDate: !(await hasAnyBooking(tripId)),
  };
}

export interface UpdateTripInput {
  tripId: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
}

export type UpdateTripResult =
  | { ok: true; name: string; startDate: string }
  | { ok: false; fieldErrors?: { name?: string; startDate?: string }; formError?: string };

export async function updateTrip({ tripId, name, startDate }: UpdateTripInput): Promise<UpdateTripResult> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, fieldErrors: { name: "Poné un nombre para el viaje." } };
  }

  const parsedStartDate = parseCalendarDate(startDate);
  if (!parsedStartDate) {
    return { ok: false, fieldErrors: { startDate: "Elegí cuándo arranca el viaje." } };
  }

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { startDate: true },
  });
  const startDateChanged = formatCalendarDate(trip.startDate) !== formatCalendarDate(parsedStartDate);

  if (startDateChanged && (await hasAnyBooking(tripId))) {
    return { ok: false, fieldErrors: { startDate: START_DATE_LOCKED_MESSAGE } };
  }

  // NOTE(#8): once Stop exists, this is where a startDateChanged branch
  // would shift every stop's already-computed date range by the delta
  // between trip.startDate and parsedStartDate. Nothing to shift yet.

  await prisma.trip.update({
    where: { id: tripId },
    data: { name: trimmedName, startDate: parsedStartDate },
  });

  return { ok: true, name: trimmedName, startDate: formatCalendarDate(parsedStartDate) };
}
