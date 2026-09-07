import { tripCountLabel } from "@/lib/trips/format";
import type { UserTripSummary } from "@/lib/trips/list";
import { NewTripCard } from "./NewTripCard";
import { TripCard } from "./TripCard";

export interface TripsGridProps {
  trips: UserTripSummary[];
}

/** The "Tus viajes" page body: the real trip count (or an invented
 * first-time headline when there are none yet) above a grid that always
 * opens with the "Nuevo viaje" entry card. */
export function TripsGrid({ trips }: TripsGridProps) {
  return (
    <div className="flex flex-col gap-[var(--space-7)]">
      {trips.length > 0 ? (
        <div className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
          {tripCountLabel(trips.length)}
        </div>
      ) : (
        <div className="flex flex-col gap-[var(--space-2)]">
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            Armá tu primer viaje
          </h1>
          <p className="m-0 text-[length:var(--text-sm)] text-text-muted">
            Creá un viaje y sumá a tu banda para empezar a planificar.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-[var(--space-7)] sm:grid-cols-2 lg:grid-cols-3">
        <NewTripCard />
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}
