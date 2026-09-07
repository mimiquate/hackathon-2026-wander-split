import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StatusChip, type StatusChipState } from "@/components/trip/StatusChip";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getTripEditPanel } from "@/lib/trips/update";
import { computeStopDateRange, getStopsForTrip } from "@/lib/trips/stops";
import { getPlacesForStop } from "@/lib/trips/places";
import { getNotesForStop } from "@/lib/trips/notes";
import { formatCalendarDate, parseCalendarDate } from "@/lib/trips/dates";
import { BackButton } from "./BackButton";
import { PlanTab } from "./PlanTab";

export const metadata: Metadata = { title: "Ciudad — wonderSplit" };

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
  const notes = await getNotesForStop(stopId);

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
      </div>

      <PlanTab
        tripId={tripId}
        stopId={stopId}
        cityName={stop.city}
        city={{ latitude: stop.latitude, longitude: stop.longitude }}
        initialNights={stop.nights}
        stopStartDate={formatCalendarDate(range.startDate)}
        position={range.position}
        totalStops={range.totalStops}
        initialPlaces={places}
        initialNotes={notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString() }))}
      />
    </div>
  );
}
