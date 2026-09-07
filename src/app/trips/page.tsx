import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TripsGrid } from "@/components/trip/TripsGrid";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listUserTrips } from "@/lib/trips/list";

export const metadata: Metadata = { title: "Tus viajes — wonderSplit" };

export default async function TripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/trips")}`);

  const trips = await listUserTrips(user.id);

  return (
    <div className="mx-auto max-w-[var(--page-max)] px-[var(--gutter)] py-[var(--space-9)]">
      <TripsGrid trips={trips} />
    </div>
  );
}
