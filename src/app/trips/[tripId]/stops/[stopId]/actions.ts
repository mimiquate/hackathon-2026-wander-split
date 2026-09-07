"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getStop, type TripStopData } from "@/lib/trips/stops";
import { addPlace, removePlace, type AddPlaceResult, type RemovePlaceResult } from "@/lib/trips/places";
import { searchPlacesInCity, type CityPlaceSearchResult } from "@/lib/geo/mapbox-places";
import {
  createBooking,
  getBooking,
  removeBooking,
  updateBooking,
  type CreateBookingResult,
  type RemoveBookingResult,
  type UpdateBookingResult,
} from "@/lib/trips/bookings";
import {
  addVoucherFile,
  removeVoucherFile,
  type RemoveVoucherFileResult,
  type VoucherFileData,
} from "@/lib/trips/vouchers";
import {
  createExpense,
  updateExpense,
  type CreateExpenseResult,
  type UpdateExpenseResult,
} from "@/lib/trips/expenses";

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

export interface BookingActionInput {
  label: string;
  reservedById: string;
  paidById: string;
  userIds: string[];
}

export async function createBookingAction(
  tripId: string,
  stopId: string,
  input: BookingActionInput,
): Promise<CreateBookingResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await createBooking({ stopId, ...input });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

export async function updateBookingAction(
  tripId: string,
  stopId: string,
  bookingId: string,
  input: BookingActionInput,
): Promise<UpdateBookingResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await updateBooking({ stopId, bookingId, ...input });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

export async function removeBookingAction(
  tripId: string,
  stopId: string,
  bookingId: string,
): Promise<RemoveBookingResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await removeBooking(stopId, bookingId);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

export interface ConfirmVoucherUploadInput {
  url: string;
  filename: string;
  mimeType: string;
}

export type ConfirmVoucherUploadResult =
  | { ok: true; voucher: VoucherFileData }
  | { ok: false; formError?: string };

/**
 * Persists a voucher upload's metadata right after the client's upload()
 * call resolves — belt-and-suspenders alongside the upload endpoint's own
 * onUploadCompleted webhook (which may not fire promptly, or at all,
 * outside a real deployment), since addVoucherFile's upsert makes calling
 * it from both places safe.
 */
export async function confirmVoucherUploadAction(
  tripId: string,
  stopId: string,
  bookingId: string,
  input: ConfirmVoucherUploadInput,
): Promise<ConfirmVoucherUploadResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const booking = await getBooking(stopId, bookingId);
  if (!booking) {
    return { ok: false, formError: "La reserva no existe en esta parada." };
  }

  const voucher = await addVoucherFile({ bookingId, ...input });
  revalidatePath(`/trips/${tripId}/stops/${stopId}`);

  return { ok: true, voucher };
}

export async function removeVoucherFileAction(
  tripId: string,
  stopId: string,
  bookingId: string,
  voucherId: string,
): Promise<RemoveVoucherFileResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const booking = await getBooking(stopId, bookingId);
  if (!booking) {
    return { ok: false, formError: "La reserva no existe en esta parada." };
  }

  const result = await removeVoucherFile(bookingId, voucherId);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

// Phase 3's dialog only ever touches an expense's non-adjustment fields —
// adjustedAmount gets its own action in Phase 4.
export interface ExpenseActionInput {
  label: string;
  category: string;
  paymentMethod: string;
  originalAmount: number;
  originalCurrency: string;
  paidById: string;
  userIds: string[];
}

export async function createExpenseAction(
  tripId: string,
  stopId: string,
  input: ExpenseActionInput,
): Promise<CreateExpenseResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await createExpense({ stopId, ...input });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}

export async function updateExpenseAction(
  tripId: string,
  stopId: string,
  expenseId: string,
  input: ExpenseActionInput,
): Promise<UpdateExpenseResult> {
  const stop = await assertStopAccess(tripId, stopId);
  if (!stop) {
    return { ok: false, formError: "No tenés acceso a esta parada." };
  }

  const result = await updateExpense({ stopId, expenseId, ...input });
  if (result.ok) {
    revalidatePath(`/trips/${tripId}/stops/${stopId}`);
  }
  return result;
}
