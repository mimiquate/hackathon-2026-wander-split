"use server";

import { redirect } from "next/navigation";
import { createTrip } from "@/lib/trips/create";
import { getCurrentUser } from "@/lib/auth/current-user";

export interface CreateTripFormState {
  fieldErrors?: { name?: string; startDate?: string; currency?: string };
  formError?: string;
}

export async function createTripAction(
  _prevState: CreateTripFormState,
  formData: FormData,
): Promise<CreateTripFormState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const currency = String(formData.get("currency") ?? "");

  const result = await createTrip({ userId: user.id, name, startDate, currency });

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, formError: result.formError };
  }

  redirect(`/trips/${result.tripId}`);
}
