import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { emailSender } from "@/lib/email";
import { createDatabaseSession } from "@/lib/auth/session";

export const CODE_LENGTH = 6;
export const CODE_EXPIRY_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;

export const WRONG_CODE_MESSAGE = "Ese código no es. Fijate que no haya vencido.";
export const RESEND_TOO_SOON_MESSAGE = "Esperá unos segundos antes de pedir otro código.";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function codesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CreateAndSendInput {
  userId: string;
  email: string;
}

export async function createAndSendVerificationCode({
  userId,
  email,
}: CreateAndSendInput): Promise<void> {
  const code = String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, "0");
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60_000);

  await prisma.emailVerificationCode.create({
    data: { userId, codeHash, expiresAt },
  });
  await emailSender.sendVerificationCode({ to: email, code });
}

export type VerifyResult =
  | { ok: true; sessionToken: string }
  | { ok: false; formError: string };

export interface VerifyInput {
  email: string;
  code: string;
}

export async function verifyCode({ email, code }: VerifyInput): Promise<VerifyResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Flat delay on every branch (match or not) so this isn't a measurably
  // faster oracle for "no such user"/"expired"/"wrong" vs. a real hit —
  // not a substitute for real per-account attempt tracking (this table has
  // no attempts column, unlike LoginAttempt), just a cheap floor on brute
  // force throughput given the code's own 10-minute expiry.
  await sleep(300);

  if (!user) {
    return { ok: false, formError: WRONG_CODE_MESSAGE };
  }

  const activeCode = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!activeCode || !codesMatch(hashCode(code), activeCode.codeHash)) {
    return { ok: false, formError: WRONG_CODE_MESSAGE };
  }

  await prisma.$transaction([
    prisma.emailVerificationCode.update({
      where: { id: activeCode.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
  ]);

  const session = await createDatabaseSession(user.id);
  return { ok: true, sessionToken: session.sessionToken };
}

export type ResendResult =
  | { ok: true; cooldownSeconds: number }
  | { ok: false; formError: string; cooldownSeconds: number };

export interface ResendInput {
  email: string;
}

export async function resendVerificationCode({ email }: ResendInput): Promise<ResendResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return { ok: false, formError: WRONG_CODE_MESSAGE, cooldownSeconds: 0 };
  }

  const mostRecent = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (mostRecent) {
    const elapsedMs = Date.now() - mostRecent.createdAt.getTime();
    if (elapsedMs < RESEND_COOLDOWN_SECONDS * 1000) {
      const cooldownSeconds = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);
      return { ok: false, formError: RESEND_TOO_SOON_MESSAGE, cooldownSeconds };
    }
  }

  await prisma.emailVerificationCode.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await createAndSendVerificationCode({ userId: user.id, email: normalizedEmail });

  return { ok: true, cooldownSeconds: RESEND_COOLDOWN_SECONDS };
}

export async function getResendCooldownSeconds({ email }: ResendInput): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return 0;

  const mostRecent = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!mostRecent) return 0;

  const elapsedMs = Date.now() - mostRecent.createdAt.getTime();
  const remainingMs = RESEND_COOLDOWN_SECONDS * 1000 - elapsedMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}
