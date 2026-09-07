import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/core/Card";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findTripByInviteToken } from "@/lib/trips/invite";
import { findTripMembership } from "@/lib/trips/membership";
import { crewCountLabel } from "@/lib/trips/format";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Entrá al viaje — wonderSplit" };

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await findTripByInviteToken(token);

  if (!invite) {
    return (
      <div className="mx-auto flex min-h-svh max-w-[420px] flex-col justify-center gap-[var(--space-7)] px-[var(--gutter)] py-[var(--space-9)]">
        <Card padding="lg" className="flex flex-col gap-[var(--space-3)]">
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            Este link ya no funciona
          </h1>
          <p className="m-0 text-[length:var(--text-sm)] text-text-muted">
            La invitación no existe o ya no está disponible. Pedile a quien te invitó que te
            mande el link de nuevo.
          </p>
        </Card>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/i/${token}`)}`);
  }

  const membership = await findTripMembership(invite.tripId, user.id);
  if (membership) {
    redirect(`/trips/${invite.tripId}`);
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[420px] flex-col justify-center gap-[var(--space-7)] px-[var(--gutter)] py-[var(--space-9)]">
      <Card padding="lg" className="flex flex-col gap-[var(--space-6)]">
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase text-text-muted">
            {invite.admin ? `${invite.admin.displayName} te invitó` : "Te invitaron"}
          </span>
          <h1 className="m-0 text-balance font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
            {invite.name}
          </h1>
        </div>
        <div className="flex items-center gap-[var(--space-3)]">
          <AvatarGroup
            people={invite.members.map((member) => ({
              name: member.displayName,
              colorIndex: member.colorIndex,
            }))}
          />
          <span className="text-[length:var(--text-sm)] text-text-muted">
            {crewCountLabel(invite.members.length)}
          </span>
        </div>
        <JoinForm token={token} />
      </Card>
    </div>
  );
}
