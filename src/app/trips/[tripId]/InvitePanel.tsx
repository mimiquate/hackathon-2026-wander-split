"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/core/Button";
import { Icon } from "@/components/core/Icon";
import { Input } from "@/components/forms";
import { CrewGrid } from "@/components/trip/CrewGrid";
import type { TripCrewMember } from "@/lib/trips/membership";
import type { PendingCrewReservation } from "@/lib/trips/invite";
import { reserveInviteEmailAction } from "./actions";

export interface InvitePanelProps {
  tripId: string;
  inviteUrl: string;
  members: TripCrewMember[];
  initialPendingReservations: PendingCrewReservation[];
}

export function InvitePanel({
  tripId,
  inviteUrl,
  members,
  initialPendingReservations,
}: InvitePanelProps) {
  const [pendingReservations, setPendingReservations] = useState(initialPendingReservations);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // Clipboard access can be denied (permissions, insecure context, an
      // unfocused page) — leave the button as "Copiar" so it's obvious
      // nothing was copied, instead of an uncaught rejection.
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    // Covers both "submitted the same email twice" and "clicked twice while
    // the first request is still in flight" — the second case's temp row
    // already carries this email at this point too.
    if (pendingReservations.some((reservation) => reservation.email === normalized)) {
      setEmail("");
      return;
    }

    const tempId = `optimistic-${normalized}`;
    setPendingReservations((prev) => [...prev, { reservationId: tempId, email: normalized }]);
    setSubmitting(true);
    setEmailError(undefined);
    setEmail("");

    const result = await reserveInviteEmailAction(tripId, normalized);
    setSubmitting(false);

    if (!result.ok) {
      setPendingReservations((prev) => prev.filter((reservation) => reservation.reservationId !== tempId));
      setEmailError(result.fieldErrors?.email ?? result.formError);
      return;
    }

    setPendingReservations((prev) =>
      prev.map((reservation) =>
        reservation.reservationId === tempId
          ? { reservationId: result.reservationId, email: result.email }
          : reservation,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div>
        <span className="mb-[var(--space-2)] block text-[length:var(--text-sm)] font-bold text-text">
          Link para invitar
        </span>
        <div className="flex h-control-h-md items-center gap-[var(--space-3)] rounded-md bg-surface px-[var(--space-5)] shadow-[inset_0_0_0_1px_var(--border)]">
          <span className="flex text-text-muted">
            <Icon name="link" size={16} />
          </span>
          <span className="flex-1 truncate font-mono text-[length:var(--text-sm)] text-text">
            {inviteUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-[var(--space-2)] rounded-sm font-body text-[length:var(--text-xs)] font-bold text-primary"
          >
            <Icon name={copied ? "check" : "copy"} size={14} />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <span className="mt-[var(--space-2)] block text-[length:var(--text-xs)] text-text-muted">
          Cualquiera con el link puede entrar. Mandales el link vos.
        </span>
      </div>

      <form onSubmit={handleAddEmail} className="flex items-end gap-[var(--space-3)]">
        <div className="flex-1">
          <Input
            label="Sumar por correo"
            name="email"
            type="email"
            placeholder="juan@correo.com"
            icon="mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
          />
        </div>
        <Button type="submit" disabled={submitting || !email.trim()}>
          Sumar
        </Button>
      </form>

      <CrewGrid members={members} pendingReservations={pendingReservations} />
    </div>
  );
}
