"use server";

import { redirect } from "next/navigation";
import { verifyCode, resendVerificationCode } from "@/lib/auth/verification";
import { setSessionCookie } from "@/lib/auth/cookies";
import { resolveAuthRedirectPath } from "@/lib/auth/session";

export interface VerifyFormState {
  formError?: string;
}

export async function verifyAction(
  _prevState: VerifyFormState,
  formData: FormData,
): Promise<VerifyFormState> {
  const email = String(formData.get("email") ?? "");
  const code = String(formData.get("code") ?? "");

  const result = await verifyCode({ email, code });

  if (!result.ok) {
    return { formError: result.formError };
  }

  await setSessionCookie(result.sessionToken);
  redirect(await resolveAuthRedirectPath(result.sessionToken));
}

export interface ResendFormState {
  formError?: string;
  resent?: boolean;
  cooldownSeconds?: number;
}

export async function resendAction(
  _prevState: ResendFormState,
  formData: FormData,
): Promise<ResendFormState> {
  const email = String(formData.get("email") ?? "");

  const result = await resendVerificationCode({ email });

  if (!result.ok) {
    return { formError: result.formError, cooldownSeconds: result.cooldownSeconds };
  }

  return { resent: true, cooldownSeconds: result.cooldownSeconds };
}
