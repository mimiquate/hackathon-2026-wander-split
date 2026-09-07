import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createDatabaseSession } from "@/lib/auth/session";
import { MAX_LOGIN_FAILURES, countRecentFailures, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { normalizeEmail } from "@/lib/email-validation";

const RATE_LIMIT_MESSAGE = "Demasiados intentos. Probá de nuevo en 5 minutos.";

// Not a real password's hash — exists only so the "unknown email" branch pays
// the same argon2 verification cost as a real wrong-password check, instead
// of being measurably faster and leaking account existence via timing.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$kryUw47AycD2Fd9/1i3lyw$DIMcHPyhjcjXfp7nm4KePCZ+oMqM5YWkAjCF147Ru1Y";

export interface LoginInput {
  email: string;
  password: string;
}

export type LoginResult =
  | { ok: true; sessionToken: string }
  | { ok: false; fieldErrors?: { password?: string }; formError?: string; rateLimited?: boolean };

export async function loginCore({ email, password }: LoginInput): Promise<LoginResult> {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    await verifyPassword(DUMMY_HASH, password);
    return { ok: false, fieldErrors: { password: "Contraseña incorrecta. Te quedan 4 intentos." } };
  }

  const failures = await countRecentFailures(user.id);
  if (failures >= MAX_LOGIN_FAILURES) {
    return { ok: false, formError: RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const valid = await verifyPassword(user.passwordHash, password);

  if (valid) {
    await recordLoginAttempt(user.id, true);
    const session = await createDatabaseSession(user.id);
    return { ok: true, sessionToken: session.sessionToken };
  }

  await recordLoginAttempt(user.id, false);
  const newFailureCount = failures + 1;
  if (newFailureCount >= MAX_LOGIN_FAILURES) {
    return { ok: false, formError: RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const remaining = MAX_LOGIN_FAILURES - newFailureCount;
  return {
    ok: false,
    fieldErrors: { password: `Contraseña incorrecta. Te quedan ${remaining} intentos.` },
  };
}
