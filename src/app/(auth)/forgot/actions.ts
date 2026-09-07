"use server";

import { headers } from "next/headers";
import { requestPasswordReset } from "@/lib/auth/reset";

export interface ForgotFormState {
  sent?: boolean;
}

export async function forgotAction(
  _prevState: ForgotFormState,
  formData: FormData,
): Promise<ForgotFormState> {
  const email = String(formData.get("email") ?? "");
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  await requestPasswordReset({ email, origin: `${protocol}://${host}` });

  return { sent: true };
}
