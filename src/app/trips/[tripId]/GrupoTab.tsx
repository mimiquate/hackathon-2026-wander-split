"use client";

import { Card } from "@/components/core/Card";
import { AvatarGroup } from "@/components/trip/AvatarGroup";
import { crewCountLabel } from "@/lib/trips/format";
import { CompartirDialog, type CompartirDialogProps } from "./CompartirDialog";

export interface GrupoTabProps extends Omit<CompartirDialogProps, "defaultOpen"> {
  defaultOpenInvite?: boolean;
}

export function GrupoTab({
  tripId,
  inviteUrl,
  members,
  initialPendingReservations,
  defaultOpenInvite = false,
}: GrupoTabProps) {
  return (
    <Card padding="lg">
      <div className="flex flex-col gap-[var(--space-6)]">
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          <div className="flex items-center gap-[var(--space-3)]">
            <AvatarGroup
              people={members.map((member) => ({
                name: member.displayName,
                colorIndex: member.colorIndex,
              }))}
            />
            <span className="text-[length:var(--text-sm)] text-text-muted">
              {crewCountLabel(members.length)}
            </span>
          </div>
          <CompartirDialog
            tripId={tripId}
            inviteUrl={inviteUrl}
            members={members}
            initialPendingReservations={initialPendingReservations}
            defaultOpen={defaultOpenInvite}
          />
        </div>
      </div>
    </Card>
  );
}
