"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Dialog } from "@/components/core/Dialog";
import { InvitePanel, type InvitePanelProps } from "./InvitePanel";

export interface CompartirDialogProps extends InvitePanelProps {
  /** Opened automatically right after creating the trip (Phase 2's
   * redirect) — every other visit starts closed, reopened via the button. */
  defaultOpen?: boolean;
}

/** The "Compartir" button in a trip's header, reopening Phase 3's invite
 * panel (link, add-by-email, crew grid) as a dialog any time after
 * creation — same component, same behavior, just not tied to that moment. */
export function CompartirDialog({ defaultOpen = false, ...invitePanelProps }: CompartirDialogProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button variant="secondary" size="sm" iconLeft="share-2" onClick={() => setOpen(true)}>
        Compartir
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Invitá a tu grupo">
        <InvitePanel {...invitePanelProps} />
      </Dialog>
    </>
  );
}
