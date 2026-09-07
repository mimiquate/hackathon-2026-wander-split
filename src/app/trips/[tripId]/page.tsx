import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/core/Card";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripMembership } from "@/lib/trips/membership";
import { getTripInvitePanel } from "@/lib/trips/invite";
import { crewCountLabel } from "@/lib/trips/format";
import { CompartirDialog } from "./CompartirDialog";

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
  searchParams: Promise<{ invite?: string }>;
}) {
  const { tripId } = await params;
  const { invite: inviteParam } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}`)}`);

  const membership = await findTripMembership(tripId, user.id);
  if (!membership) notFound();

  const panel = await getTripInvitePanel(tripId);
  if (!panel) notFound();

  const inviteUrl = await buildInviteUrl(panel.inviteToken);

  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col justify-center gap-[var(--space-7)] px-[var(--gutter)] py-[var(--space-9)]">
      <Card padding="lg" className="flex flex-col gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
            Tu viaje
          </span>
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            {panel.name}
          </h1>
        </div>
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          <div className="flex items-center gap-[var(--space-3)]">
            <AvatarGroup
              people={panel.members.map((member) => ({
                name: member.displayName,
                colorIndex: member.colorIndex,
              }))}
            />
            <span className="text-[length:var(--text-sm)] text-text-muted">
              {crewCountLabel(panel.members.length)}
            </span>
          </div>
          <CompartirDialog
            tripId={tripId}
            inviteUrl={inviteUrl}
            members={panel.members}
            initialPendingReservations={panel.pendingReservations}
            defaultOpen={inviteParam === "1"}
          />
        </div>
      </Card>
    </div>
  );
}
