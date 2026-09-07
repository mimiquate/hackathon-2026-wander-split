import type { HTMLAttributes, ReactNode } from "react";

export type StatusChipState = "thinking" | "urgent" | "booked" | "settled";

export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  state?: StatusChipState;
  children?: ReactNode;
}

const STATES: Record<StatusChipState, { className: string; label: string }> = {
  thinking: {
    className: "bg-surface-2 text-text-muted",
    label: "Lo estamos pensando",
  },
  urgent: {
    className: "bg-alert text-text-on-alert",
    label: "Hay que comprarlo YA",
  },
  booked: {
    className: "bg-success text-text-on-primary",
    label: "¡Reservado!",
  },
  settled: {
    className: "bg-[color-mix(in_oklab,var(--success)_18%,var(--surface))] text-success",
    label: "Saldado",
  },
};

/** The planning-state marker from the brand source; default labels are the product's real voice. */
export function StatusChip({
  state = "thinking",
  children,
  className,
  ...rest
}: StatusChipProps) {
  const s = STATES[state] ?? STATES.thinking;

  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-pill px-[var(--space-4)] py-[var(--space-2)] font-body text-[length:var(--text-sm)] font-semibold",
        s.className,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children ?? s.label}
    </span>
  );
}
