import { cookies } from "next/headers";
import { adapter } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Testable core: given a raw session token (or undefined), resolves the
 * user behind it, treating an expired session the same as no session — the
 * adapter's own getSessionAndUser doesn't check expiry itself.
 */
export async function getUserForSessionToken(
  sessionToken: string | undefined,
): Promise<CurrentUser | null> {
  if (!sessionToken) return null;

  if (!adapter.getSessionAndUser) {
    throw new Error("Prisma adapter is missing getSessionAndUser");
  }

  const result = await adapter.getSessionAndUser(sessionToken);
  if (!result) return null;
  if (result.session.expires.getTime() <= Date.now()) return null;

  return { id: result.user.id, email: result.user.email, name: result.user.name ?? null };
}

/**
 * Reads the session cookie off the current request and resolves the user
 * behind it — the one place a server component/action should check "who's
 * logged in?".
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  return getUserForSessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}
