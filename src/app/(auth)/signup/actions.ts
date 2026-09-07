"use server";

import { redirect } from "next/navigation";
import { signupCore } from "@/lib/auth/signup";
import { isSafeRedirectPath } from "@/lib/safe-redirect";

export interface SignupFormState {
  fieldErrors?: { email?: string; password?: string };
  formError?: string;
}

export async function signupAction(
  _prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const termsAccepted = formData.get("terms") === "on";
  const next = String(formData.get("next") ?? "");

  const result = await signupCore({ email, password, termsAccepted });

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, formError: result.formError };
  }

  const nextParam = isSafeRedirectPath(next) ? `&next=${encodeURIComponent(next)}` : "";
  redirect(`/login?created=1${nextParam}`);
}
