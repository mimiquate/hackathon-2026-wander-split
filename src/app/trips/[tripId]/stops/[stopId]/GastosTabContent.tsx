"use client";

import { useState } from "react";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { StatusChip } from "@/components/trip/StatusChip";
import { FOCUS_RING } from "@/lib/styles";
import { formatMoney } from "@/lib/trips/format";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS, type ExpenseCategory, type PaymentMethod } from "@/lib/trips/constants";
import type { ExpenseDetail } from "@/lib/trips/expenses";
import type { TripMemberSummary } from "@/lib/trips/membership";

export interface GastosTabContentProps {
  expenses: ExpenseDetail[];
  tripMembers: TripMemberSummary[];
  tripCurrency: string;
}

function findMember(members: TripMemberSummary[], id: string): TripMemberSummary | undefined {
  return members.find((member) => member.id === id);
}

function memberName(members: TripMemberSummary[], id: string): string {
  return findMember(members, id)?.displayName ?? "Alguien del viaje";
}

/** The currently-relevant amount for a row: the adjusted amount (in the
 * trip's currency) once set, otherwise the original logged amount. */
function displayAmount(expense: ExpenseDetail, tripCurrency: string): string {
  return expense.adjustedAmount != null
    ? formatMoney(expense.adjustedAmount, tripCurrency)
    : formatMoney(expense.originalAmount, expense.originalCurrency);
}

/**
 * The Gastos tab: real expenses (#14), replacing #10's inert placeholder.
 * Read-only for now — Phase 3 adds "Agregar gasto," Phase 4 adds the
 * adjustment flow and removal.
 */
export function GastosTabContent({ expenses, tripMembers, tripCurrency }: GastosTabContentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return (
      <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
        Todavía no cargaste ningún gasto acá.
      </p>
    );
  }

  return (
    <ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
      {expenses.map((expense) => {
        const isSelected = expense.id === selectedId;
        const isPending = expense.adjustedAmount == null;

        return (
          <li key={expense.id} className="flex flex-col gap-[var(--space-3)]">
            <button
              type="button"
              onClick={() => setSelectedId(isSelected ? null : expense.id)}
              aria-expanded={isSelected}
              className={[
                "flex w-full items-center justify-between gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors max-md:min-h-tap-min",
                isSelected ? "bg-primary text-text-on-primary" : "bg-surface-2 text-text hover:bg-surface",
                FOCUS_RING,
              ].join(" ")}
            >
              <span className="flex flex-col gap-[var(--space-1)]">
                <span className="text-[length:var(--text-sm)] font-medium">{expense.label}</span>
                <span className="font-mono text-[length:var(--text-xs)] opacity-80">
                  {EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory] ?? expense.category} · pagó{" "}
                  {memberName(tripMembers, expense.paidById)}
                </span>
              </span>
              <span className="flex flex-col items-end gap-[var(--space-1)]">
                <span className="text-[length:var(--text-sm)] font-semibold">
                  {displayAmount(expense, tripCurrency)}
                </span>
                {isPending ? <StatusChip state="urgent">Pendiente de ajuste</StatusChip> : null}
              </span>
            </button>

            {isSelected ? (
              <div className="flex flex-col gap-[var(--space-4)] rounded-lg bg-surface-2 px-[var(--space-4)] py-[var(--space-4)]">
                <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                      Categoría
                    </span>
                    <span className="text-[length:var(--text-sm)] text-text">
                      {EXPENSE_CATEGORY_LABELS[expense.category as ExpenseCategory] ?? expense.category}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                      Cómo se pagó
                    </span>
                    <span className="text-[length:var(--text-sm)] text-text">
                      {PAYMENT_METHOD_LABELS[expense.paymentMethod as PaymentMethod] ?? expense.paymentMethod}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                      Monto original
                    </span>
                    <span className="text-[length:var(--text-sm)] text-text">
                      {formatMoney(expense.originalAmount, expense.originalCurrency)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                      Monto ajustado
                    </span>
                    {expense.adjustedAmount == null ? (
                      <StatusChip state="urgent">Pendiente de ajuste</StatusChip>
                    ) : (
                      <span className="text-[length:var(--text-sm)] text-text">
                        {formatMoney(expense.adjustedAmount, tripCurrency)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-[var(--space-1)]">
                    <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                      Quién pagó
                    </span>
                    <span className="text-[length:var(--text-sm)] text-text">
                      {memberName(tripMembers, expense.paidById)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-[var(--space-2)]">
                  <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                    Quién lo usa
                  </span>
                  <AvatarGroup
                    people={expense.userIds.map((id) => {
                      const member = findMember(tripMembers, id);
                      return {
                        name: member?.displayName ?? "Alguien del viaje",
                        colorIndex: member?.colorIndex ?? 0,
                      };
                    })}
                    size="sm"
                  />
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
