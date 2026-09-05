# Database sessions, not JWT

Auth.js can issue stateless JWT sessions or database-backed sessions (a row per session). The reset-password flow needs to invalidate a user's *other* active sessions the moment they save a new password — trivial with database sessions (delete the other rows), but awkward with JWT (there's no row to delete; it needs a token-version or blocklist scheme layered on top just to fake revocation). We use database sessions so that requirement is a plain delete instead of bespoke machinery.

The cost is that anything checking a session — including the route-protection middleware — has to query Postgres via Prisma, which only runs in the Node.js runtime, not Vercel's edge middleware. That's already the plan (see [ADR 0004](0004-postgres-prisma-persistence.md)), so it isn't an added constraint here, just a reason not to reach for edge middleware later without re-opening this decision.
