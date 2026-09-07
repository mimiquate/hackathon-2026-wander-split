// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import * as bookings from "@/lib/trips/bookings";
import { getTripEditPanel, updateTrip } from "@/lib/trips/update";
import { START_DATE_LOCKED_MESSAGE } from "@/lib/trips/constants";

describe("updateTrip", () => {
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    if (createdTripIds.length) {
      await prisma.trip.deleteMany({ where: { id: { in: createdTripIds } } });
      createdTripIds.length = 0;
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      createdUserIds.length = 0;
    }
  });

  async function createUser() {
    const user = await prisma.user.create({
      data: { email: `test-${randomUUID()}@example.com`, passwordHash: "irrelevant" },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function createTestTrip() {
    const admin = await createUser();
    const result = await createTrip({
      userId: admin.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);
    return result.tripId;
  }

  it("renames and changes the start date together when there are no bookings", async () => {
    const tripId = await createTestTrip();

    const result = await updateTrip({ tripId, name: "Nuevo nombre", startDate: "2026-11-01" });

    expect(result).toEqual({ ok: true, name: "Nuevo nombre", startDate: "2026-11-01" });
    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
    expect(trip.name).toEqual("Nuevo nombre");
    expect(trip.startDate.toISOString()).toEqual("2026-11-01T00:00:00.000Z");
  });

  it("rejects a blank name and writes nothing", async () => {
    const tripId = await createTestTrip();

    const result = await updateTrip({ tripId, name: "   ", startDate: "2026-11-01" });

    expect(result).toEqual({ ok: false, fieldErrors: { name: "Poné un nombre para el viaje." } });
    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
    expect(trip.startDate.toISOString()).toEqual("2026-10-12T00:00:00.000Z");
  });

  it("rejects a malformed start date and writes nothing", async () => {
    const tripId = await createTestTrip();

    const result = await updateTrip({ tripId, name: "Nuevo nombre", startDate: "2026-02-31" });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { startDate: "Elegí cuándo arranca el viaje." },
    });
    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
    expect(trip.name).not.toEqual("Nuevo nombre");
  });

  it("renames successfully even with a booking present, as long as the start date is unchanged", async () => {
    const tripId = await createTestTrip();
    vi.spyOn(bookings, "hasAnyBooking").mockResolvedValue(true);

    const result = await updateTrip({ tripId, name: "Nuevo nombre", startDate: "2026-10-12" });

    expect(result).toEqual({ ok: true, name: "Nuevo nombre", startDate: "2026-10-12" });
  });

  it("rejects a start-date change server-side when a booking exists, even bypassing the UI", async () => {
    const tripId = await createTestTrip();
    vi.spyOn(bookings, "hasAnyBooking").mockResolvedValue(true);

    const result = await updateTrip({ tripId, name: "Nuevo nombre", startDate: "2026-11-01" });

    expect(result).toEqual({
      ok: false,
      fieldErrors: { startDate: START_DATE_LOCKED_MESSAGE },
    });
    const trip = await prisma.trip.findUniqueOrThrow({ where: { id: tripId } });
    expect(trip.startDate.toISOString()).toEqual("2026-10-12T00:00:00.000Z");
    expect(trip.name).not.toEqual("Nuevo nombre");
  });
});

describe("getTripEditPanel", () => {
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

  it("returns the trip's current name, start date, and edit gate", async () => {
    const admin = await prisma.user.create({
      data: { email: `test-${randomUUID()}@example.com`, passwordHash: "irrelevant" },
    });
    createdUserIds.push(admin.id);
    const created = await createTrip({
      userId: admin.id,
      name: "Trip Edit Panel",
      startDate: "2026-10-12",
      currency: "USD",
    });
    if (!created.ok) throw new Error("expected ok result");
    createdTripIds.push(created.tripId);

    const panel = await getTripEditPanel(created.tripId);
    expect(panel).toEqual({
      tripId: created.tripId,
      name: "Trip Edit Panel",
      startDate: "2026-10-12",
      canEditStartDate: true,
      currency: "USD",
    });
  });

  it("returns null for an unknown trip", async () => {
    expect(await getTripEditPanel(`unknown-${randomUUID()}`)).toBeNull();
  });
});
