# Postgres via Prisma for the app's first persistence layer

Everything shipped so far (the landing page) is static — auth is the first feature that needs a real datastore: users, hashed passwords, verification codes, and password-reset tokens. We pick Postgres, provisioned as Vercel Postgres (Neon-backed) since the app deploys on Vercel and this is the path with no separate account or manual wiring — env vars land in the project automatically. Prisma is the ORM: it's what Auth.js's official adapter (`@auth/prisma-adapter`) targets, so session/account/user tables come pre-modeled instead of hand-rolled, and its typed queries and migration story hold up as the schema grows into trips/expenses later rather than being an auth-only choice we'd have to revisit.

PR preview deployments share a single dev database rather than getting their own isolated branch — per-branch isolation is a nice-to-have for a bigger team, not a need at this stage.
