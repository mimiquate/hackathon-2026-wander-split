"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { joinTrip } from "@/lib/trips/join";

export interface JoinTripFormState {
  fieldErrors?: { displayName?: string; colorIndex?: string };
  formError?: string;
}

export async function joinTripAction(
  token: string,
  _prevState: JoinTripFormState,
  formData: FormData,
): Promise<JoinTripFormState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/i/${token}`)}`);
  }

  const displayName = String(formData.get("displayName") ?? "");
  const colorIndex = Number(formData.get("colorIndex"));

  const result = await joinTrip({ token, userId: user.id, displayName, colorIndex });

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, formError: result.formError };
  }

  redirect(`/trips/${result.tripId}`);
}
