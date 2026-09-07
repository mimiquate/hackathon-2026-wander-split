import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/trips/constants";
import { getTripMembers } from "@/lib/trips/membership";
import { getStopsForTrip } from "@/lib/trips/stops";
import { getExpensesForStop } from "@/lib/trips/expenses";

// Money only ever moves through this module as integer cents — every dollar
// amount coming in or going out is converted at the boundary (toCents /
// fromCents) so no float remainder ever reaches the transfer math.
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

/** The subset of #14's ExpenseDetail this calculation reads. An
 * ExpenseDetail can be passed directly — this is a structural subset, not a
 * separate record type. */
export interface BalanceExpense {
  category: string;
  originalAmount: number;
  adjustedAmount: number | null;
  paidById: string;
  userIds: string[];
}

export interface PersonBalance {
  membershipId: string;
  /** What this person paid, across every expense, regardless of who used it. */
  paid: number;
  /** This person's even share of every expense they're listed as using —
   * the same number #17's "final cost per person" surfaces on its own. */
  consumed: number;
  /** paid minus consumed. Positive means the group owes this person. */
  net: number;
}

export interface Transfer {
  fromMembershipId: string;
  toMembershipId: string;
  amount: number;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  amount: number;
}

export interface TripBalance {
  balances: PersonBalance[];
  transfers: Transfer[];
  totalSpend: number;
  categoryTotals: CategoryTotal[];
  /** True when any expense counted above still has a null adjustedAmount —
   * Phase 2's visible "still pending" note reads this instead of re-scanning
   * every expense itself. */
  hasPendingExpenses: boolean;
}

function relevantAmountCents(expense: BalanceExpense): number {
  return toCents(expense.adjustedAmount ?? expense.originalAmount);
}

/** Splits `totalCents` evenly across `userIds`, handing any leftover cent(s)
 * to the first person(s) in `userIds` once sorted — sorting first makes the
 * split deterministic regardless of the order callers happen to pass, and
 * the shares always sum back to `totalCents` exactly. */
function splitCents(totalCents: number, userIds: string[]): Map<string, number> {
  const sortedIds = [...userIds].sort();
  const share = Math.floor(totalCents / sortedIds.length);
  const remainder = totalCents - share * sortedIds.length;

  const shares = new Map<string, number>();
  sortedIds.forEach((id, index) => {
    shares.set(id, share + (index < remainder ? 1 : 0));
  });
  return shares;
}

/** Repeatedly matches the largest creditor with the largest debtor,
 * transferring min(their two amounts) and re-picking until every balance is
 * zeroed — the same greedy heuristic apps like Splitwise use, not a
 * provably-minimal solver. Produces at most crew-size-minus-one transfers. */
function calculateTransfers(netCentsByMember: Map<string, number>): Transfer[] {
  let creditors = Array.from(netCentsByMember)
    .filter(([, net]) => net > 0)
    .map(([membershipId, amount]) => ({ membershipId, amount }));
  let debtors = Array.from(netCentsByMember)
    .filter(([, net]) => net < 0)
    .map(([membershipId, amount]) => ({ membershipId, amount: -amount }));

  const byLargestFirst = (a: { membershipId: string; amount: number }, b: { membershipId: string; amount: number }) =>
    b.amount - a.amount || a.membershipId.localeCompare(b.membershipId);

  const transfers: Transfer[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byLargestFirst);
    debtors.sort(byLargestFirst);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const amountCents = Math.min(creditor.amount, debtor.amount);

    transfers.push({
      fromMembershipId: debtor.membershipId,
      toMembershipId: creditor.membershipId,
      amount: fromCents(amountCents),
    });

    creditor.amount -= amountCents;
    debtor.amount -= amountCents;
    creditors = creditors.filter((c) => c.amount > 0);
    debtors = debtors.filter((d) => d.amount > 0);
  }

  return transfers;
}

/** The pure #15 calculation: a trip's crew + expenses in, everyone's
 * paid/consumed/net balance, a settle-up transfer list, and the trip-wide
 * totals #17 folded in, out. No I/O — callers gather the crew's membership
 * ids and every stop's expenses first. */
export function calculateTripBalance(crewMembershipIds: string[], expenses: BalanceExpense[]): TripBalance {
  const paidCents = new Map<string, number>(crewMembershipIds.map((id) => [id, 0]));
  const consumedCents = new Map<string, number>(crewMembershipIds.map((id) => [id, 0]));
  const categoryTotalCents = new Map<ExpenseCategory, number>(EXPENSE_CATEGORIES.map((category) => [category, 0]));
  let hasPendingExpenses = false;

  for (const expense of expenses) {
    const amountCents = relevantAmountCents(expense);
    if (expense.adjustedAmount === null) hasPendingExpenses = true;

    paidCents.set(expense.paidById, (paidCents.get(expense.paidById) ?? 0) + amountCents);

    const shares = splitCents(amountCents, expense.userIds);
    for (const [membershipId, shareCents] of shares) {
      consumedCents.set(membershipId, (consumedCents.get(membershipId) ?? 0) + shareCents);
    }

    const category = expense.category as ExpenseCategory;
    categoryTotalCents.set(category, (categoryTotalCents.get(category) ?? 0) + amountCents);
  }

  const netCents = new Map<string, number>(
    crewMembershipIds.map((id) => [id, (paidCents.get(id) ?? 0) - (consumedCents.get(id) ?? 0)]),
  );

  const balances: PersonBalance[] = crewMembershipIds.map((membershipId) => ({
    membershipId,
    paid: fromCents(paidCents.get(membershipId) ?? 0),
    consumed: fromCents(consumedCents.get(membershipId) ?? 0),
    net: fromCents(netCents.get(membershipId) ?? 0),
  }));

  const totalSpendCents = Array.from(categoryTotalCents.values()).reduce((sum, amount) => sum + amount, 0);

  return {
    balances,
    transfers: calculateTransfers(netCents),
    totalSpend: fromCents(totalSpendCents),
    categoryTotals: EXPENSE_CATEGORIES.map((category) => ({
      category,
      amount: fromCents(categoryTotalCents.get(category) ?? 0),
    })),
    hasPendingExpenses,
  };
}

export interface TripBalanceResult extends TripBalance {
  /** The trip's own currency (Trip.currency) — every figure above is
   * formatted against this, per #15's face-value/no-conversion rule. */
  currency: string;
}

/** Gathers a trip's crew and every stop's expenses, then runs the pure
 * calculation above. Always recomputed fresh — nothing here is cached, per
 * #15's "live, uncached math" rule. */
export async function getTripBalance(tripId: string): Promise<TripBalanceResult> {
  const [trip, members, stops] = await Promise.all([
    prisma.trip.findUniqueOrThrow({ where: { id: tripId }, select: { currency: true } }),
    getTripMembers(tripId),
    getStopsForTrip(tripId),
  ]);

  const expensesByStop = await Promise.all(stops.map((stop) => getExpensesForStop(stop.id)));

  return {
    ...calculateTripBalance(
      members.map((member) => member.id),
      expensesByStop.flat(),
    ),
    currency: trip.currency,
  };
}
