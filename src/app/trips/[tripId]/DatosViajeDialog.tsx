"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Dialog } from "@/components/core/Dialog";
import { Icon } from "@/components/core/Icon";
import { Input } from "@/components/forms";
import { FOCUS_RING } from "@/lib/styles";
import { START_DATE_LOCKED_MESSAGE } from "@/lib/trips/constants";
import { updateTripAction } from "./actions";

export interface DatosViajeDialogProps {
  tripId: string;
  initialName: string;
  initialStartDate: string; // "YYYY-MM-DD"
  canEditStartDate: boolean;
}

/**
 * The trip's editable title/meta row: shows the current name, and opens
 * "Datos del viaje" (rename + start date) via a pencil trigger next to it.
 * Owns its own display state after a save, the same way InvitePanel owns
 * pendingReservations — no full-page refetch needed for the header to
 * reflect a rename immediately.
 */
export function DatosViajeDialog({
  tripId,
  initialName,
  initialStartDate,
  canEditStartDate,
}: DatosViajeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [nameInput, setNameInput] = useState(initialName);
  const [startDateInput, setStartDateInput] = useState(initialStartDate);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; startDate?: string }>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function handleOpen() {
    setNameInput(name);
    setStartDateInput(startDate);
    setFieldErrors({});
    setFormError(undefined);
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(undefined);

    const result = await updateTripAction(tripId, { name: nameInput, startDate: startDateInput });
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError);
      return;
    }

    setName(result.name);
    setStartDate(result.startDate);
    setOpen(false);
  }

  return (
    <>
      <div className="flex flex-col gap-[var(--space-2)]">
        <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
          Tu viaje
        </span>
        <div className="flex items-center gap-[var(--space-3)]">
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            {name}
          </h1>
          <button
            type="button"
            onClick={handleOpen}
            aria-label="Editar datos del viaje"
            className={["rounded-sm text-text-muted hover:text-text", FOCUS_RING].join(" ")}
          >
            <Icon name="pencil" size={16} />
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Datos del viaje">
        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-6)]">
          <Input
            label="Nombre del viaje"
            name="name"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            error={fieldErrors.name}
          />
          <Input
            label="Arranca el"
            name="startDate"
            type="date"
            icon="calendar"
            value={startDateInput}
            onChange={(event) => setStartDateInput(event.target.value)}
            error={fieldErrors.startDate}
            disabled={!canEditStartDate}
            hint={!canEditStartDate ? START_DATE_LOCKED_MESSAGE : undefined}
          />
          {formError ? <p className="m-0 text-[length:var(--text-xs)] text-alert">{formError}</p> : null}
          <Button type="submit" size="lg" fullWidth disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </Dialog>
    </>
  );
}
