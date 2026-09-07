// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import { findTripByInviteToken, reserveInviteEmail } from "@/lib/trips/invite";

describe("trip invite", () => {
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

  async function createUser() {
    const email = `test-${randomUUID()}@example.com`;
    const user = await prisma.user.create({ data: { email, passwordHash: "irrelevant" } });
    createdUserIds.push(user.id);
    return user;
  }

  async function createTestTrip(userId: string) {
    const result = await createTrip({
      userId,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);
    return result;
  }

  describe("findTripByInviteToken", () => {
    it("resolves the token back to its trip, admin, and members", async () => {
      const admin = await createUser();
      const trip = await createTestTrip(admin.id);

      const found = await findTripByInviteToken(trip.inviteToken);

      expect(found).not.toBeNull();
      expect(found?.tripId).toEqual(trip.tripId);
      expect(found?.startDate).toEqual("2026-10-12");
      expect(found?.currency).toEqual("USD");
      expect(found?.admin?.userId).toEqual(admin.id);
      expect(found?.members).toHaveLength(1);
      expect(found?.members[0].userId).toEqual(admin.id);
    });

    it("returns null for an unknown token", async () => {
      expect(await findTripByInviteToken(`unknown-${randomUUID()}`)).toBeNull();
    });
  });

  describe("reserveInviteEmail", () => {
    it("creates exactly one row per trip+email pair", async () => {
      const admin = await createUser();
      const trip = await createTestTrip(admin.id);
      const email = `guest-${randomUUID()}@example.com`;

      const first = await reserveInviteEmail({ tripId: trip.tripId, email });
      expect(first).toMatchObject({ ok: true, alreadyReserved: false });

      const second = await reserveInviteEmail({ tripId: trip.tripId, email });
      expect(second).toMatchObject({ ok: true, alreadyReserved: true });
      if (!first.ok || !second.ok) throw new Error("expected ok results");
      expect(second.reservationId).toEqual(first.reservationId);

      const count = await prisma.tripInviteReservation.count({
        where: { tripId: trip.tripId, email },
      });
      expect(count).toEqual(1);
    });

    it("treats emails as the same reservation regardless of case/whitespace", async () => {
      const admin = await createUser();
      const trip = await createTestTrip(admin.id);
      const base = `guest-${randomUUID()}@example.com`;

      const first = await reserveInviteEmail({ tripId: trip.tripId, email: `  ${base.toUpperCase()}  ` });
      const second = await reserveInviteEmail({ tripId: trip.tripId, email: base });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok) throw new Error("expected ok results");
      expect(second.reservationId).toEqual(first.reservationId);
      expect(second.alreadyReserved).toBe(true);
    });

    it("rejects a malformed email", async () => {
      const admin = await createUser();
      const trip = await createTestTrip(admin.id);

      const result = await reserveInviteEmail({ tripId: trip.tripId, email: "not-an-email" });
      expect(result).toEqual({ ok: false, fieldErrors: { email: "Ese correo no parece válido." } });
    });

    it("rejects an email that already belongs to a member of the trip", async () => {
      const admin = await createUser();
      const trip = await createTestTrip(admin.id);

      const result = await reserveInviteEmail({ tripId: trip.tripId, email: admin.email });
      expect(result).toEqual({ ok: false, fieldErrors: { email: "Esa persona ya está en el viaje." } });

      const count = await prisma.tripInviteReservation.count({
        where: { tripId: trip.tripId, email: admin.email },
      });
      expect(count).toEqual(0);
    });

    it("reserves the same email independently on two different trips", async () => {
      const admin = await createUser();
      const tripA = await createTestTrip(admin.id);
      const tripB = await createTestTrip(admin.id);
      const email = `guest-${randomUUID()}@example.com`;

      const resultA = await reserveInviteEmail({ tripId: tripA.tripId, email });
      const resultB = await reserveInviteEmail({ tripId: tripB.tripId, email });

      expect(resultA.ok).toBe(true);
      expect(resultB.ok).toBe(true);
      if (!resultA.ok || !resultB.ok) throw new Error("expected ok results");
      expect(resultA.reservationId).not.toEqual(resultB.reservationId);
    });
  });
});
