"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { FOCUS_RING } from "@/lib/styles";
import { Icon } from "./Icon";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** A native <dialog>-backed modal: free focus trap, Escape-to-close, and a
 * real backdrop, none of which a plain positioned <div> gets for free. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The inner content sits inside its own div, but the click still bubbles
    // to the <dialog> element itself — only close when the click actually
    // landed on the dialog's own backdrop area, not on the content.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-var(--space-9))] max-w-[480px] rounded-2xl border border-border bg-surface p-0 text-text shadow-raised backdrop:bg-[color-mix(in_oklab,black_50%,transparent)]"
    >
      <div className="flex flex-col gap-[var(--space-6)] p-[var(--space-9)]">
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          {title ? (
            <h2 className="m-0 font-display text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
              {title}
            </h2>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className={["ml-auto rounded-sm text-text-muted hover:text-text", FOCUS_RING].join(" ")}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
