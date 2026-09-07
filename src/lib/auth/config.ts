import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { adapter, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";

// A plain, standalone function rather than an inline `authorize` handler:
// `Credentials(config)` (below) doesn't actually wire up the `authorize` you
// pass it — it returns a fixed `{ authorize: () => null, options: config }`
// shape, and only Auth.js's internal provider-parsing step (which only runs
// inside a full `Auth()`/`auth()` call) merges `options` back in. Exporting
// this directly lets it be called — and tested — without going through that.
export async function verifyCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
) {
  const email = String(credentials?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(credentials?.password ?? "");
  if (!email || !password) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return null;

  return user;
}

export const credentialsProvider = Credentials({
  credentials: { email: {}, password: {} },
  authorize: verifyCredentials,
});

// @auth/core refuses `session.strategy: "database"` when every configured
// provider is type "credentials" (it assumes credentials-only means you must
// want JWT sessions) — see docs/adr/0010-manual-database-session-creation-for-credentials.md.
// This provider exists solely to make that check pass. It is never linked
// from any screen and never passed to `signIn()`; its handler should never
// run, so it throws loudly if it ever does.
const databaseSessionCompatNoopProvider: NextAuthConfig["providers"][number] = {
  id: "db-session-compat-noop",
  type: "email",
  name: "Unused",
  async sendVerificationRequest() {
    throw new Error(
      "db-session-compat-noop provider was invoked — it exists only to satisfy " +
        "@auth/core's database-session+credentials-only config check and should never run.",
    );
  },
};

export const authConfig: NextAuthConfig = {
  adapter,
  // Set explicitly (rather than left to next-auth's setEnvDefaults) so this
  // config also works when passed straight to @auth/core's Auth() — which
  // integration tests do, to hit the credentials/session logic directly.
  secret: process.env.AUTH_SECRET,
  basePath: "/api/auth",
  trustHost: true,
  session: { strategy: "database", maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [credentialsProvider, databaseSessionCompatNoopProvider],
};
