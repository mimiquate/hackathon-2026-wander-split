import { prisma } from "@/lib/prisma";
import { MAX_STOPS_PER_TRIP, isTransportMode } from "@/lib/trips/constants";

export interface TripStopData {
  id: string;
  tripId: string;
  position: number;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  nights: number;
  status: string;
  transportMode: string | null;
}

export async function getStopsForTrip(tripId: string): Promise<TripStopData[]> {
  return prisma.tripStop.findMany({
    where: { tripId },
    orderBy: { position: "asc" },
  });
}

export interface StopDateRange {
  startDate: Date;
  endDate: Date;
  position: number;
  totalStops: number;
}

/**
 * The city-detail header's "12–14 oct · 2 noches · parada 1 de 3" line.
 * `stops` must be the trip's full, position-ordered list (from
 * getStopsForTrip) — dates are derived from cumulative nights of every
 * earlier stop, never stored on the stop itself. Null if `stopId` isn't in
 * `stops`.
 */
export function computeStopDateRange(
  stops: TripStopData[],
  tripStartDate: Date,
  stopId: string,
): StopDateRange | null {
  const index = stops.findIndex((s) => s.id === stopId);
  if (index === -1) return null;

  const nightsBefore = stops.slice(0, index).reduce((sum, s) => sum + s.nights, 0);

  const startDate = new Date(tripStartDate);
  startDate.setUTCDate(startDate.getUTCDate() + nightsBefore);

  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + stops[index].nights);

  return { startDate, endDate, position: index + 1, totalStops: stops.length };
}

export interface AddStopInput {
  tripId: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export type AddStopResult =
  | { ok: true; stop: TripStopData }
  | { ok: false; formError?: string };

export async function addStop({ tripId, city, country, latitude, longitude }: AddStopInput): Promise<AddStopResult> {
  // Check trip exists and count current stops
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return { ok: false, formError: "El viaje no existe." };
  }

  const stopCount = await prisma.tripStop.count({ where: { tripId } });
  if (stopCount >= MAX_STOPS_PER_TRIP) {
    return { ok: false, formError: `No se pueden agregar más de ${MAX_STOPS_PER_TRIP} paradas.` };
  }

  const stop = await prisma.tripStop.create({
    data: {
      tripId,
      position: stopCount + 1,
      city: city.trim(),
      country: country.trim(),
      latitude,
      longitude,
      nights: 1,
      status: "thinking",
    },
  });

  return { ok: true, stop };
}

export type RemoveStopResult =
  | { ok: true; removedPosition: number }
  | { ok: false; formError?: string };

export async function removeStop(tripId: string, stopId: string): Promise<RemoveStopResult> {
  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { tripId: true, position: true },
  });

  if (!stop || stop.tripId !== tripId) {
    return { ok: false, formError: "La parada no existe en este viaje." };
  }

  const removedPosition = stop.position;

  // Delete the stop and reindex all remaining stops
  await prisma.$transaction([
    prisma.tripStop.delete({ where: { id: stopId } }),
    prisma.tripStop.updateMany({
      where: {
        tripId,
        position: { gt: removedPosition },
      },
      data: {
        position: { decrement: 1 },
      },
    }),
  ]);

  return { ok: true, removedPosition };
}

export interface ReorderStopsInput {
  tripId: string;
  positions: Array<{ stopId: string; newPosition: number }>;
}

export type ReorderStopsResult =
  | { ok: true; stops: TripStopData[] }
  | { ok: false; formError?: string };

export async function reorderStops({ tripId, positions }: ReorderStopsInput): Promise<ReorderStopsResult> {
  // Validate all stops belong to this trip and positions are valid
  const stops = await prisma.tripStop.findMany({
    where: { tripId },
    select: { id: true, position: true },
  });

  const stopIds = new Set(stops.map((s) => s.id));
  for (const { stopId, newPosition } of positions) {
    if (!stopIds.has(stopId)) {
      return { ok: false, formError: "Una de las paradas no pertenece a este viaje." };
    }
    if (newPosition < 1 || newPosition > stops.length) {
      return { ok: false, formError: "Posición inválida para una parada." };
    }
  }

  // Use negative positions as temporary placeholders to avoid unique constraint violations
  // First, move all stops being reordered to negative positions
  const updateToNegative = positions.map((_, i) =>
    prisma.tripStop.update({
      where: { id: positions[i].stopId },
      data: { position: -(i + 1) },
    }),
  );

  // Then move them to their final positions
  const updateToFinal = positions.map(({ stopId, newPosition }) =>
    prisma.tripStop.update({
      where: { id: stopId },
      data: { position: newPosition },
    }),
  );

  await prisma.$transaction([...updateToNegative, ...updateToFinal]);

  const updatedStops = await getStopsForTrip(tripId);
  return { ok: true, stops: updatedStops };
}

export interface UpdateStopNightsInput {
  tripId: string;
  stopId: string;
  nights: number;
}

export type UpdateStopNightsResult =
  | { ok: true; stop: TripStopData }
  | { ok: false; formError?: string };

export async function updateStopNights({
  tripId,
  stopId,
  nights,
}: UpdateStopNightsInput): Promise<UpdateStopNightsResult> {
  if (nights < 0 || !Number.isInteger(nights)) {
    return { ok: false, formError: "Las noches deben ser un número positivo." };
  }

  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { tripId: true },
  });

  if (!stop || stop.tripId !== tripId) {
    return { ok: false, formError: "La parada no existe en este viaje." };
  }

  const updated = await prisma.tripStop.update({
    where: { id: stopId },
    data: { nights },
  });

  return { ok: true, stop: updated };
}

export type CycleStopStatusResult =
  | { ok: true; stop: TripStopData; newStatus: string }
  | { ok: false; formError?: string };

export async function cycleStopStatus(tripId: string, stopId: string): Promise<CycleStopStatusResult> {
  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { id: true, tripId: true, status: true },
  });

  if (!stop || stop.tripId !== tripId) {
    return { ok: false, formError: "La parada no existe en este viaje." };
  }

  const statuses = ["thinking", "urgent", "booked"];
  const currentIndex = statuses.indexOf(stop.status);
  const nextIndex = (currentIndex + 1) % statuses.length;
  const newStatus = statuses[nextIndex];

  const updated = await prisma.tripStop.update({
    where: { id: stopId },
    data: { status: newStatus },
  });

  return { ok: true, stop: updated, newStatus };
}

export interface SetLegTransportInput {
  tripId: string;
  stopId: string;
  mode: string;
}

export type SetLegTransportResult =
  | { ok: true; stop: TripStopData }
  | { ok: false; formError?: string };

export async function setLegTransport({
  tripId,
  stopId,
  mode,
}: SetLegTransportInput): Promise<SetLegTransportResult> {
  if (!isTransportMode(mode)) {
    return { ok: false, formError: "Modo de transporte inválido." };
  }

  const stop = await prisma.tripStop.findUnique({
    where: { id: stopId },
    select: { tripId: true, position: true },
  });

  if (!stop || stop.tripId !== tripId) {
    return { ok: false, formError: "La parada no existe en este viaje." };
  }

  if (stop.position === 1) {
    return { ok: false, formError: "No hay transporte hacia la primera parada." };
  }

  const updated = await prisma.tripStop.update({
    where: { id: stopId },
    data: { transportMode: mode },
  });

  return { ok: true, stop: updated };
}
