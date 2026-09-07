"use server";

import { redirect } from "next/navigation";
import { completeFirstRun } from "@/lib/auth/firstrun";
import { getCurrentUser } from "@/lib/auth/session";

export interface FirstRunFormState {
  formError?: string;
}

export async function saveFirstRunAction(
  _prevState: FirstRunFormState,
  formData: FormData,
): Promise<FirstRunFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const colorRaw = formData.get("avatarColorIndex");
  const avatarColorIndex = colorRaw !== null && colorRaw !== "" ? Number(colorRaw) : undefined;

  await completeFirstRun({ userId: user.id, name: name || undefined, avatarColorIndex });
  redirect("/trips");
}

export async function skipFirstRunAction(
  _prevState: FirstRunFormState,
): Promise<FirstRunFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await completeFirstRun({ userId: user.id });
  redirect("/trips");
}
