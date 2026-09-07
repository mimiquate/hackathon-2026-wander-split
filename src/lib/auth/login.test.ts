// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { loginCore } from "@/lib/auth/login";
import { MAX_LOGIN_FAILURES } from "@/lib/auth/rate-limit";

describe("loginCore", () => {
  const password = "correct-horse-battery-staple";
  let userId: string;
  let email: string;

  beforeEach(async () => {
    email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("succeeds with valid credentials and creates a session", async () => {
    const result = await loginCore({ email, password });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    const session = await prisma.session.findUnique({ where: { sessionToken: result.sessionToken } });
    expect(session?.userId).toEqual(userId);
  });

  it("fails with the wrong password and reports the real remaining count", async () => {
    const first = await loginCore({ email, password: "nope" });
    expect(first).toEqual({
      ok: false,
      fieldErrors: { password: "Contraseña incorrecta. Te quedan 4 intentos." },
    });

    const second = await loginCore({ email, password: "nope" });
    expect(second).toEqual({
      ok: false,
      fieldErrors: { password: "Contraseña incorrecta. Te quedan 3 intentos." },
    });
  });

  it("fails for an unknown email without writing a LoginAttempt row", async () => {
    const unknownEmail = `nobody-${randomUUID()}@example.com`;
    const result = await loginCore({ email: unknownEmail, password: "irrelevant" });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { password: "Contraseña incorrecta. Te quedan 4 intentos." },
    });
    const attempts = await prisma.loginAttempt.count({ where: { userId } });
    expect(attempts).toEqual(0);
  });

  it("rate-limits after 5 failures within the window, and still rejects a 6th correct-password attempt", async () => {
    for (let i = 1; i < MAX_LOGIN_FAILURES; i++) {
      const result = await loginCore({ email, password: "nope" });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected failure");
      expect(result.rateLimited).toBeUndefined();
    }

    const fifth = await loginCore({ email, password: "nope" });
    expect(fifth).toEqual({
      ok: false,
      formError: "Demasiados intentos. Probá de nuevo en 5 minutos.",
      rateLimited: true,
    });

    const sixth = await loginCore({ email, password });
    expect(sixth).toEqual({
      ok: false,
      formError: "Demasiados intentos. Probá de nuevo en 5 minutos.",
      rateLimited: true,
    });

    const attempts = await prisma.loginAttempt.count({ where: { userId } });
    expect(attempts).toEqual(MAX_LOGIN_FAILURES);
  });

  it("clears the rate limit once the window has passed", async () => {
    const staleFailures = Array.from({ length: MAX_LOGIN_FAILURES }, () => ({
      userId,
      succeeded: false,
      createdAt: new Date(Date.now() - 10 * 60_000),
    }));
    await prisma.loginAttempt.createMany({ data: staleFailures });

    const result = await loginCore({ email, password });
    expect(result.ok).toBe(true);
  });
});
