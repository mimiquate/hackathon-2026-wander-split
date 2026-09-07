import { randomBytes } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // ~30 days

export const adapter = PrismaAdapter(prisma);

// Auth.js's built-in credentials callback never writes a database Session
// row (see docs/adr/0010-manual-database-session-creation-for-credentials.md)
// so a successful `authorize()` call creates the session itself, here.
export async function createDatabaseSession(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  if (!adapter.createSession) {
    throw new Error("Prisma adapter is missing createSession");
  }

  return adapter.createSession({ sessionToken, userId, expires });
}

export async function deleteDatabaseSession(sessionToken: string) {
  if (!adapter.deleteSession) {
    throw new Error("Prisma adapter is missing deleteSession");
  }

  await adapter.deleteSession(sessionToken);
}
