"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Dialog } from "@/components/core/Dialog";
import { Checkbox, Input, Select } from "@/components/forms";
import type { BookingDetail } from "@/lib/trips/bookings";
import type { TripMemberSummary } from "@/lib/trips/membership";
import { createBookingAction, updateBookingAction } from "./actions";

export interface SumarReservaDialogProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  stopId: string;
  tripMembers: TripMemberSummary[];
  /** Present → editing that booking; absent → creating a new one. */
  editing?: BookingDetail;
  onSaved: (booking: BookingDetail) => void;
}

interface FieldErrors {
  label?: string;
  reservedById?: string;
  paidById?: string;
  userIds?: string;
}

/**
 * "Sumar reserva" — the same dialog for adding a new booking and editing an
 * existing one (the design's dialog already doubles as both). "Quién lo
 * usa" has no design precedent (the picker doesn't exist there yet) and is
 * invented here in the same voice.
 */
export function SumarReservaDialog({
  open,
  onClose,
  tripId,
  stopId,
  tripMembers,
  editing,
  onSaved,
}: SumarReservaDialogProps) {
  const [label, setLabel] = useState("");
  const [reservedById, setReservedById] = useState("");
  const [paidById, setPaidById] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Reset the form fields every time the dialog opens — for a new booking,
  // that's a blank label and "everyone checked"; for an edit, that's the
  // booking's current values. Re-running whenever `editing` changes too
  // covers switching straight from editing one booking to another.
  useEffect(() => {
    if (!open) return;

    setFieldErrors({});
    setFormError(undefined);

    if (editing) {
      setLabel(editing.label);
      setReservedById(editing.reservedById);
      setPaidById(editing.paidById);
      setUserIds(editing.userIds);
    } else {
      setLabel("");
      setReservedById(tripMembers[0]?.id ?? "");
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
    setSubmitting(true);
    setFieldErrors({});
    setFormError(undefined);

    const input = { label, reservedById, paidById, userIds };

    if (editing) {
      const result = await updateBookingAction(tripId, stopId, editing.id, input);
      setSubmitting(false);

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError);
        return;
      }

      onSaved({
        id: editing.id,
        stopId,
        label: label.trim(),
        reservedById,
        paidById,
        userIds,
        vouchers: editing.vouchers,
      });
      return;
    }

    const result = await createBookingAction(tripId, stopId, input);
    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError);
      return;
    }

    onSaved({
      id: result.bookingId,
      stopId,
      label: label.trim(),
      reservedById,
      paidById,
      userIds,
      vouchers: [],
    });
  }

  const memberOptions = tripMembers.map((member) => ({ value: member.id, label: member.displayName }));

  return (
    <Dialog open={open} onClose={onClose} title="Sumar reserva">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-6)]">
        <Input
          label="Nombre de la reserva"
          placeholder="Hotel, vuelo, excursión…"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          error={fieldErrors.label}
        />
        <Select
          label="Quién reservó"
          options={memberOptions}
          value={reservedById}
          onChange={(event) => setReservedById(event.target.value)}
          error={fieldErrors.reservedById}
        />
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
