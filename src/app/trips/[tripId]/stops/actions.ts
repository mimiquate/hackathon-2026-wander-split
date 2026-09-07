"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import {
  addStop,
  removeStop,
  reorderStops,
  updateStopNights,
  cycleStopStatus,
  setLegTransport,
  getStopsForTrip,
  type AddStopResult,
  type RemoveStopResult,
  type ReorderStopsResult,
  type UpdateStopNightsResult,
  type CycleStopStatusResult,
  type SetLegTransportResult,
} from "@/lib/trips/stops";
import { searchCitiesWithMapbox, type CitySearchResult } from "@/lib/geo/mapbox-search";

export async function searchCitiesAction(tripId: string, query: string): Promise<CitySearchResult[] | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return null;
  }

  try {
    return await searchCitiesWithMapbox(query);
  } catch {
    return null;
  }
}

export async function addStopAction(
  tripId: string,
  city: string,
  country: string,
  latitude: number,
  longitude: number,
): Promise<AddStopResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await addStop({ tripId, city, country, latitude, longitude });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function removeStopAction(tripId: string, stopId: string): Promise<RemoveStopResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await removeStop(tripId, stopId);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function reorderStopsAction(
  tripId: string,
  positions: Array<{ stopId: string; newPosition: number }>,
): Promise<ReorderStopsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await reorderStops({ tripId, positions });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function updateStopNightsAction(
  tripId: string,
  stopId: string,
  nights: number,
): Promise<UpdateStopNightsResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await updateStopNights({ tripId, stopId, nights });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function cycleStopStatusAction(tripId: string, stopId: string): Promise<CycleStopStatusResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await cycleStopStatus(tripId, stopId);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function setLegTransportAction(
  tripId: string,
  stopId: string,
  mode: string,
): Promise<SetLegTransportResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await setLegTransport({ tripId, stopId, mode });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function getStopsAction(tripId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return null;
  }

  return getStopsForTrip(tripId);
}
