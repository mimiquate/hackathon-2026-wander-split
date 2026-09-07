// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sentEmails, resetSentEmails } from "@/lib/email";
import {
  verifyCode,
  resendVerificationCode,
  getResendCooldownSeconds,
  WRONG_CODE_MESSAGE,
  RESEND_TOO_SOON_MESSAGE,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/verification";
import { signupCore } from "@/lib/auth/signup";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

describe("verification", () => {
  let userId: string;
  let email: string;

  beforeEach(async () => {
    resetSentEmails();
    email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword("irrelevant") },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  async function seedCode(
    code: string,
    overrides: { expiresAt?: Date; consumedAt?: Date; createdAt?: Date } = {},
  ) {
    return prisma.emailVerificationCode.create({
      data: {
        userId,
        codeHash: hashCode(code),
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 10 * 60_000),
        consumedAt: overrides.consumedAt,
        createdAt: overrides.createdAt,
      },
    });
  }

  describe("verifyCode", () => {
    it("succeeds with the correct code, sets emailVerified, and creates a session", async () => {
      await seedCode("123456");

      const result = await verifyCode({ email, code: "123456" });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(user.emailVerified).not.toBeNull();

      const session = await prisma.session.findUnique({
        where: { sessionToken: result.sessionToken },
      });
      expect(session?.userId).toEqual(userId);
    });

    it("consumes the code — a second use of the same code fails", async () => {
      await seedCode("123456");

      const first = await verifyCode({ email, code: "123456" });
      expect(first.ok).toBe(true);

      const second = await verifyCode({ email, code: "123456" });
      expect(second).toEqual({ ok: false, formError: WRONG_CODE_MESSAGE });
    });

    it("fails with a wrong code without consuming the active one", async () => {
      await seedCode("123456");

      const result = await verifyCode({ email, code: "000000" });
      expect(result).toEqual({ ok: false, formError: WRONG_CODE_MESSAGE });

      const stillCorrect = await verifyCode({ email, code: "123456" });
      expect(stillCorrect.ok).toBe(true);
    });

    it("reads an expired code identically to a wrong code", async () => {
      await seedCode("123456", { expiresAt: new Date(Date.now() - 1000) });

      const result = await verifyCode({ email, code: "123456" });
      expect(result).toEqual({ ok: false, formError: WRONG_CODE_MESSAGE });
    });

    it("reads an unknown email identically to a wrong code", async () => {
      const result = await verifyCode({
        email: `nobody-${randomUUID()}@example.com`,
        code: "123456",
      });
      expect(result).toEqual({ ok: false, formError: WRONG_CODE_MESSAGE });
    });
  });

  describe("resendVerificationCode", () => {
    it("invalidates the prior code and sends a new one", async () => {
      const original = await seedCode("111111", {
        createdAt: new Date(Date.now() - (RESEND_COOLDOWN_SECONDS + 5) * 1000),
      });

      const result = await resendVerificationCode({ email });
      expect(result).toEqual({ ok: true, cooldownSeconds: RESEND_COOLDOWN_SECONDS });

      const updatedOriginal = await prisma.emailVerificationCode.findUniqueOrThrow({
        where: { id: original.id },
      });
      expect(updatedOriginal.consumedAt).not.toBeNull();

      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].to).toEqual(email);

      const oldCodeStillFails = await verifyCode({ email, code: "111111" });
      expect(oldCodeStillFails).toEqual({ ok: false, formError: WRONG_CODE_MESSAGE });

      const newCodeWorks = await verifyCode({ email, code: sentEmails[0].code });
      expect(newCodeWorks.ok).toBe(true);
    });

    it("rejects a resend within the 60-second cooldown and leaves the prior code untouched", async () => {
      const original = await seedCode("111111");

      const result = await resendVerificationCode({ email });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected rejection");
      expect(result.formError).toEqual(RESEND_TOO_SOON_MESSAGE);
      expect(result.cooldownSeconds).toBeGreaterThan(0);
      expect(result.cooldownSeconds).toBeLessThanOrEqual(RESEND_COOLDOWN_SECONDS);

      const untouched = await prisma.emailVerificationCode.findUniqueOrThrow({
        where: { id: original.id },
      });
      expect(untouched.consumedAt).toBeNull();
    });
  });

  describe("getResendCooldownSeconds", () => {
    it("returns 0 when no code has ever been sent", async () => {
      expect(await getResendCooldownSeconds({ email })).toEqual(0);
    });

    it("returns the real remaining time when a code was just sent", async () => {
      await seedCode("123456");
      const remaining = await getResendCooldownSeconds({ email });
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(RESEND_COOLDOWN_SECONDS);
    });
  });

  it("end-to-end: signupCore sends a real code that verifyCode accepts", async () => {
    const signupEmail = `test-${randomUUID()}@example.com`;
    const result = await signupCore({
      email: signupEmail,
      password: "a-real-password",
      termsAccepted: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    try {
      const sent = sentEmails.find((message) => message.to === signupEmail);
      expect(sent).toBeDefined();
      expect(sent!.code).toMatch(/^\d{6}$/);

      const verifyResult = await verifyCode({ email: signupEmail, code: sent!.code });
      expect(verifyResult.ok).toBe(true);
    } finally {
      await prisma.user.delete({ where: { id: result.userId } });
    }
  });
});
