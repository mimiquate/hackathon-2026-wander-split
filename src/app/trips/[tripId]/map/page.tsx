import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getTripEditPanel } from "@/lib/trips/update";
import { getStopsForTrip } from "@/lib/trips/stops";
import { computeStopDates } from "@/lib/trips/stop-schedule";
import { TripMapScreen } from "./TripMapScreen";

export const metadata: Metadata = { title: "El viaje en el mapa — wonderSplit" };

export default async function TripMapPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/map`)}`);

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) notFound();

  const editPanel = await getTripEditPanel(tripId);
  if (!editPanel) notFound();

  const stops = await getStopsForTrip(tripId);
  const displayStops = computeStopDates(stops, editPanel.startDate);

  return <TripMapScreen tripId={tripId} tripName={editPanel.name} stops={displayStops} />;
}
