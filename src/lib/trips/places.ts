import { prisma } from "@/lib/prisma";
import { isPlaceKind } from "@/lib/trips/constants";

export interface TripPlaceData {
  id: string;
  stopId: string;
  label: string;
  kind: string;
  latitude: number;
  longitude: number;
}

/** Every place marked in this stop's city, oldest first. */
export async function getPlacesForStop(stopId: string): Promise<TripPlaceData[]> {
  return prisma.tripPlace.findMany({
    where: { stopId },
    orderBy: { createdAt: "asc" },
  });
}

export interface AddPlaceInput {
  stopId: string;
  label: string;
  kind: string;
  latitude: number;
  longitude: number;
}

export type AddPlaceResult =
  | { ok: true; place: TripPlaceData }
  | { ok: false; fieldErrors?: { label?: string; kind?: string }; formError?: string };

export async function addPlace({
  stopId,
  label,
  kind,
  latitude,
  longitude,
}: AddPlaceInput): Promise<AddPlaceResult> {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return { ok: false, fieldErrors: { label: "Ponele un nombre a este lugar." } };
  }

  if (!isPlaceKind(kind)) {
    return { ok: false, fieldErrors: { kind: "Elegí qué tipo de lugar es." } };
  }

  const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, select: { id: true } });
  if (!stop) {
    return { ok: false, formError: "La parada no existe." };
  }

  const place = await prisma.tripPlace.create({
    data: { stopId, label: trimmedLabel, kind, latitude, longitude },
  });

  return { ok: true, place };
}

export type RemovePlaceResult = { ok: true } | { ok: false; formError?: string };

/** Deletes outright, no soft-delete — a removed place never reappears on reload. */
export async function removePlace(stopId: string, placeId: string): Promise<RemovePlaceResult> {
  const place = await prisma.tripPlace.findUnique({
    where: { id: placeId },
    select: { stopId: true },
  });

  if (!place || place.stopId !== stopId) {
    return { ok: false, formError: "El lugar no existe en esta parada." };
  }

  await prisma.tripPlace.delete({ where: { id: placeId } });

  return { ok: true };
}
