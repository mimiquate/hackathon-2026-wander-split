// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import { reserveInviteEmail } from "@/lib/trips/invite";
import { joinTrip } from "@/lib/trips/join";
import { AVATAR_COLOR_COUNT } from "@/lib/avatar-colors";

describe("joinTrip", () => {
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

  async function createUser(email?: string) {
    const user = await prisma.user.create({
      data: { email: email ?? `test-${randomUUID()}@example.com`, passwordHash: "irrelevant" },
    });
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

  it("creates a participant membership carrying the passed name and color", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 2,
    });

    expect(result).toMatchObject({ ok: true, tripId: trip.tripId, alreadyMember: false });
    if (!result.ok) throw new Error("expected ok result");

    const membership = await prisma.tripMembership.findUniqueOrThrow({
      where: { id: result.membershipId },
    });
    expect(membership).toMatchObject({
      role: "participant",
      displayName: "Juan",
      colorIndex: 2,
      userId: joiner.id,
    });
  });

  it("resolves a matching unclaimed reservation instead of leaving it pending", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joinerEmail = `guest-${randomUUID()}@example.com`;
    const joiner = await createUser(joinerEmail);

    const reservation = await reserveInviteEmail({ tripId: trip.tripId, email: joinerEmail });
    expect(reservation.ok).toBe(true);
    if (!reservation.ok) throw new Error("expected ok result");

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    const claimed = await prisma.tripInviteReservation.findUniqueOrThrow({
      where: { id: reservation.reservationId },
    });
    expect(claimed.claimedAt).not.toBeNull();
    expect(claimed.claimedByMembershipId).toEqual(result.membershipId);

    const pendingCount = await prisma.tripInviteReservation.count({
      where: { tripId: trip.tripId, claimedAt: null },
    });
    expect(pendingCount).toEqual(0);

    const membershipCount = await prisma.tripMembership.count({
      where: { tripId: trip.tripId, userId: joiner.id },
    });
    expect(membershipCount).toEqual(1);
  });

  it("resolves the reservation case-insensitively", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joinerEmail = `guest-${randomUUID()}@example.com`;
    const joiner = await createUser(joinerEmail);

    const reservation = await reserveInviteEmail({
      tripId: trip.tripId,
      email: joinerEmail.toUpperCase(),
    });
    expect(reservation.ok).toBe(true);
    if (!reservation.ok) throw new Error("expected ok result");

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    const claimed = await prisma.tripInviteReservation.findUniqueOrThrow({
      where: { id: reservation.reservationId },
    });
    expect(claimed.claimedByMembershipId).toEqual(result.membershipId);
  });

  it("creates a fresh membership when there's no matching reservation, leaving other reservations untouched", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const otherEmail = `other-${randomUUID()}@example.com`;
    const otherReservation = await reserveInviteEmail({ tripId: trip.tripId, email: otherEmail });
    expect(otherReservation.ok).toBe(true);

    const joiner = await createUser();
    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(result.ok).toBe(true);

    const stillPending = await prisma.tripInviteReservation.findUniqueOrThrow({
      where: { tripId_email: { tripId: trip.tripId, email: otherEmail } },
    });
    expect(stillPending.claimedAt).toBeNull();
  });

  it("does not re-claim an already-claimed reservation", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const sharedEmail = `guest-${randomUUID()}@example.com`;

    const firstJoiner = await createUser(sharedEmail);
    const reservation = await reserveInviteEmail({ tripId: trip.tripId, email: sharedEmail });
    expect(reservation.ok).toBe(true);
    if (!reservation.ok) throw new Error("expected ok result");

    const firstResult = await joinTrip({
      token: trip.inviteToken,
      userId: firstJoiner.id,
      displayName: "Primero",
      colorIndex: 0,
    });
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) throw new Error("expected ok result");

    const claimed = await prisma.tripInviteReservation.findUniqueOrThrow({
      where: { id: reservation.reservationId },
    });
    expect(claimed.claimedByMembershipId).toEqual(firstResult.membershipId);
  });

  it("joining twice with the same token and user returns the same membership and creates no duplicate", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    const first = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected ok result");

    const second = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(second).toEqual({
      ok: true,
      tripId: trip.tripId,
      membershipId: first.membershipId,
      alreadyMember: true,
    });

    const count = await prisma.tripMembership.count({
      where: { tripId: trip.tripId, userId: joiner.id },
    });
    expect(count).toEqual(1);
  });

  it("the already-member path short-circuits before validation", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    await joinTrip({ token: trip.inviteToken, userId: joiner.id, displayName: "Juan", colorIndex: 0 });

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "   ",
      colorIndex: -1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");
    expect(result.alreadyMember).toBe(true);
  });

  it("returns a form error for an unknown token and creates nothing", async () => {
    const joiner = await createUser();
    const result = await joinTrip({
      token: `unknown-${randomUUID()}`,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex: 0,
    });
    expect(result).toEqual({
      ok: false,
      formError: "Esa invitación no existe o ya no está disponible.",
    });
  });

  it("rejects a blank display name and creates nothing", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "   ",
      colorIndex: 0,
    });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { displayName: "Poné cómo querés que te llamen." },
    });

    const count = await prisma.tripMembership.count({ where: { tripId: trip.tripId, userId: joiner.id } });
    expect(count).toEqual(0);
  });

  it.each([-1, AVATAR_COLOR_COUNT, 1.5])("rejects an out-of-range colorIndex %j", async (colorIndex) => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    const result = await joinTrip({
      token: trip.inviteToken,
      userId: joiner.id,
      displayName: "Juan",
      colorIndex,
    });
    expect(result).toEqual({ ok: false, fieldErrors: { colorIndex: "Elegí un color." } });
  });

  it("two concurrent joins by the same user result in exactly one membership", async () => {
    const admin = await createUser();
    const trip = await createTestTrip(admin.id);
    const joiner = await createUser();

    const [first, second] = await Promise.all([
      joinTrip({ token: trip.inviteToken, userId: joiner.id, displayName: "Juan", colorIndex: 0 }),
      joinTrip({ token: trip.inviteToken, userId: joiner.id, displayName: "Juan", colorIndex: 0 }),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const count = await prisma.tripMembership.count({
      where: { tripId: trip.tripId, userId: joiner.id },
    });
    expect(count).toEqual(1);
  });
});
