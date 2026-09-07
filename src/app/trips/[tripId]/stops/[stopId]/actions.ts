"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership, type TripCrewMember } from "@/lib/trips/membership";
import { getStop, type TripStopData } from "@/lib/trips/stops";
import { addPlace, removePlace, type AddPlaceResult, type RemovePlaceResult } from "@/lib/trips/places";
import { addNote, type TripNoteData } from "@/lib/trips/notes";
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

// A client-safe view of a note — createdAt as an ISO string, since Date
// values don't cross the server/client boundary anywhere else in this
// codebase (every other timestamp is formatted to a string first).
export interface TripNoteView extends Omit<TripNoteData, "createdAt"> {
  createdAt: string;
}

function toNoteView(note: TripNoteData): TripNoteView {
  return { ...note, createdAt: note.createdAt.toISOString() };
}

export type AddNoteActionResult =
  | { ok: true; note: TripNoteView }
  | { ok: false; fieldErrors?: { text?: string }; formError?: string };

async function assertStopMembership(
  tripId: string,
  stopId: string,
): Promise<{ stop: TripStopData; membership: TripCrewMember } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) return null;

  const stop = await getStop(tripId, stopId);
  if (!stop) return null;

  return { stop, membership };
}

export async function addNoteAction(
  tripId: string,
  stopId: string,
  text: string,
): Promise<AddNoteActionResult> {
  const access = await assertStopMembership(tripId, stopId);
  if (!access) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await addNote({ stopId, membershipId: access.membership.membershipId, text });
  if (!result.ok) return result;

  revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  return { ok: true, note: toNoteView(result.note) };
}
