// @vitest-environment node
import { createHash, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sentResetLinks, resetSentResetLinks } from "@/lib/email";
import {
  requestPasswordReset,
  checkResetToken,
  resetPassword,
  MISMATCH_MESSAGE,
  INVALID_TOKEN_MESSAGE,
} from "@/lib/auth/reset";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

describe("reset", () => {
  let userId: string;
  let email: string;
  const originalPassword = "the-original-password";

  beforeEach(async () => {
    resetSentResetLinks();
    email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(originalPassword) },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  async function seedToken(
    token: string,
    overrides: { expiresAt?: Date; consumedAt?: Date } = {},
  ) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 30 * 60_000),
        consumedAt: overrides.consumedAt,
      },
    });
  }

  describe("requestPasswordReset", () => {
    it("creates a token and sends a link for a registered email", async () => {
      await requestPasswordReset({ email, origin: "http://localhost:3000" });

      const tokens = await prisma.passwordResetToken.findMany({ where: { userId } });
      expect(tokens).toHaveLength(1);

      expect(sentResetLinks).toHaveLength(1);
      expect(sentResetLinks[0].to).toEqual(email);
      expect(sentResetLinks[0].resetUrl).toMatch(/^http:\/\/localhost:3000\/reset\?token=/);
    });

    it("resolves the same way for an unregistered email — no token, no email", async () => {
      const unknownEmail = `nobody-${randomUUID()}@example.com`;

      await expect(
        requestPasswordReset({ email: unknownEmail, origin: "http://localhost:3000" }),
      ).resolves.toBeUndefined();

      expect(sentResetLinks).toHaveLength(0);
    });
  });

  describe("checkResetToken", () => {
    it("treats an unknown, expired, and consumed token identically to invalid", async () => {
      const expired = await seedToken("expired-token", {
        expiresAt: new Date(Date.now() - 1000),
      });
      const consumed = await seedToken("consumed-token", { consumedAt: new Date() });

      expect(await checkResetToken({ token: "no-such-token" })).toEqual({ valid: false });
      expect(await checkResetToken({ token: "expired-token" })).toEqual({ valid: false });
      expect(await checkResetToken({ token: "consumed-token" })).toEqual({ valid: false });

      // sanity: rows really exist with the expected flags, not silently absent
      expect(expired.expiresAt.getTime()).toBeLessThan(Date.now());
      expect(consumed.consumedAt).not.toBeNull();
    });

    it("accepts a valid, unexpired, unconsumed token", async () => {
      await seedToken("good-token");
      expect(await checkResetToken({ token: "good-token" })).toEqual({ valid: true });
    });
  });

  describe("resetPassword", () => {
    it("succeeds, changes the password, consumes the token, and creates a session", async () => {
      await seedToken("good-token");

      const result = await resetPassword({
        token: "good-token",
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");

      const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      expect(await verifyPassword(user.passwordHash, originalPassword)).toBe(false);
      expect(await verifyPassword(user.passwordHash, "a-brand-new-password")).toBe(true);

      const tokenRow = await prisma.passwordResetToken.findUniqueOrThrow({
        where: { tokenHash: hashToken("good-token") },
      });
      expect(tokenRow.consumedAt).not.toBeNull();

      const session = await prisma.session.findUnique({
        where: { sessionToken: result.sessionToken },
      });
      expect(session?.userId).toEqual(userId);
    });

    it("rejects reusing an already-consumed token", async () => {
      await seedToken("good-token");

      const first = await resetPassword({
        token: "good-token",
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      });
      expect(first.ok).toBe(true);

      const second = await resetPassword({
        token: "good-token",
        password: "another-password",
        confirmPassword: "another-password",
      });
      expect(second).toEqual({ ok: false, formError: INVALID_TOKEN_MESSAGE });
    });

    it("rejects an expired token", async () => {
      await seedToken("expired-token", { expiresAt: new Date(Date.now() - 1000) });

      const result = await resetPassword({
        token: "expired-token",
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      });
      expect(result).toEqual({ ok: false, formError: INVALID_TOKEN_MESSAGE });
    });

    it("rejects mismatched passwords without consuming the token", async () => {
      await seedToken("good-token");

      const result = await resetPassword({
        token: "good-token",
        password: "a-brand-new-password",
        confirmPassword: "does-not-match",
      });
      expect(result).toEqual({
        ok: false,
        fieldErrors: { confirmPassword: MISMATCH_MESSAGE },
      });

      expect(await checkResetToken({ token: "good-token" })).toEqual({ valid: true });
    });

    it("rejects a too-short password without consuming the token", async () => {
      await seedToken("good-token");

      const result = await resetPassword({
        token: "good-token",
        password: "short",
        confirmPassword: "short",
      });
      expect(result).toEqual({
        ok: false,
        fieldErrors: { password: "Usá al menos 8 caracteres." },
      });

      expect(await checkResetToken({ token: "good-token" })).toEqual({ valid: true });
    });

    it("deletes the user's other active sessions on a successful reset", async () => {
      await seedToken("good-token");
      const otherSessions = await Promise.all(
        [1, 2, 3].map((n) =>
          prisma.session.create({
            data: {
              userId,
              sessionToken: `other-session-${n}-${randomUUID()}`,
              expires: new Date(Date.now() + 60 * 60_000),
            },
          }),
        ),
      );

      const result = await resetPassword({
        token: "good-token",
        password: "a-brand-new-password",
        confirmPassword: "a-brand-new-password",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok result");

      const remaining = await prisma.session.findMany({ where: { userId } });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].sessionToken).toEqual(result.sessionToken);

      for (const session of otherSessions) {
        expect(remaining.find((row) => row.id === session.id)).toBeUndefined();
      }
    });
  });
});
