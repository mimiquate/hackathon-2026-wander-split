import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { emailSender } from "@/lib/email";
import { createDatabaseSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/password";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/signup";

export const RESET_TOKEN_EXPIRY_MINUTES = 30;

export const MISMATCH_MESSAGE = "No coinciden. Escribila de nuevo.";
export const INVALID_TOKEN_MESSAGE = "Este enlace ya no es válido. Pedí uno nuevo.";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RequestResetInput {
  email: string;
  origin: string;
}

// Always resolves the same way regardless of whether the email is
// registered — there's no branch here that could leak account existence,
// not just two branches that happen to look alike today.
export async function requestPasswordReset({ email, origin }: RequestResetInput): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Flat delay so the known-email branch (hash + insert + send) isn't a
  // measurably slower/faster oracle than the unknown-email no-op — same
  // technique as verification.ts's verifyCode.
  await sleep(300);

  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60_000);

  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  await emailSender.sendPasswordResetLink({
    to: user.email,
    resetUrl: `${origin}/reset?token=${token}`,
  });
}

export type TokenCheckResult = { valid: true } | { valid: false };

export async function checkResetToken({ token }: { token: string }): Promise<TokenCheckResult> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.consumedAt || record.expiresAt <= new Date()) {
    return { valid: false };
  }

  return { valid: true };
}

export type ResetResult =
  | { ok: true; sessionToken: string }
  | {
      ok: false;
      fieldErrors?: { password?: string; confirmPassword?: string };
      formError?: string;
    };

export interface ResetInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export async function resetPassword({
  token,
  password,
  confirmPassword,
}: ResetInput): Promise<ResetResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, fieldErrors: { password: "Usá al menos 8 caracteres." } };
  }

  if (password !== confirmPassword) {
    return { ok: false, fieldErrors: { confirmPassword: MISMATCH_MESSAGE } };
  }

  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), consumedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!record) {
    return { ok: false, formError: INVALID_TOKEN_MESSAGE };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
  ]);

  const session = await createDatabaseSession(record.userId);

  // No bulk/exclude-token helper on the adapter, so this is a direct query —
  // exactly the "trivial delete" ADR 0005 chose database sessions to enable.
  await prisma.session.deleteMany({
    where: { userId: record.userId, sessionToken: { not: session.sessionToken } },
  });

  return { ok: true, sessionToken: session.sessionToken };
}
