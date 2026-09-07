"use server";

import { redirect } from "next/navigation";
import { signupCore } from "@/lib/auth/signup";

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

  const result = await signupCore({ email, password, termsAccepted });

  if (!result.ok) {
    return { fieldErrors: result.fieldErrors, formError: result.formError };
  }

  redirect(`/verify?email=${encodeURIComponent(result.email)}`);
}
