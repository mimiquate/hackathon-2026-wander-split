// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import { AVATAR_COLOR_COUNT } from "@/lib/avatar-colors";

describe("createTrip", () => {
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];

  afterEach(async () => {
    if (createdTripIds.length) {
      await prisma.trip.deleteMany({ where: { id: { in: createdTripIds } } });
      createdTripIds.length = 0;
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
    }
  });

  async function createUser(overrides?: { name?: string | null }) {
    const email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({
      data: { email, passwordHash: "irrelevant", name: overrides?.name ?? null },
    });
    createdUserIds.push(user.id);
    return user;
  }

  it("creates the trip with an admin membership for the creator and one invite", async () => {
    const user = await createUser();
    const tripName = `Trip ${randomUUID()}`;

    const result = await createTrip({
      userId: user.id,
      name: tripName,
      startDate: "2026-10-12",
      currency: "USD",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id: result.tripId },
      include: { memberships: true, invite: true },
    });

    expect(trip.name).toEqual(tripName);
    expect(trip.currency).toEqual("USD");
    expect(trip.memberships).toHaveLength(1);
    expect(trip.memberships[0]).toMatchObject({ userId: user.id, role: "admin" });
    expect(trip.invite?.token).toBeTruthy();
    expect(result.inviteToken).toEqual(trip.invite?.token);
  });

  it("round-trips the calendar date through @db.Date without drifting", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const raw = await prisma.$queryRaw<{ d: string }[]>`
      SELECT "startDate"::text AS d FROM "Trip" WHERE id = ${result.tripId}
    `;
    expect(raw[0].d).toEqual("2026-10-12");

    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: result.tripId } });
    expect(trip.startDate.toISOString()).toEqual("2026-10-12T00:00:00.000Z");
  });

  it("persists no end date anywhere on the trip", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: result.tripId } });
    expect("endDate" in trip).toBe(false);
  });

  it("derives the creator's display name from the account name when set", async () => {
    const user = await createUser({ name: "Ana Pérez" });
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const membership = await prisma.tripMembership.findUniqueOrThrow({
      where: { tripId_userId: { tripId: result.tripId, userId: user.id } },
    });
    expect(membership.displayName).toEqual("Ana Pérez");
  });

  it("derives the creator's display name from the email local part when the account has no name", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const membership = await prisma.tripMembership.findUniqueOrThrow({
      where: { tripId_userId: { tripId: result.tripId, userId: user.id } },
    });
    expect(membership.displayName).toEqual(user.email.split("@")[0]);
  });

  it("assigns the creator a colorIndex within range", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const membership = await prisma.tripMembership.findUniqueOrThrow({
      where: { tripId_userId: { tripId: result.tripId, userId: user.id } },
    });
    expect(membership.colorIndex).toBeGreaterThanOrEqual(0);
    expect(membership.colorIndex).toBeLessThan(AVATAR_COLOR_COUNT);
  });

  it("rejects a blank name and writes nothing", async () => {
    const user = await createUser();
    const uniqueName = `Trip ${randomUUID()}`;
    const result = await createTrip({
      userId: user.id,
      name: "   ",
      startDate: "2026-10-12",
      currency: "USD",
    });
    expect(result).toEqual({ ok: false, fieldErrors: { name: "Poné un nombre para el viaje." } });
    expect(await prisma.trip.count({ where: { name: uniqueName } })).toEqual(0);
  });

  it("rejects an empty start date", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "",
      currency: "USD",
    });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { startDate: "Elegí cuándo arranca el viaje." },
    });
  });

  it("rejects a malformed start date", async () => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-02-31",
      currency: "USD",
    });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { startDate: "Elegí cuándo arranca el viaje." },
    });
  });

  it.each(["ARS", "usd", "Eur", ""])("rejects currency %j", async (currency) => {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency,
    });
    expect(result).toEqual({ ok: false, fieldErrors: { currency: "Elegí una moneda." } });
  });

  it("gives two trips different invite tokens", async () => {
    const user = await createUser();
    const first = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    const second = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "EUR",
    });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) throw new Error("expected ok results");
    createdTripIds.push(first.tripId, second.tripId);

    expect(first.inviteToken).not.toEqual(second.inviteToken);
  });
});
