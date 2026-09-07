"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Input } from "@/components/forms";
import { StatusChip } from "@/components/trip/StatusChip";
import type { ExpenseDetail } from "@/lib/trips/expenses";
import { adjustExpenseAmountAction } from "./actions";

export interface AdjustAmountControlProps {
  tripId: string;
  stopId: string;
  expense: ExpenseDetail;
  onAdjusted: (adjustedAmount: number) => void;
}

/**
 * The adjustment flow (Phase 4): always-editable, so "changing an
 * already-adjusted amount again just overwrites" needs no separate edit
 * mode. Labeled "Lo que cobró el banco" for a card-paid expense, matching
 * the design's copy, and a plain generic label for cash — same field and
 * flow either way, only the label differs.
 */
export function AdjustAmountControl({ tripId, stopId, expense, onAdjusted }: AdjustAmountControlProps) {
  const [value, setValue] = useState(expense.adjustedAmount != null ? String(expense.adjustedAmount) : "");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const label = expense.paymentMethod === "tarjeta" ? "Lo que cobró el banco" : "Monto ajustado";
  const isPending = expense.adjustedAmount == null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError(undefined);

    const result = await adjustExpenseAmountAction(tripId, stopId, expense.id, Number(value));
    setSaving(false);

    if (!result.ok) {
      setError(result.fieldErrors?.adjustedAmount ?? result.formError);
      return;
    }

    onAdjusted(Number(value));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-3)] rounded-2xl bg-surface px-[var(--space-5)] py-[var(--space-4)]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <span className="text-[length:var(--text-sm)] font-medium text-text">{label}</span>
        {isPending ? <StatusChip state="urgent">Pendiente de ajuste</StatusChip> : null}
      </div>
      <div className="flex items-end gap-[var(--space-3)]">
        <div className="flex-1">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            mono
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" disabled={saving || !value.trim()}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
