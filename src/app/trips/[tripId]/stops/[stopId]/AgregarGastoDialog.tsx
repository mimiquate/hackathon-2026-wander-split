"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Dialog } from "@/components/core/Dialog";
import { Checkbox, Input, Select } from "@/components/forms";
import { FOCUS_RING } from "@/lib/styles";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CURRENCIES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/trips/constants";
import type { ExpenseDetail } from "@/lib/trips/expenses";
import type { TripMemberSummary } from "@/lib/trips/membership";
import { createExpenseAction, updateExpenseAction } from "./actions";

export interface AgregarGastoDialogProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  stopId: string;
  tripMembers: TripMemberSummary[];
  /** Present → editing that expense's non-adjustment fields; absent → creating a new one. */
  editing?: ExpenseDetail;
  onSaved: (expense: ExpenseDetail) => void;
}

interface FieldErrors {
  label?: string;
  category?: string;
  paymentMethod?: string;
  originalAmount?: string;
  originalCurrency?: string;
  paidById?: string;
  userIds?: string;
}

const CATEGORY_OPTIONS = EXPENSE_CATEGORIES.map((category) => ({
  value: category,
  label: EXPENSE_CATEGORY_LABELS[category],
}));

const CURRENCY_OPTIONS = EXPENSE_CURRENCIES.map((currency) => ({ value: currency, label: currency }));

/**
 * "Agregar gasto" — the same dialog for adding a new expense and editing an
 * existing one's non-adjustment fields (the adjusted amount gets its own
 * flow in Phase 4). Mirrors SumarReservaDialog's (#12/#13) shape.
 */
export function AgregarGastoDialog({
  open,
  onClose,
  tripId,
  stopId,
  tripMembers,
  editing,
  onSaved,
}: AgregarGastoDialogProps) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [originalAmount, setOriginalAmount] = useState("");
  const [originalCurrency, setOriginalCurrency] = useState<string>(EXPENSE_CURRENCIES[0]);
  // Unset by default — the user must explicitly pick one before saving,
  // since it decides which of #16's adjustment paths the expense falls
  // into later.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paidById, setPaidById] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFieldErrors({});
    setFormError(undefined);

    if (editing) {
      setLabel(editing.label);
      setCategory(editing.category as ExpenseCategory);
      setOriginalAmount(String(editing.originalAmount));
      setOriginalCurrency(editing.originalCurrency);
      setPaymentMethod(editing.paymentMethod as PaymentMethod);
      setPaidById(editing.paidById);
      setUserIds(editing.userIds);
    } else {
      setLabel("");
      setCategory(EXPENSE_CATEGORIES[0]);
      setOriginalAmount("");
      setOriginalCurrency(EXPENSE_CURRENCIES[0]);
      setPaymentMethod("");
      setPaidById(tripMembers[0]?.id ?? "");
      setUserIds(tripMembers.map((member) => member.id));
    }
  }, [open, editing, tripMembers]);

  function toggleUser(memberId: string) {
    setUserIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentMethod) {
      setFieldErrors({ paymentMethod: "Elegí cómo se pagó." });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(undefined);

    const input = {
      label,
      category,
      paymentMethod,
      originalAmount: Number(originalAmount),
      originalCurrency,
      paidById,
      userIds,
    };

    if (editing) {
      const result = await updateExpenseAction(tripId, stopId, editing.id, input);
      setSubmitting(false);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError);
        return;
      }

      onSaved({ ...editing, ...input, label: label.trim() });
      return;
    }

    const result = await createExpenseAction(tripId, stopId, input);
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError);
      return;
    }

    onSaved({
      id: result.expenseId,
      stopId,
      ...input,
      label: label.trim(),
      adjustedAmount: null,
    });
  }

  const memberOptions = tripMembers.map((member) => ({ value: member.id, label: member.displayName }));

  return (
    <Dialog open={open} onClose={onClose} title="Agregar gasto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-6)]">
        <Input
          label="Nombre del gasto"
          placeholder="Cena, taxi, entradas…"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={fieldErrors.label}
        />
        <Select
          label="Categoría"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
          error={fieldErrors.category}
        />
        <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
          <Input
            label="Monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            mono
            value={originalAmount}
            onChange={(event) => setOriginalAmount(event.target.value)}
            error={fieldErrors.originalAmount}
          />
          <Select
            label="Moneda"
            options={CURRENCY_OPTIONS}
            value={originalCurrency}
            onChange={(event) => setOriginalCurrency(event.target.value)}
            error={fieldErrors.originalCurrency}
          />
        </div>
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="text-[length:var(--text-sm)] font-bold text-text">Cómo se pagó</span>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                aria-pressed={paymentMethod === method}
                className={[
                  "min-h-[var(--tap-min)] rounded-pill px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold",
                  paymentMethod === method ? "bg-primary text-text-on-primary" : "bg-surface text-text-muted hover:text-text",
                  FOCUS_RING,
                ].join(" ")}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </button>
            ))}
          </div>
          {fieldErrors.paymentMethod ? (
            <p className="m-0 text-[length:var(--text-xs)] text-alert">{fieldErrors.paymentMethod}</p>
          ) : null}
        </div>
        <Select
          label="Quién pagó"
          options={memberOptions}
          value={paidById}
          onChange={(event) => setPaidById(event.target.value)}
          error={fieldErrors.paidById}
        />
        <div className="flex flex-col gap-[var(--space-3)]">
          <span className="text-[length:var(--text-sm)] font-bold text-text">Quién lo usa</span>
          <div className="flex flex-col gap-[var(--space-1)]">
            {tripMembers.map((member) => (
              <Checkbox
                key={member.id}
                label={member.displayName}
                checked={userIds.includes(member.id)}
                onChange={() => toggleUser(member.id)}
              />
            ))}
          </div>
          {fieldErrors.userIds ? (
            <p className="m-0 text-[length:var(--text-xs)] text-alert">{fieldErrors.userIds}</p>
          ) : null}
        </div>
        {formError ? <p className="m-0 text-[length:var(--text-xs)] text-alert">{formError}</p> : null}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </Dialog>
  );
}
