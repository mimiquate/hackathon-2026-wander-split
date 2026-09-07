// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createTrip } from "@/lib/trips/create";
import { addStop } from "@/lib/trips/stops";
import { createExpense, updateExpense } from "@/lib/trips/expenses";
import { getTripBalance } from "@/lib/trips/balance";
import { getTripSettlement, markTransferSettled } from "@/lib/trips/settlement";

describe("settlement", () => {
  const createdUserIds: string[] = [];
  const createdTripIds: string[] = [];

  afterEach(async () => {
    if (createdTripIds.length) {
      await prisma.settledTransfer.deleteMany({ where: { tripId: { in: createdTripIds } } });
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

  /** A two-person trip with one stop and one $100 hotel expense split evenly
   * (Ana paid, both used it) — the live transfer list is always exactly
   * "Bea pays Ana $50" unless a test adjusts the expense. */
  async function createTestTripWithExpense() {
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

    const stop = await addStop({ tripId: result.tripId, city: "Lisboa", country: "Portugal", latitude: 1, longitude: 1 });
    if (!stop.ok) throw new Error("expected ok result");

    const expense = await createExpense({
      stopId: stop.stop.id,
      label: "Hotel",
      category: "alojamiento",
      paymentMethod: "tarjeta",
      originalAmount: 100,
      originalCurrency: "USD",
      paidById: anaMembership.id,
      userIds: [anaMembership.id, beaMembership.id],
    });
    if (!expense.ok) throw new Error("expected ok result");

    return {
      tripId: result.tripId,
      stopId: stop.stop.id,
      expenseId: expense.expenseId,
      anaMembershipId: anaMembership.id,
      beaMembershipId: beaMembership.id,
    };
  }

  it("canSettle is false and marking a transfer settled is rejected before the trip is finished", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTripWithExpense();

    const balance = await getTripBalance(tripId);
    const settlement = await getTripSettlement(tripId, balance.transfers);

    expect(settlement.canSettle).toBe(false);
    expect(settlement.transfers).toEqual([
      { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 50, settled: false },
    ]);

    const result = await markTransferSettled(tripId, {
      fromMembershipId: beaMembershipId,
      toMembershipId: anaMembershipId,
      amount: 50,
    });

    expect(result).toEqual({ ok: false, formError: expect.any(String) });
    expect(await prisma.settledTransfer.findMany({ where: { tripId } })).toEqual([]);
  });

  it("marks a transfer settled once finished, and it survives recomputing the live balance", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTripWithExpense();
    await prisma.trip.update({ where: { id: tripId }, data: { finishedAt: new Date() } });

    const transfer = { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 50 };
    expect(await markTransferSettled(tripId, transfer)).toEqual({ ok: true });

    // Recompute from scratch, as if reopening the tab.
    const balance = await getTripBalance(tripId);
    const settlement = await getTripSettlement(tripId, balance.transfers);

    expect(settlement.canSettle).toBe(true);
    expect(settlement.transfers).toEqual([{ ...transfer, settled: true }]);
    expect(settlement.historicalSettledTransfers).toEqual([]);
  });

  it("marking the same transfer settled twice is idempotent", async () => {
    const { tripId, anaMembershipId, beaMembershipId } = await createTestTripWithExpense();
    await prisma.trip.update({ where: { id: tripId }, data: { finishedAt: new Date() } });

    const transfer = { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 50 };
    expect(await markTransferSettled(tripId, transfer)).toEqual({ ok: true });
    expect(await markTransferSettled(tripId, transfer)).toEqual({ ok: true });

    expect(await prisma.settledTransfer.findMany({ where: { tripId } })).toHaveLength(1);
  });

  it("surfaces a settled transfer as historical once it no longer matches any live transfer", async () => {
    const { tripId, stopId, expenseId, anaMembershipId, beaMembershipId } = await createTestTripWithExpense();
    await prisma.trip.update({ where: { id: tripId }, data: { finishedAt: new Date() } });

    await markTransferSettled(tripId, { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 50 });

    // A late adjustment changes the hotel's relevant amount from $100 to $40,
    // so the live suggestion is now "$20", not the settled "$50".
    await updateExpense({ stopId, expenseId, adjustedAmount: 40 });

    const balance = await getTripBalance(tripId);
    const settlement = await getTripSettlement(tripId, balance.transfers);

    expect(settlement.transfers).toEqual([
      { fromMembershipId: beaMembershipId, toMembershipId: anaMembershipId, amount: 20, settled: false },
    ]);
    expect(settlement.historicalSettledTransfers).toEqual([
      {
        fromMembershipId: beaMembershipId,
        toMembershipId: anaMembershipId,
        amount: 50,
        settledAt: expect.any(Date),
      },
    ]);
  });
});
