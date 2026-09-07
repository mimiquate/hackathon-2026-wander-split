// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createDatabaseSession, deleteDatabaseSession } from "@/lib/auth/session";
import { getUserForSessionToken } from "@/lib/auth/current-user";

describe("getUserForSessionToken", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
    }
  });

  async function createUser() {
    const email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({ data: { email, passwordHash: "irrelevant" } });
    createdUserIds.push(user.id);
    return user;
  }

  it("resolves the user behind a valid session token", async () => {
    const user = await createUser();
    const { sessionToken } = await createDatabaseSession(user.id);

    const result = await getUserForSessionToken(sessionToken);
    expect(result).toEqual({ id: user.id, email: user.email, name: null });
  });

  it("returns null for undefined", async () => {
    expect(await getUserForSessionToken(undefined)).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    expect(await getUserForSessionToken(`unknown-${randomUUID()}`)).toBeNull();
  });

  it("returns null for an expired session", async () => {
    const user = await createUser();
    const { sessionToken } = await createDatabaseSession(user.id);
    await prisma.session.update({
      where: { sessionToken },
      data: { expires: new Date(Date.now() - 60_000) },
    });

    expect(await getUserForSessionToken(sessionToken)).toBeNull();
  });

  it("returns null after the session is deleted", async () => {
    const user = await createUser();
    const { sessionToken } = await createDatabaseSession(user.id);
    await deleteDatabaseSession(sessionToken);

    expect(await getUserForSessionToken(sessionToken)).toBeNull();
  });
});
