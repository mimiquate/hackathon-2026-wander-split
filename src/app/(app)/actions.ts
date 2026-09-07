"use server";

import { signOut } from "@/auth";
import { loginCore } from "@/lib/auth/login";
import { setSessionCookie } from "@/lib/auth/cookies";

export interface ReauthFormState {
  fieldErrors?: { password?: string };
  formError?: string;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function reauthAction(
  _prevState: ReauthFormState,
  formData: FormData,
): Promise<ReauthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await loginCore({ email, password });

  if (!result.ok) {
    return {
      fieldErrors: result.fieldErrors,
      formError: result.formError,
    };
  }

  await setSessionCookie(result.sessionToken);
  return {};
}
