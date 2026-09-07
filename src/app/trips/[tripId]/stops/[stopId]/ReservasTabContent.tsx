"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Icon } from "@/components/core/Icon";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { FOCUS_RING } from "@/lib/styles";
import type { BookingDetail } from "@/lib/trips/bookings";
import type { TripMemberSummary } from "@/lib/trips/membership";
import type { VoucherFileData } from "@/lib/trips/vouchers";
import { removeBookingAction, removeVoucherFileAction } from "./actions";
import { SumarReservaDialog } from "./SumarReservaDialog";
import { VoucherUploader } from "./VoucherUploader";

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
 * "Editar" reopens the same dialog pre-filled, its voucher chips support
 * uploading and removing files, and "Eliminar reserva" removes the whole
 * booking — no confirmation prompt, matching #10's place-removal pattern.
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

  function handleVoucherUploaded(bookingId: string, voucher: VoucherFileData) {
    onBookingsChange(
      bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, vouchers: [...booking.vouchers, voucher] } : booking,
      ),
    );
  }

  async function handleRemoveVoucher(bookingId: string, voucherId: string) {
    const previous = bookings;
    onBookingsChange(
      bookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, vouchers: booking.vouchers.filter((voucher) => voucher.id !== voucherId) }
          : booking,
      ),
    );

    const result = await removeVoucherFileAction(tripId, stopId, bookingId, voucherId);
    if (!result.ok) {
      // Put it back — the delete didn't actually happen server-side.
      onBookingsChange(previous);
    }
  }

  async function handleRemoveBooking(bookingId: string) {
    const previous = bookings;
    onBookingsChange(bookings.filter((booking) => booking.id !== bookingId));
    if (selectedId === bookingId) setSelectedId(null);

    const result = await removeBookingAction(tripId, stopId, bookingId);
    if (!result.ok) {
      // Put it back — the delete didn't actually happen server-side.
      onBookingsChange(previous);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Button
        type="button"
        iconLeft="plus"
        onClick={() => setDialogBooking("new")}
        className="max-md:min-h-tap-min"
      >
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
                    "flex w-full items-center justify-between gap-[var(--space-3)] rounded-lg px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors max-md:min-h-tap-min",
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
                    <div className="grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2">
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

                    <div className="flex flex-col gap-[var(--space-2)]">
                      <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                        Comprobantes
                      </span>
                      {booking.vouchers.length > 0 ? (
                        <div className="flex flex-wrap gap-[var(--space-2)]">
                          {booking.vouchers.map((voucher) => (
                            <span
                              key={voucher.id}
                              className="inline-flex items-center gap-[var(--space-1)] rounded-pill bg-surface pl-[var(--space-4)] pr-[var(--space-1)] text-[length:var(--text-xs)] font-semibold text-text"
                            >
                              <a
                                href={voucher.url}
                                target="_blank"
                                rel="noreferrer"
                                className={[
                                  "inline-flex items-center gap-[var(--space-2)] py-[var(--space-2)] hover:text-primary max-md:min-h-tap-min",
                                  FOCUS_RING,
                                ].join(" ")}
                              >
                                <Icon name="paperclip" size={14} />
                                {voucher.filename}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveVoucher(booking.id, voucher.id)}
                                aria-label={`Eliminar ${voucher.filename}`}
                                className={[
                                  "inline-flex items-center justify-center rounded-sm text-text-muted hover:text-alert max-md:min-h-tap-min max-md:min-w-tap-min",
                                  FOCUS_RING,
                                ].join(" ")}
                              >
                                <Icon name="x" size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <VoucherUploader
                        tripId={tripId}
                        stopId={stopId}
                        bookingId={booking.id}
                        onUploaded={(voucher) => handleVoucherUploaded(booking.id, voucher)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-[var(--space-5)]">
                      <button
                        type="button"
                        onClick={() => setDialogBooking(booking)}
                        className={[
                          "inline-flex items-center gap-[var(--space-2)] rounded-sm text-[length:var(--text-sm)] font-semibold text-text hover:text-primary max-md:min-h-tap-min",
                          FOCUS_RING,
                        ].join(" ")}
                      >
                        <Icon name="pencil" size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBooking(booking.id)}
                        className={[
                          "inline-flex items-center gap-[var(--space-2)] rounded-sm text-[length:var(--text-sm)] font-semibold text-text hover:text-alert max-md:min-h-tap-min",
                          FOCUS_RING,
                        ].join(" ")}
                      >
                        <Icon name="trash-2" size={14} />
                        Eliminar reserva
                      </button>
                    </div>
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
