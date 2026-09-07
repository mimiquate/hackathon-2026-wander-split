import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getTripInvitePanel } from "@/lib/trips/invite";
import { getTripEditPanel } from "@/lib/trips/update";
import { getTripBalance } from "@/lib/trips/balance";
import { TripShell, type TripTab } from "./TripShell";
import { RutaPanel } from "./RutaPanel";
import { GrupoTab } from "./GrupoTab";
import { GastosStub } from "./GastosStub";
import { BalanceTab } from "./BalanceTab";

export const metadata: Metadata = { title: "Tu viaje — wonderSplit" };

// Same host-detection the secure-cookie check in cookies.ts uses: Vercel
// production is always https, local dev is always http, so NODE_ENV is a
// safe stand-in for reading x-forwarded-proto.
async function buildInviteUrl(token: string) {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}/i/${token}`;
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ invite?: string; tab?: string }>;
}) {
  const { tripId } = await params;
  const { invite: inviteParam, tab: tabParam } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}`)}`);

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) notFound();

  const panel = await getTripInvitePanel(tripId);
  if (!panel) notFound();

  const editPanel = await getTripEditPanel(tripId);
  if (!editPanel) notFound();

  const inviteUrl = await buildInviteUrl(panel.inviteToken);
  const balance = await getTripBalance(tripId);

  // Default to "ruta" tab, or use tab param if provided
  const defaultTab: TripTab = (tabParam as TripTab) || "ruta";

  return (
    <TripShell
      tripId={tripId}
      tripName={editPanel.name}
      tripStartDate={editPanel.startDate}
      canEditStartDate={editPanel.canEditStartDate}
      defaultTab={defaultTab}
      children={{
        ruta: <RutaPanel tripId={tripId} tripStartDate={editPanel.startDate} />,
        grupo: (
          <GrupoTab
            tripId={tripId}
            inviteUrl={inviteUrl}
            members={panel.members}
            initialPendingReservations={panel.pendingReservations}
            defaultOpenInvite={inviteParam === "1"}
          />
        ),
        gastos: <GastosStub />,
        balance: <BalanceTab members={panel.members} balance={balance} />,
      }}
    />
  );
}
