"use client";

import { useState } from "react";
import { AlertBanner } from "@/components/forms/AlertBanner";
import { Avatar } from "@/components/trip/Avatar";
import { SettleRow } from "@/components/trip/SettleRow";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/trips/constants";
import { formatMoney } from "@/lib/trips/format";
import type { TripCrewMember } from "@/lib/trips/membership";
import type { TripBalanceResult } from "@/lib/trips/balance";
import type { HistoricalSettledTransfer, SettleableTransfer, TripSettlement } from "@/lib/trips/settlement";
import { transferKey } from "@/lib/trips/transfer-key";
import { markTransferSettledAction } from "./actions";

export interface BalanceTabProps {
  tripId: string;
  members: TripCrewMember[];
  balance: TripBalanceResult;
  settlement: TripSettlement;
}

const SECTION_TITLE_CLASS = "m-0 mb-[var(--space-5)] text-[length:var(--text-base)] font-semibold text-text";
const EMPTY_STATE_CLASS = "m-0 text-center text-[length:var(--text-sm)] text-text-muted";

/** The per-person paid/consumed/net balance, the settle-up transfer list
 * (with its "Marcar como saldada" action, gated on the trip being
 * finished), and the #17-absorbed trip-wide totals. Everything but the
 * settled/not-settled flag is live, uncached — recomputed from the trip's
 * current expenses on every render, never a stored snapshot. */
export function BalanceTab({ tripId, members, balance, settlement }: BalanceTabProps) {
  const { currency, balances, totalSpend, categoryTotals, hasPendingExpenses } = balance;
  const { canSettle, historicalSettledTransfers } = settlement;
  const [transfers, setTransfers] = useState<SettleableTransfer[]>(settlement.transfers);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);

  const memberById = new Map(members.map((member) => [member.membershipId, member]));
  const money = (amount: number) => formatMoney(amount, currency);
  const nameFor = (membershipId: string) => memberById.get(membershipId)?.displayName ?? "?";

  if (totalSpend === 0) {
    return (
      <Card padding="lg">
        <p className={EMPTY_STATE_CLASS}>
          Todavía no cargaste ningún gasto. En cuanto sumes gastos, acá vas a ver el balance del grupo.
        </p>
      </Card>
    );
  }

  const isAllSettled = transfers.every((transfer) => transfer.settled);

  async function handleSettle(transfer: SettleableTransfer) {
    const key = transferKey(transfer);
    setSettlingKey(key);
    const { fromMembershipId, toMembershipId, amount } = transfer;
    const result = await markTransferSettledAction(tripId, { fromMembershipId, toMembershipId, amount });
    if (result.ok) {
      setTransfers((current) => current.map((t) => (transferKey(t) === key ? { ...t, settled: true } : t)));
    }
    setSettlingKey(null);
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      {hasPendingExpenses ? (
        <AlertBanner icon="clock">
          Hay gastos pendientes de ajuste — estos números pueden cambiar cuando llegue el resumen real.
        </AlertBanner>
      ) : null}

      <Card padding="lg">
        <h2 className={SECTION_TITLE_CLASS}>Balance</h2>
        <ul className="m-0 flex list-none flex-col gap-[var(--space-4)] p-0">
          {balances.map((personBalance) => {
            const member = memberById.get(personBalance.membershipId);
            const name = member?.displayName ?? "?";
            const netTone =
              personBalance.net > 0 ? "text-success" : personBalance.net < 0 ? "text-alert" : "text-text-muted";

            return (
              <li
                key={personBalance.membershipId}
                className="flex items-center gap-[var(--space-4)] border-b border-border pb-[var(--space-4)] last:border-b-0 last:pb-0"
              >
                <Avatar name={name} colorIndex={member?.colorIndex ?? 0} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-text">{name}</div>
                  <div className="text-[length:var(--text-xs)] text-text-muted">
                    Pagó {money(personBalance.paid)} · Consumió {money(personBalance.consumed)}
                  </div>
                </div>
                <div className={["font-mono text-[length:var(--text-sm)] font-semibold tabular-nums", netTone].join(" ")}>
                  {personBalance.net > 0 ? "+" : ""}
                  {money(personBalance.net)}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card padding="lg">
        <h2 className={SECTION_TITLE_CLASS}>Para saldar</h2>
        {isAllSettled ? (
          <p className={EMPTY_STATE_CLASS}>Todo saldado. Nadie le debe nada a nadie.</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-4)]">
            {transfers.map((transfer) => {
              const key = transferKey(transfer);
              return (
                <div key={key} className="flex items-center gap-[var(--space-3)]">
                  <SettleRow
                    className="flex-1"
                    from={{ name: nameFor(transfer.fromMembershipId), colorIndex: memberById.get(transfer.fromMembershipId)?.colorIndex }}
                    to={{ name: nameFor(transfer.toMembershipId), colorIndex: memberById.get(transfer.toMembershipId)?.colorIndex }}
                    amount={money(transfer.amount)}
                    done={transfer.settled}
                  />
                  {!transfer.settled ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!canSettle || settlingKey === key}
                      onClick={() => handleSettle(transfer)}
                    >
                      Marcar como saldada
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {historicalSettledTransfers.length > 0 ? (
          <div className="mt-[var(--space-5)] flex flex-col gap-[var(--space-3)] border-t border-dashed border-border pt-[var(--space-4)]">
            <p className="m-0 text-[length:var(--text-xs)] text-text-muted">
              Ya saldadas, pero el balance actual ya no las pide (los gastos cambiaron):
            </p>
            {historicalSettledTransfers.map((transfer: HistoricalSettledTransfer) => (
              <SettleRow
                key={transferKey(transfer)}
                from={{ name: nameFor(transfer.fromMembershipId), colorIndex: memberById.get(transfer.fromMembershipId)?.colorIndex }}
                to={{ name: nameFor(transfer.toMembershipId), colorIndex: memberById.get(transfer.toMembershipId)?.colorIndex }}
                amount={money(transfer.amount)}
                done
              />
            ))}
          </div>
        ) : null}
      </Card>

      <Card padding="lg">
        <h2 className={SECTION_TITLE_CLASS}>Total del viaje</h2>
        <div className="mb-[var(--space-5)] font-mono text-[length:var(--text-lg)] font-semibold tabular-nums text-text">
          {money(totalSpend)}
        </div>
        <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0 text-[length:var(--text-sm)]">
          {categoryTotals.map((entry) => (
            <li key={entry.category} className="flex items-center justify-between text-text">
              <span>{EXPENSE_CATEGORY_LABELS[entry.category]}</span>
              <span className="font-mono tabular-nums">{money(entry.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="lg">
        <h2 className={SECTION_TITLE_CLASS}>Costo final por persona</h2>
        <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0 text-[length:var(--text-sm)]">
          {balances.map((personBalance) => (
            <li key={personBalance.membershipId} className="flex items-center justify-between text-text">
              <span>{nameFor(personBalance.membershipId)}</span>
              <span className="font-mono tabular-nums">{money(personBalance.consumed)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
