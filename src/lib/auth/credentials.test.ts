// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyCredentials } from "@/lib/auth/config";

describe("credentials provider authorize()", () => {
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

  it("succeeds with valid credentials", async () => {
    const user = await verifyCredentials({ email, password });
    expect(user).toMatchObject({ id: userId, email });
  });

  it("fails with the wrong password", async () => {
    const user = await verifyCredentials({ email, password: "wrong-password" });
    expect(user).toBeNull();
  });

  it("fails for an unknown email", async () => {
    const user = await verifyCredentials({ email: "nobody@example.com", password });
    expect(user).toBeNull();
  });
});
