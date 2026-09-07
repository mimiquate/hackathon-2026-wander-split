import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StatusChip, type StatusChipState } from "@/components/trip/StatusChip";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getTripEditPanel } from "@/lib/trips/update";
import { computeStopDateRange, getStopsForTrip } from "@/lib/trips/stops";
import { getPlacesForStop } from "@/lib/trips/places";
import { formatShortDate, parseCalendarDate } from "@/lib/trips/dates";
import { PLACE_KIND_LABELS, type PlaceKind } from "@/lib/trips/constants";
import { BackButton } from "./BackButton";

export const metadata: Metadata = { title: "Ciudad — wonderSplit" };

// Reservas/Gastos/Notas have no data source yet (#12/#13, #14-17, #23
// respectively) — inert placeholders, same treatment auth gave its inert
// account-menu items. No count shown since there's nothing real to count.
const INERT_TABS = [
  { key: "reservas", label: "Reservas" },
  { key: "gastos", label: "Gastos" },
  { key: "notas", label: "Notas" },
] as const;

export default async function StopPage({
  params,
}: {
  params: Promise<{ tripId: string; stopId: string }>;
}) {
  const { tripId, stopId } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/stops/${stopId}`)}`);
  }

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) notFound();

  const editPanel = await getTripEditPanel(tripId);
  if (!editPanel) notFound();

  const tripStartDate = parseCalendarDate(editPanel.startDate);
  if (!tripStartDate) notFound();

  const stops = await getStopsForTrip(tripId);
  const stop = stops.find((s) => s.id === stopId);
  if (!stop) notFound();

  const range = computeStopDateRange(stops, tripStartDate, stopId);
  if (!range) notFound();

  const places = await getPlacesForStop(stopId);

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col gap-[var(--space-6)] px-[var(--gutter)] py-[var(--space-6)]">
      <div className="flex flex-col gap-[var(--space-4)]">
        <BackButton fallbackHref={`/trips/${tripId}`} />
        <div className="flex items-start justify-between gap-[var(--space-3)]">
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            {stop.city}
          </h1>
          <StatusChip state={stop.status as StatusChipState} />
        </div>
        <div className="font-mono text-[length:var(--text-xs)] text-text-muted">
          {formatShortDate(range.startDate)}–{formatShortDate(range.endDate)} ·{" "}
          {stop.nights} noche{stop.nights !== 1 ? "s" : ""} · parada {range.position} de{" "}
          {range.totalStops}
        </div>
      </div>

      <div className="flex gap-[var(--space-2)]">
        <span
          aria-current="page"
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-primary px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold text-text-on-primary"
        >
          Plan · {places.length}
        </span>
        {INERT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            disabled
            className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-pill bg-surface-2 px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] font-semibold text-text-muted opacity-50"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-[var(--space-3)]">
        {places.length === 0 ? (
          <p className="m-0 text-center text-[length:var(--text-sm)] text-text-muted">
            Todavía no marcaste ningún lugar en {stop.city}.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-[var(--space-3)] p-0">
            {places.map((place) => (
              <li
                key={place.id}
                className="flex items-center justify-between gap-[var(--space-3)] rounded-lg bg-surface-2 px-[var(--space-4)] py-[var(--space-3)]"
              >
                <span className="text-[length:var(--text-sm)] font-medium text-text">
                  {place.label}
                </span>
                <span className="font-mono text-[length:var(--text-xs)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
                  {PLACE_KIND_LABELS[place.kind as PlaceKind] ?? place.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
