"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { reserveInviteEmail, type ReserveInviteEmailResult } from "@/lib/trips/invite";
import { updateTrip, type UpdateTripResult } from "@/lib/trips/update";
import { markTransferSettled, type MarkTransferSettledResult } from "@/lib/trips/settlement";

export async function reserveInviteEmailAction(
  tripId: string,
  email: string,
): Promise<ReserveInviteEmailResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  return reserveInviteEmail({ tripId, email });
}

export async function updateTripAction(
  tripId: string,
  input: { name: string; startDate: string },
): Promise<UpdateTripResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await updateTrip({ tripId, name: input.name, startDate: input.startDate });
  if (result.ok) {
    // Defensive only — this page's own display updates from local state in
    // DatosViajeDialog; this just keeps the Next.js router cache correct for
    // back/forward navigation and any future page (e.g. #22's dashboard)
    // that reads this same route.
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}

export async function markTransferSettledAction(
  tripId: string,
  transfer: { fromMembershipId: string; toMembershipId: string; amount: number },
): Promise<MarkTransferSettledResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, formError: "Iniciá sesión de nuevo para continuar." };
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) {
    return { ok: false, formError: "No tenés acceso a este viaje." };
  }

  const result = await markTransferSettled(tripId, transfer);
  if (result.ok) {
    revalidatePath(`/trips/${tripId}`);
  }
  return result;
}
