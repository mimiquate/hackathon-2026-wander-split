import Link from "next/link";
import { Card } from "@/components/core/Card";
import { formatShortDate } from "@/lib/trips/dates";
import { travelerCountLabel } from "@/lib/trips/format";
import type { UserTripSummary } from "@/lib/trips/list";
import { AvatarGroup } from "./AvatarGroup";
import { StatusChip } from "./StatusChip";
import { TripPhotoCarousel } from "./TripPhotoCarousel";

export interface TripCardProps {
  trip: UserTripSummary;
}

/** One trip on the "Tus viajes" grid: route/name, dates, crew, and its
 * planning-state chip — everything but the carousel falls back gracefully
 * for a trip with no stops yet (#8 hasn't shipped). */
export function TripCard({ trip }: TripCardProps) {
  const routeHeading = trip.cities.length > 0 ? trip.cities.join(" → ") : trip.name;
  const status = trip.cities.length > 0 ? "active" : "planning";

  return (
    <Link href={`/trips/${trip.id}`} className="block no-underline">
      <Card padding="none" elevated className="overflow-hidden">
        <TripPhotoCarousel cities={trip.cities} fallbackLabel={trip.name} />
        <div className="flex flex-col gap-[var(--space-4)] p-[var(--space-6)]">
          <div className="flex items-start justify-between gap-[var(--space-3)]">
            <h3 className="m-0 text-balance font-display text-[length:var(--text-md)] font-bold leading-[var(--leading-snug)]">
              {routeHeading}
            </h3>
            <StatusChip state={status} />
          </div>
          <div className="font-mono text-[length:var(--text-xs)] text-text-muted">
            {formatShortDate(trip.startDate)} · {travelerCountLabel(trip.members.length)}
          </div>
          <AvatarGroup people={trip.members} size="sm" />
        </div>
      </Card>
    </Link>
  );
}
