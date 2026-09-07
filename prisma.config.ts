import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Optional here: only migrate/introspect need it, and `prisma generate`
    // (run from postinstall) must still succeed on hosts like Vercel builds
    // where DATABASE_URL isn't set.
    url: process.env.DATABASE_URL ? env("DATABASE_URL") : undefined,
  },
});
