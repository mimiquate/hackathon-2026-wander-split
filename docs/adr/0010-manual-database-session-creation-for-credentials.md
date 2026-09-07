# Manually creating the database session for credentials sign-in

ADR 0003 picked Auth.js's Credentials provider; ADR 0005 picked database sessions so reset-password can delete a user's other sessions with a plain query. The current Auth.js beta line (`@auth/core` 0.41.x) doesn't support that combination out of the box:

- `assertConfig` rejects `session.strategy: "database"` outright when every configured provider is `type: "credentials"` — it assumes credentials-only means you must want JWT sessions. Left as-is, `auth()` (which hits the same config check on every call) would silently return `null` forever, no visible error.
- Independently, the built-in `/api/auth/callback/credentials` route always issues a JWT and never writes a `Session` row for a credentials provider, regardless of `session.strategy`. That's not a config option — it's how the current callback handler is written.

We work around both:

1. `src/auth.ts` registers a second, inert provider (`db-session-compat-noop`, `type: "email"`) purely to make `assertConfig` see a non-credentials provider and stop blocking database sessions. It's never linked from any screen and never passed to `signIn()`; its `sendVerificationRequest` throws if it's ever actually invoked, as a tripwire.
2. `authorize()` is used only to verify email + password (which is also exactly what Phase 1's "hit the Credentials callback directly" test does). On success, `src/lib/auth/session.ts`'s `createDatabaseSession` writes the `Session` row itself, via the Prisma adapter, with a random token and the ~30-day expiry from ADR 0005.

Session **reads** (`auth()`) and **deletes** (`signOut()`, or the adapter directly) go through Auth.js normally — that part isn't affected by the credentials-only limitation, only the config gate in point 1 needed satisfying.

If a future `next-auth`/`@auth/core` release adds real support for credentials + database sessions, this whole file (and the noop provider) should be revisited and likely deleted. Until then: don't remove the noop provider without reading this doc first.
