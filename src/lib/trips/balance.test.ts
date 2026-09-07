// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import { addStop } from "@/lib/trips/stops";
import { createExpense } from "@/lib/trips/expenses";
import { getTripBalance } from "@/lib/trips/balance";

describe("getTripBalance", () => {
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];

  afterEach(async () => {
    if (createdTripIds.length) {
      // Expense.paidById has no onDelete: Cascade (only ExpenseUser.membershipId
      // does), so an expense blocks deleting its trip's memberships unless it's
      // cleared first.
      await prisma.expense.deleteMany({ where: { stop: { tripId: { in: createdTripIds } } } });
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

  /** A two-person trip: Ana (the admin createTrip makes) + Bea, added directly
   * since there's no lib helper yet for joining a second member outside the
   * real invite flow. */
  async function createTestTrip() {
    const ana = await createUser();
    const result = await createTrip({
      userId: ana.id,
      name: `Trip ${randomUUID()}`,
      startDate: "2026-10-12",
      currency: "USD",
    });
    if (!result.ok) throw new Error("expected ok result");
    createdTripIds.push(result.tripId);

    const anaMembership = await prisma.tripMembership.findFirstOrThrow({ where: { tripId: result.tripId } });

    const bea = await createUser();
    const beaMembership = await prisma.tripMembership.create({
      data: { tripId: result.tripId, userId: bea.id, role: "participant", displayName: "Bea", colorIndex: 1 },
    });

    return {
      tripId: result.tripId,
      anaMembershipId: anaMembership.id,
      beaMembershipId: beaMembership.id,
    };
  }

  it("returns zero balances and no transfers for a trip with no expenses", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTrip();

    const balance = await getTripBalance(tripId);

    expect(balance.totalSpend).toBe(0);
    expect(balance.transfers).toEqual([]);
    expect(balance.balances).toEqual([
      { membershipId: anaMembershipId, paid: 0, consumed: 0, net: 0 },
      { membershipId: beaMembershipId, paid: 0, consumed: 0, net: 0 },
    ]);
  });

  it("computes paid/consumed/net and the settle-up transfer across a stop's expenses", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "Lisboa",
      country: "Portugal",
      latitude: 38.7223,
      longitude: -9.1393,
    });
    if (!stop.ok) throw new Error("expected ok result");

    await createExpense({
      stopId: stop.stop.id,
      label: "Hotel",
      category: "alojamiento",
      paymentMethod: "tarjeta",
      originalAmount: 100,
      originalCurrency: "USD",
      paidById: anaMembershipId,
      userIds: [anaMembershipId, beaMembershipId],
    });

    const balance = await getTripBalance(tripId);

    expect(balance.currency).toBe("USD");
    expect(balance.totalSpend).toBe(100);
    expect(balance.balances).toEqual([
      { membershipId: anaMembershipId, paid: 100, consumed: 50, net: 50 },
      { membershipId: beaMembershipId, paid: 0, consumed: 50, net: -50 },
    ]);
    expect(balance.transfers).toEqual([
      { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 50 },
    ]);
    // Still unadjusted (adjustedAmount is only ever set via updateExpense) —
    // counted at face value, flagged as pending.
    expect(balance.hasPendingExpenses).toBe(true);
  });

  it("recomputes live across every stop, with no caching between calls", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTrip();

    const stop = await addStop({
      tripId,
      city: "Lisboa",
      country: "Portugal",
      latitude: 38.7223,
      longitude: -9.1393,
    });
    if (!stop.ok) throw new Error("expected ok result");

    await createExpense({
      stopId: stop.stop.id,
      label: "Hotel",
      category: "alojamiento",
      paymentMethod: "tarjeta",
      originalAmount: 100,
      originalCurrency: "USD",
      paidById: anaMembershipId,
      userIds: [anaMembershipId, beaMembershipId],
    });

    expect((await getTripBalance(tripId)).totalSpend).toBe(100);

    await createExpense({
      stopId: stop.stop.id,
      label: "Cena",
      category: "comida",
      paymentMethod: "efectivo",
      originalAmount: 20,
      originalCurrency: "USD",
      paidById: beaMembershipId,
      userIds: [anaMembershipId, beaMembershipId],
    });

    const balance = await getTripBalance(tripId);
    expect(balance.totalSpend).toBe(120);
    expect(balance.categoryTotals).toEqual([
      { category: "transporte", amount: 0 },
      { category: "alojamiento", amount: 100 },
      { category: "comida", amount: 20 },
      { category: "actividades", amount: 0 },
      { category: "otro", amount: 0 },
    ]);
  });
});
