"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { reserveInviteEmail, type ReserveInviteEmailResult } from "@/lib/trips/invite";

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
