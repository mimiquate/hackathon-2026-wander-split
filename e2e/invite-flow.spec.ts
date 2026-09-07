import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

// Runs against the same dev database the webServer's `next dev` uses (see
// playwright.config.ts), not the .env.test one vitest's integration tests
// use — so setup/teardown here has to see the same rows the server does.
//
// Fixture setup is written directly against Prisma rather than importing
// src/lib/trips/create.ts: Playwright's own module loader (unlike
// vitest.config.ts's resolve.alias) doesn't resolve this project's "@/"
// path alias, and create.ts pulls in several "@/"-aliased modules
// transitively. src/lib/prisma.ts and src/lib/password.ts have no internal
// aliased imports, so importing them by relative path here is safe.
//
// A dynamic import (not a static one) is required even for those: static
// imports are hoisted and would evaluate src/lib/prisma.ts (which reads
// DATABASE_URL at module-load time) before this file's own code below runs.
async function loadDataLayer() {
  if (!process.env.DATABASE_URL) {
    try {
      process.loadEnvFile(".env.local");
    } catch {
      // .env.local not present — this spec can't run without a live DB.
    }
  }
  const [{ prisma }, { hashPassword }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/password"),
  ]);
  return { prisma, hashPassword };
}

test.describe("invite link — logged-out visitor", () => {
  let dataLayer: Awaited<ReturnType<typeof loadDataLayer>>;
  let adminId: string;
  let joinerId: string;
  let tripId: string;
  let inviteToken: string;
  const joinerEmail = `e2e-${randomUUID()}@example.com`;
  const joinerPassword = "a-real-password";

  test.beforeAll(async () => {
    dataLayer = await loadDataLayer();
    const { prisma, hashPassword } = dataLayer;

    const admin = await prisma.user.create({
      data: {
        email: `e2e-admin-${randomUUID()}@example.com`,
        passwordHash: await hashPassword("irrelevant"),
      },
    });
    adminId = admin.id;

    const joiner = await prisma.user.create({
      data: { email: joinerEmail, passwordHash: await hashPassword(joinerPassword) },
    });
    joinerId = joiner.id;

    inviteToken = randomBytes(16).toString("base64url");
    const trip = await prisma.trip.create({
      data: {
        name: `E2E trip ${randomUUID()}`,
        startDate: new Date("2026-10-12T00:00:00.000Z"),
        currency: "USD",
        memberships: {
          create: { userId: adminId, role: "admin", displayName: "Admin", colorIndex: 0 },
        },
        invite: { create: { token: inviteToken } },
      },
    });
    tripId = trip.id;
  });

  test.afterAll(async () => {
    const { prisma } = dataLayer;
    await prisma.trip.delete({ where: { id: tripId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, joinerId] } } });
  });

  test("is routed through login and lands back on the same join screen", async ({ page }) => {
    await page.goto(`/i/${inviteToken}`);

    await expect(page).toHaveURL(/\/login\?next=/);

    await page.getByLabel("Correo").fill(joinerEmail);
    await page.getByLabel("Contraseña").fill(joinerPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(`/i/${inviteToken}`);
    await expect(page.getByLabel("Cómo querés que te llamen")).toBeVisible();
  });
});
