import { prisma } from "@/lib/prisma";
import type { Transfer } from "@/lib/trips/balance";
import { transferKey } from "@/lib/trips/transfer-key";

export interface SettleableTransfer extends Transfer {
  settled: boolean;
}

/** A settled record that no longer matches any of the live transfer list's
 * suggestions — the underlying expenses changed enough that this exact
 * debtor/creditor/amount triple isn't owed anymore. Kept visible rather
 * than dropped, per #15's Phase 3 acceptance criteria. */
export interface HistoricalSettledTransfer {
  fromMembershipId: string;
  toMembershipId: string;
  amount: number;
  settledAt: Date;
}

export interface TripSettlement {
  transfers: SettleableTransfer[];
  historicalSettledTransfers: HistoricalSettledTransfer[];
  /** Whether "Marcar como saldada" is usable at all — gated on the trip
   * being finished (see Trip.finishedAt's doc comment: a stand-in for #16,
   * which hasn't shipped yet). */
  canSettle: boolean;
}

/** Enriches Phase 1's live transfer list with which ones are already
 * settled, and surfaces any settled record that no longer matches a live
 * transfer as historical instead of silently dropping it. */
export async function getTripSettlement(tripId: string, liveTransfers: Transfer[]): Promise<TripSettlement> {
  const [trip, settledRows] = await Promise.all([
    prisma.trip.findUniqueOrThrow({ where: { id: tripId }, select: { finishedAt: true } }),
    prisma.settledTransfer.findMany({ where: { tripId } }),
  ]);

  const settledKeys = new Set(settledRows.map(transferKey));
  const liveKeys = new Set(liveTransfers.map(transferKey));

  return {
    transfers: liveTransfers.map((transfer) => ({ ...transfer, settled: settledKeys.has(transferKey(transfer)) })),
    historicalSettledTransfers: settledRows
      .filter((row) => !liveKeys.has(transferKey(row)))
      .map((row) => ({
        fromMembershipId: row.fromMembershipId,
        toMembershipId: row.toMembershipId,
        amount: row.amount,
        settledAt: row.settledAt,
      })),
    canSettle: trip.finishedAt !== null,
  };
}

export type MarkTransferSettledResult = { ok: true } | { ok: false; formError: string };

/** Persists one transfer as settled. Rejects (and persists nothing) unless
 * the trip is finished — re-verified here, not just trusted from the
 * client, same defense-in-depth this repo applies elsewhere. */
export async function markTransferSettled(
  tripId: string,
  transfer: { fromMembershipId: string; toMembershipId: string; amount: number },
): Promise<MarkTransferSettledResult> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { finishedAt: true } });
  if (!trip) {
    return { ok: false, formError: "El viaje no existe." };
  }
  if (!trip.finishedAt) {
    return { ok: false, formError: "Todavía no se puede saldar: el viaje no está finalizado." };
  }

  await prisma.settledTransfer.upsert({
    where: {
      tripId_fromMembershipId_toMembershipId_amount: {
        tripId,
        fromMembershipId: transfer.fromMembershipId,
        toMembershipId: transfer.toMembershipId,
        amount: transfer.amount,
      },
    },
    create: { tripId, ...transfer },
    update: {},
  });

  return { ok: true };
}
