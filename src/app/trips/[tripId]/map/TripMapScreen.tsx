import { Card } from "@/components/core/Card";
import { RouteMap } from "@/components/site/RouteMap";
import { StopCard } from "@/components/trip/StopCard";
import type { StatusChipState } from "@/components/trip/StatusChip";
import { haversineDistance } from "@/lib/geo/haversine";
import type { DisplayStop } from "@/lib/trips/stop-schedule";
import { EditarRutaButton } from "./EditarRutaButton";

export interface TripMapScreenProps {
  tripId: string;
  tripName: string;
  stops: DisplayStop[];
}

function calculateTotalDistance(stops: DisplayStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineDistance(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude,
    );
  }
  return total;
}

/** The read-only "view the whole trip" screen — #9. Every control either
 * navigates elsewhere or is visibly inert; nothing here edits trip data. */
export function TripMapScreen({ tripId, tripName, stops }: TripMapScreenProps) {
  const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
  const totalKm = calculateTotalDistance(stops);
  const routeSignature = stops.length <= 1 ? tripName : stops.map((s) => s.city).join(" → ");

  return (
    <div className="mx-auto max-w-[1200px] px-[var(--space-6)] py-[var(--space-6)]">
      <div className="grid gap-[var(--space-6)] lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <RouteMap
            stops={stops.map((s) => ({
              id: s.id,
              city: s.city,
              latitude: s.latitude,
              longitude: s.longitude,
              transportMode: s.transportMode,
            }))}
            numbered
            interactive
          />
        </div>

        <aside className="flex flex-col gap-[var(--space-4)]">
          <div className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
            Tu viaje
          </div>

          <h1 className="m-0 font-display text-[length:var(--text-lg)] font-bold text-text">
            {routeSignature}
          </h1>

          <Card padding="lg">
            <div className="grid grid-cols-3 gap-[var(--space-4)]">
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Paradas
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {stops.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Noches
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {totalNights}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[length:var(--text-xs)] text-text-muted uppercase tracking-wider">
                  Distancia
                </div>
                <div className="mt-[var(--space-1)] text-[length:var(--text-lg)] font-bold text-text">
                  {Math.round(totalKm)}km
                </div>
              </div>
            </div>
          </Card>

          <EditarRutaButton tripId={tripId} />

          <div className="flex flex-col gap-[var(--space-3)]">
            {stops.map((stop) => (
              <div key={stop.id} className="pointer-events-none">
                <StopCard
                  city={stop.city}
                  dates={`${stop.computedStartDate} a ${stop.computedEndDate}`}
                  nights={stop.nights}
                  state={stop.status as StatusChipState}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
