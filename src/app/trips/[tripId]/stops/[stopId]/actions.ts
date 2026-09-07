"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getStop, type TripStopData } from "@/lib/trips/stops";
import { addPlace, removePlace, type AddPlaceResult, type RemovePlaceResult } from "@/lib/trips/places";
import { searchPlacesInCity, type CityPlaceSearchResult } from "@/lib/geo/mapbox-places";

async function assertStopAccess(tripId: string, stopId: string): Promise<TripStopData | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) return null;

  return getStop(tripId, stopId);
}

export async function searchPlacesAction(
  tripId: string,
  stopId: string,
  query: string,
): Promise<CityPlaceSearchResult[] | null> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) return null;

  try {
    return await searchPlacesInCity(query, { latitude: stop.latitude, longitude: stop.longitude });
  } catch {
    return null;
  }
}

export interface AddPlaceActionInput {
  label: string;
  kind: string;
  latitude: number;
  longitude: number;
}

export async function addPlaceAction(
  tripId: string,
  stopId: string,
  input: AddPlaceActionInput,
): Promise<AddPlaceResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await addPlace({ stopId, ...input });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

export async function removePlaceAction(
  tripId: string,
  stopId: string,
  placeId: string,
): Promise<RemovePlaceResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await removePlace(stopId, placeId);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}
