import { Avatar } from "./Avatar";
import { StatusChip } from "./StatusChip";
import { Icon } from "@/components/core/Icon";
import type { TripCrewMember } from "@/lib/trips/membership";
import type { PendingCrewReservation } from "@/lib/trips/invite";

export interface CrewGridProps {
  members: TripCrewMember[];
  pendingReservations: PendingCrewReservation[];
}

/** Joined crew (avatar, name, admin marker) alongside still-pending email
 * reservations (muted placeholder, labeled by the email, "Pendiente" badge).
 * Shared by the invite panel (Phase 3) and the "Compartir" dialog (Phase 5). */
export function CrewGrid({ members, pendingReservations }: CrewGridProps) {
  return (
    <ul className="flex flex-col gap-[var(--space-3)]">
      {members.map((member) => (
        <li
          key={member.membershipId}
          className="flex items-center gap-[var(--space-4)] rounded-lg bg-surface-2 px-[var(--space-4)] py-[var(--space-3)]"
        >
          <Avatar name={member.displayName} colorIndex={member.colorIndex} />
          <span className="flex-1 truncate text-[length:var(--text-sm)] font-medium text-text">
            {member.displayName}
          </span>
          {member.role === "admin" ? (
            <span className="font-mono text-[length:var(--text-xs)] tracking-[var(--tracking-eyebrow)] text-text-muted uppercase">
              Admin
            </span>
          ) : null}
        </li>
      ))}
      {pendingReservations.map((reservation) => (
        <li
          key={reservation.reservationId}
          className="flex items-center gap-[var(--space-4)] rounded-lg bg-surface-2 px-[var(--space-4)] py-[var(--space-3)] opacity-70"
        >
          <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-surface text-text-muted shadow-[inset_0_0_0_1px_var(--border)]">
            <Icon name="mail" size={14} />
          </span>
          <span className="flex-1 truncate text-[length:var(--text-sm)] text-text-muted">
            {reservation.email}
          </span>
          <StatusChip state="thinking">Pendiente</StatusChip>
        </li>
      ))}
    </ul>
  );
}
