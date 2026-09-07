// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { listUserTrips } from "@/lib/trips/list";

describe("listUserTrips", () => {
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
    const user = await prisma.user.create({
      data: { email, passwordHash: "irrelevant" },
    });
    createdUserIds.push(user.id);
    return user;
  }

  async function createTrip({
    userId,
    name,
    startDate,
    role = "admin",
  }: {
    userId: string;
    name: string;
    startDate: string;
    role?: "admin" | "participant";
  }) {
    const trip = await prisma.trip.create({
      data: {
        name,
        startDate: new Date(`${startDate}T00:00:00.000Z`),
        currency: "USD",
        memberships: {
          create: { userId, role, displayName: "Traveler", colorIndex: 0 },
        },
      },
    });
    createdTripIds.push(trip.id);
    return trip;
  }

  it("only returns trips the requesting user is a member of", async () => {
    const user = await createUser();
    const otherUser = await createUser();

    const myTrip = await createTrip({ userId: user.id, name: "Mine", startDate: "2026-12-01" });
    await createTrip({ userId: otherUser.id, name: "Not mine", startDate: "2026-12-02" });

    const result = await listUserTrips(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(myTrip.id);
  });

  it("includes a trip the user joined as a participant, not just ones they created", async () => {
    const user = await createUser();
    const trip = await createTrip({
      userId: user.id,
      name: "Joined trip",
      startDate: "2026-12-01",
      role: "participant",
    });

    const result = await listUserTrips(user.id);

    expect(result.map((t) => t.id)).toContain(trip.id);
  });

  it("sorts soonest-upcoming first, then past trips most-recent-first", async () => {
    const user = await createUser();
    const farFuture = await createTrip({ userId: user.id, name: "Far future", startDate: "2027-06-01" });
    const nearFuture = await createTrip({ userId: user.id, name: "Near future", startDate: "2026-10-01" });
    const recentPast = await createTrip({ userId: user.id, name: "Recent past", startDate: "2020-02-01" });
    const olderPast = await createTrip({ userId: user.id, name: "Older past", startDate: "2019-01-01" });

    const result = await listUserTrips(user.id);

    expect(result.map((t) => t.id)).toEqual([
      nearFuture.id,
      farFuture.id,
      recentPast.id,
      olderPast.id,
    ]);
  });

  it("includes every member's display name and color for the avatar group", async () => {
    const user = await createUser();
    const other = await createUser();
    const trip = await createTrip({ userId: user.id, name: "Crew trip", startDate: "2026-12-01" });
    await prisma.tripMembership.create({
      data: { tripId: trip.id, userId: other.id, role: "participant", displayName: "Otra", colorIndex: 2 },
    });

    const result = await listUserTrips(user.id);

    expect(result[0].members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Traveler", colorIndex: 0 }),
        expect.objectContaining({ name: "Otra", colorIndex: 2 }),
      ]),
    );
  });

  it("returns an empty list for a user with no trips", async () => {
    const user = await createUser();
    expect(await listUserTrips(user.id)).toEqual([]);
  });
});
