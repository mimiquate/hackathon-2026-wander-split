// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { sentEmails, resetSentEmails } from "@/lib/email";
import { signupCore } from "@/lib/auth/signup";

describe("signupCore", () => {
  const createdUserIds: string[] = [];

  beforeEach(() => {
    resetSentEmails();
  });

  afterEach(async () => {
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
    }
  });

  it("creates a user with a hashed password and sends a verification code", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const result = await signupCore({ email, password: "a-real-password", termsAccepted: true });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdUserIds.push(result.userId);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    expect(user.email).toEqual(email.toLowerCase());
    expect(user.passwordHash).not.toEqual("a-real-password");

    expect(result.email).toEqual(email.toLowerCase());
    const sent = sentEmails.find((message) => message.to === email.toLowerCase());
    expect(sent).toBeDefined();
    expect(sent!.code).toMatch(/^\d{6}$/);
  });

  it("rejects an invalid-looking email", async () => {
    const result = await signupCore({
      email: "not-an-email",
      password: "a-real-password",
      termsAccepted: true,
    });
    expect(result).toEqual({ ok: false, fieldErrors: { email: "Ese correo no parece válido." } });
  });

  it("rejects a too-short password", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const result = await signupCore({ email, password: "short", termsAccepted: true });
    expect(result).toEqual({ ok: false, fieldErrors: { password: "Usá al menos 8 caracteres." } });
  });

  it("rejects an unchecked terms checkbox", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const result = await signupCore({ email, password: "a-real-password", termsAccepted: false });
    expect(result).toEqual({
      ok: false,
      formError: "Tenés que aceptar los términos para continuar.",
    });
  });

  it("rejects a duplicate email", async () => {
    const email = `test-${randomUUID()}@example.com`;
    const first = await signupCore({ email, password: "a-real-password", termsAccepted: true });
    expect(first.ok).toBe(true);
    if (first.ok) createdUserIds.push(first.userId);

    const second = await signupCore({ email, password: "another-password", termsAccepted: true });
    expect(second).toEqual({
      ok: false,
      fieldErrors: {
        email: "Ese correo ya está registrado. Entrá en vez de crear una cuenta nueva.",
      },
    });
  });
});
