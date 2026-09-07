import type { HTMLAttributes, ReactNode } from "react";

export type StatusChipState = "thinking" | "urgent" | "booked" | "settled" | "planning" | "active";

export interface StatusChipProps extends HTMLAttributes<HTMLSpanElement> {
  state?: StatusChipState;
  children?: ReactNode;
}

const STATES: Record<StatusChipState, { className: string; label: string }> = {
  thinking: {
    className: "bg-surface-2 text-text-muted",
    label: "Pensandolo...",
  },
  urgent: {
    className: "bg-alert text-text-on-alert",
    label: "Faltan cosas",
  },
  booked: {
    className: "bg-success text-text-on-primary",
    label: "¡Reservado!",
  },
  settled: {
    className: "bg-[color-mix(in_oklab,var(--success)_18%,var(--surface))] text-success",
    label: "Saldado",
  },
  // The dashboard's trip-level state (issue #22) — distinct from the
  // per-stop states above (#8/#16), sharing this component since both are
  // just a labeled pill with the same tokens/focus behavior.
  planning: {
    className: "bg-surface-2 text-text-muted",
    label: "Por armar",
  },
  active: {
    className: "bg-success text-text-on-primary",
    label: "En curso",
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
