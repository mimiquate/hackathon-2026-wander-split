"use server";

import { redirect } from "next/navigation";
import { loginCore } from "@/lib/auth/login";
import { setSessionCookie } from "@/lib/auth/cookies";
import { resolveAuthRedirectPath } from "@/lib/auth/session";
import { isSafeRedirectPath } from "@/lib/safe-redirect";

export interface LoginFormState {
  fieldErrors?: { password?: string };
  formError?: string;
  rateLimited?: boolean;
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const result = await loginCore({ email, password });

  if (!result.ok) {
    return {
      fieldErrors: result.fieldErrors,
      formError: result.formError,
      rateLimited: result.rateLimited,
    };
  }

  await setSessionCookie(result.sessionToken);
  redirect(isSafeRedirectPath(next) ? next : await resolveAuthRedirectPath(result.sessionToken));
}
