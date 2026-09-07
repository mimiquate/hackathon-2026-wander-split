"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Icon } from "@/components/core/Icon";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { FOCUS_RING } from "@/lib/styles";
import type { BookingDetail } from "@/lib/trips/bookings";
import type { TripMemberSummary } from "@/lib/trips/membership";
import { SumarReservaDialog } from "./SumarReservaDialog";

export interface ReservasTabContentProps {
  tripId: string;
  stopId: string;
  bookings: BookingDetail[];
  onBookingsChange: (bookings: BookingDetail[]) => void;
  tripMembers: TripMemberSummary[];
}

function findMember(members: TripMemberSummary[], id: string): TripMemberSummary | undefined {
  return members.find((member) => member.id === id);
}

function memberName(members: TripMemberSummary[], id: string): string {
  return findMember(members, id)?.displayName ?? "Alguien del viaje";
}

/**
 * The Reservas tab: real bookings (#12/#13), replacing #10's inert
 * placeholder. "Sumar reserva" adds a new one; each expanded booking's
 * "Editar" reopens the same dialog pre-filled. Phase 4 adds voucher
 * uploads, Phase 5 adds removal.
 */
export function ReservasTabContent({
  tripId,
  stopId,
  bookings,
  onBookingsChange,
  tripMembers,
}: ReservasTabContentProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogBooking, setDialogBooking] = useState<BookingDetail | "new" | null>(null);

  function handleSaved(booking: BookingDetail) {
    const exists = bookings.some((b) => b.id === booking.id);
    onBookingsChange(
      exists ? bookings.map((b) => (b.id === booking.id ? booking : b)) : [...bookings, booking],
    );
    setSelectedId(booking.id);
    setDialogBooking(null);
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Button type="button" iconLeft="plus" onClick={() => setDialogBooking("new")}>
        Sumar reserva
      </Button>

      {bookings.length === 0 ? (
        <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
          Todavía no cargaste ninguna reserva acá.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
          {bookings.map((booking) => {
            const isSelected = booking.id === selectedId;

            return (
              <li key={booking.id} className="flex flex-col gap-[var(--space-3)]">
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : booking.id)}
                  aria-expanded={isSelected}
                  className={[
                    "flex w-full items-center justify-between gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors",
                    isSelected ? "bg-primary text-text-on-primary" : "bg-surface-2 text-text hover:bg-surface",
                    FOCUS_RING,
                  ].join(" ")}
                >
                  <span className="flex flex-col gap-[var(--space-1)]">
                    <span className="text-[length:var(--text-sm)] font-medium">{booking.label}</span>
                    <span className="font-mono text-[length:var(--text-xs)] opacity-80">
                      a nombre de {memberName(tripMembers, booking.reservedById)}
                    </span>
                  </span>
                  {booking.vouchers.length > 0 ? (
                    <span aria-label="Tiene comprobante adjunto" className="inline-flex shrink-0">
                      <Icon name="paperclip" size={16} />
                    </span>
                  ) : null}
                </button>

                {isSelected ? (
                  <div className="flex flex-col gap-[var(--space-4)] rounded-lg bg-surface-2 px-[var(--space-4)] py-[var(--space-4)]">
                    <div className="grid grid-cols-2 gap-[var(--space-4)]">
                      <div className="flex flex-col gap-[var(--space-1)]">
                        <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                          Quién reservó
                        </span>
                        <span className="text-[length:var(--text-sm)] text-text">
                          {memberName(tripMembers, booking.reservedById)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-[var(--space-1)]">
                        <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                          Quién pagó
                        </span>
                        <span className="text-[length:var(--text-sm)] text-text">
                          {memberName(tripMembers, booking.paidById)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-[var(--space-2)]">
                      <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                        Quién lo usa
                      </span>
                      <AvatarGroup
                        people={booking.userIds.map((id) => {
                          const member = findMember(tripMembers, id);
                          return {
                            name: member?.displayName ?? "Alguien del viaje",
                            colorIndex: member?.colorIndex ?? 0,
                          };
                        })}
                        size="sm"
                      />
                    </div>

                    {booking.vouchers.length > 0 ? (
                      <div className="flex flex-col gap-[var(--space-2)]">
                        <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                          Comprobantes
                        </span>
                        <div className="flex flex-wrap gap-[var(--space-2)]">
                          {booking.vouchers.map((voucher) => (
                            <a
                              key={voucher.id}
                              href={voucher.url}
                              target="_blank"
                              rel="noreferrer"
                              className={[
                                "inline-flex items-center gap-[var(--space-2)] rounded-pill bg-surface px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-text hover:bg-bg",
                                FOCUS_RING,
                              ].join(" ")}
                            >
                              <Icon name="paperclip" size={14} />
                              {voucher.filename}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setDialogBooking(booking)}
                      className={[
                        "inline-flex items-center gap-[var(--space-2)] self-start rounded-sm text-[length:var(--text-sm)] font-semibold text-text hover:text-primary",
                        FOCUS_RING,
                      ].join(" ")}
                    >
                      <Icon name="pencil" size={14} />
                      Editar
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <SumarReservaDialog
        open={dialogBooking !== null}
        onClose={() => setDialogBooking(null)}
        tripId={tripId}
        stopId={stopId}
        tripMembers={tripMembers}
        editing={dialogBooking === "new" || dialogBooking === null ? undefined : dialogBooking}
        onSaved={handleSaved}
      />
    </div>
  );
}
