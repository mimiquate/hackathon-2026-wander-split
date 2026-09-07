// @vitest-environment node
import { randomUUID } from "node:crypto";
import { Auth } from "@auth/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { authConfig } from "@/lib/auth/config";
import {
  createDatabaseSession,
  deleteDatabaseSession,
  isSessionValid,
  resolveAuthRedirectPath,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

async function readSession(sessionToken: string) {
  const request = new Request("http://localhost/api/auth/session", {
    headers: { cookie: `authjs.session-token=${sessionToken}` },
  });
  const response = await Auth(request, authConfig);
  if (!response.ok) return null;
  return response.json();
}

describe("database sessions", () => {
  let userId: string;
  let email: string;

  beforeEach(async () => {
    email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword("irrelevant") },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("is readable through auth.js's own session action right after creation, with a ~30-day expiry", async () => {
    const { sessionToken, expires } = await createDatabaseSession(userId);

    const row = await prisma.session.findUniqueOrThrow({ where: { sessionToken } });
    const expectedExpiry = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
    expect(row.expires.getTime()).toBeGreaterThan(expectedExpiry - 60_000);
    expect(row.expires.getTime()).toBeLessThan(expectedExpiry + 60_000);
    expect(expires.getTime()).toEqual(row.expires.getTime());

    const session = await readSession(sessionToken);
    expect(session).not.toBeNull();
    expect(session?.user?.email).toEqual(email);
  });

  it("stops resolving once deleted", async () => {
    const { sessionToken } = await createDatabaseSession(userId);
    expect(await readSession(sessionToken)).not.toBeNull();

    await deleteDatabaseSession(sessionToken);

    expect(await readSession(sessionToken)).toBeNull();
    await expect(prisma.session.findUnique({ where: { sessionToken } })).resolves.toBeNull();
  });

  it("returns null for a token that was never issued", async () => {
    expect(await readSession("not-a-real-token")).toBeNull();
  });

  it("isSessionValid returns true for a valid session, false for expired/missing", async () => {
    const { sessionToken } = await createDatabaseSession(userId);
    expect(await isSessionValid(sessionToken)).toBe(true);

    await deleteDatabaseSession(sessionToken);
    expect(await isSessionValid(sessionToken)).toBe(false);

    expect(await isSessionValid("not-a-real-token")).toBe(false);
  });

  describe("resolveAuthRedirectPath", () => {
    it("returns /firstrun for a user with firstRunCompletedAt unset", async () => {
      const { sessionToken } = await createDatabaseSession(userId);
      const path = await resolveAuthRedirectPath(sessionToken);
      expect(path).toEqual("/firstrun");
    });

    it("returns /trips for a user with firstRunCompletedAt set", async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { firstRunCompletedAt: new Date() },
      });
      const { sessionToken } = await createDatabaseSession(userId);
      const path = await resolveAuthRedirectPath(sessionToken);
      expect(path).toEqual("/trips");
    });
  });
});
