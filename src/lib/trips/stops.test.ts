// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import {
  addStop,
  removeStop,
  reorderStops,
  updateStopNights,
  cycleStopStatus,
  setLegTransport,
  getStopsForTrip,
} from "@/lib/trips/stops";

describe("trip stops", () => {
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

  async function createTestTrip() {
    const user = await createUser();
    const result = await createTrip({
      userId: user.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    if (!result.ok) throw new Error("failed to create trip");
    createdTripIds.push(result.tripId);
    return result.tripId;
  }

  it("addStop creates a stop with correct defaults", async () => {
    const tripId = await createTestTrip();

    const result = await addStop({
      tripId,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok result");

    expect(result.stop).toMatchObject({
      tripId,
      position: 1,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
      nights: 1,
      status: "thinking",
      transportMode: null,
    });
  });

  it("addStop increments position for subsequent stops", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });
    expect(stop1.ok && stop1.stop.position).toBe(1);

    const stop2 = await addStop({
      tripId,
      city: "Santiago",
      country: "Chile",
      latitude: -33.8688,
      longitude: -51.2093,
    });
    expect(stop2.ok && stop2.stop.position).toBe(2);

    const stop3 = await addStop({
      tripId,
      city: "Asunción",
      country: "Paraguay",
      latitude: -25.2637,
      longitude: -57.5759,
    });
    expect(stop3.ok && stop3.stop.position).toBe(3);
  });

  it("addStop rejects adding more than 10 stops", async () => {
    const tripId = await createTestTrip();

    // Add 10 stops
    for (let i = 0; i < 10; i++) {
      const result = await addStop({
        tripId,
        city: `City ${i}`,
        country: "Country",
        latitude: i,
        longitude: i,
      });
      expect(result.ok).toBe(true);
    }

    // 11th should fail
    const result = await addStop({
      tripId,
      city: "City 11",
      country: "Country",
      latitude: 11,
      longitude: 11,
    });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.formError).toContain("10");
  });

  it("removeStop deletes the stop and reindexes positions", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "City 1",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    const stop2 = await addStop({
      tripId,
      city: "City 2",
      country: "Country",
      latitude: 2,
      longitude: 2,
    });
    const stop3 = await addStop({
      tripId,
      city: "City 3",
      country: "Country",
      latitude: 3,
      longitude: 3,
    });

    if (!stop1.ok || !stop2.ok || !stop3.ok) throw new Error("failed to add stops");

    // Remove the middle stop
    const removeResult = await removeStop(tripId, stop2.stop.id);
    expect(removeResult.ok).toBe(true);
    if (!removeResult.ok) throw new Error("failed to remove stop");
    expect(removeResult.removedPosition).toBe(2);

    // Verify positions are reindexed
    const stops = await getStopsForTrip(tripId);
    expect(stops).toHaveLength(2);
    expect(stops[0].id).toBe(stop1.stop.id);
    expect(stops[0].position).toBe(1);
    expect(stops[1].id).toBe(stop3.stop.id);
    expect(stops[1].position).toBe(2);
  });

  it("removeStop rejects removing a stop from a different trip", async () => {
    const trip1 = await createTestTrip();
    const trip2 = await createTestTrip();

    const stop = await addStop({
      tripId: trip1,
      city: "City",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    if (!stop.ok) throw new Error("failed to add stop");

    const result = await removeStop(trip2, stop.stop.id);
    expect(result.ok).toBe(false);
  });

  it("reorderStops updates positions for multiple stops", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "City 1",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    const stop2 = await addStop({
      tripId,
      city: "City 2",
      country: "Country",
      latitude: 2,
      longitude: 2,
    });
    const stop3 = await addStop({
      tripId,
      city: "City 3",
      country: "Country",
      latitude: 3,
      longitude: 3,
    });

    if (!stop1.ok || !stop2.ok || !stop3.ok) throw new Error("failed to add stops");

    // Reorder: move stop3 to position 1
    const result = await reorderStops({
      tripId,
      positions: [
        { stopId: stop3.stop.id, newPosition: 1 },
        { stopId: stop1.stop.id, newPosition: 2 },
        { stopId: stop2.stop.id, newPosition: 3 },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to reorder");

    const stops = result.stops;
    expect(stops).toHaveLength(3);
    expect(stops[0].id).toBe(stop3.stop.id);
    expect(stops[0].position).toBe(1);
    expect(stops[1].id).toBe(stop1.stop.id);
    expect(stops[1].position).toBe(2);
    expect(stops[2].id).toBe(stop2.stop.id);
    expect(stops[2].position).toBe(3);
  });

  it("updateStopNights updates the nights field", async () => {
    const tripId = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "City",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    if (!stop.ok) throw new Error("failed to add stop");

    const result = await updateStopNights({
      tripId,
      stopId: stop.stop.id,
      nights: 5,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to update nights");
    expect(result.stop.nights).toBe(5);
  });

  it("updateStopNights rejects negative nights", async () => {
    const tripId = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "City",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    if (!stop.ok) throw new Error("failed to add stop");

    const result = await updateStopNights({
      tripId,
      stopId: stop.stop.id,
      nights: -1,
    });

    expect(result.ok).toBe(false);
  });

  it("cycleStopStatus cycles through all three statuses", async () => {
    const tripId = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "City",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    if (!stop.ok) throw new Error("failed to add stop");

    // Initial status is "thinking"
    expect(stop.stop.status).toBe("thinking");

    // Cycle to "urgent"
    let result = await cycleStopStatus(tripId, stop.stop.id);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to cycle status");
    expect(result.newStatus).toBe("urgent");

    // Cycle to "booked"
    result = await cycleStopStatus(tripId, stop.stop.id);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to cycle status");
    expect(result.newStatus).toBe("booked");

    // Cycle back to "thinking"
    result = await cycleStopStatus(tripId, stop.stop.id);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to cycle status");
    expect(result.newStatus).toBe("thinking");
  });

  it("setLegTransport sets the transport mode for a stop", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "City 1",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    const stop2 = await addStop({
      tripId,
      city: "City 2",
      country: "Country",
      latitude: 2,
      longitude: 2,
    });

    if (!stop1.ok || !stop2.ok) throw new Error("failed to add stops");

    // Set transport for leg into stop2
    const result = await setLegTransport({
      tripId,
      stopId: stop2.stop.id,
      mode: "flight",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("failed to set transport");
    expect(result.stop.transportMode).toBe("flight");
  });

  it("setLegTransport rejects transport for the first stop", async () => {
    const tripId = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "City",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });

    if (!stop.ok) throw new Error("failed to add stop");

    const result = await setLegTransport({
      tripId,
      stopId: stop.stop.id,
      mode: "flight",
    });

    expect(result.ok).toBe(false);
  });

  it("setLegTransport rejects invalid transport modes", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "City 1",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    const stop2 = await addStop({
      tripId,
      city: "City 2",
      country: "Country",
      latitude: 2,
      longitude: 2,
    });

    if (!stop1.ok || !stop2.ok) throw new Error("failed to add stops");

    const result = await setLegTransport({
      tripId,
      stopId: stop2.stop.id,
      mode: "invalid_mode",
    });

    expect(result.ok).toBe(false);
  });

  it("allows the same city to be added multiple times as separate stops", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });

    const stop2 = await addStop({
      tripId,
      city: "Buenos Aires",
      country: "Argentina",
      latitude: -34.6037,
      longitude: -58.3816,
    });

    expect(stop1.ok).toBe(true);
    expect(stop2.ok).toBe(true);
    if (!stop1.ok || !stop2.ok) throw new Error("failed to add stops");

    expect(stop1.stop.id).not.toBe(stop2.stop.id);
    expect(stop1.stop.position).toBe(1);
    expect(stop2.stop.position).toBe(2);
  });

  it("getStopsForTrip returns stops in position order", async () => {
    const tripId = await createTestTrip();

    const stop1 = await addStop({
      tripId,
      city: "City 1",
      country: "Country",
      latitude: 1,
      longitude: 1,
    });
    const stop2 = await addStop({
      tripId,
      city: "City 2",
      country: "Country",
      latitude: 2,
      longitude: 2,
    });
    const stop3 = await addStop({
      tripId,
      city: "City 3",
      country: "Country",
      latitude: 3,
      longitude: 3,
    });

    if (!stop1.ok || !stop2.ok || !stop3.ok) throw new Error("failed to add stops");

    const stops = await getStopsForTrip(tripId);
    expect(stops).toHaveLength(3);
    expect(stops[0].position).toBe(1);
    expect(stops[1].position).toBe(2);
    expect(stops[2].position).toBe(3);
  });
});
