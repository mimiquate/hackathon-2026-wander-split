"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/auth/reset";
import { setSessionCookie } from "@/lib/auth/cookies";

export interface ResetFormState {
  fieldErrors?: { password?: string; confirmPassword?: string };
  formError?: string;
}

export async function resetAction(
  _prevState: ResetFormState,
  formData: FormData,
): Promise<ResetFormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const result = await resetPassword({ token, password, confirmPassword });

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, formError: result.formError };
  }

  await setSessionCookie(result.sessionToken);
  redirect("/");
}
