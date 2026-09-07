import type { HTMLAttributes } from "react";
import { AvatarGroup, type AvatarGroupMember } from "./AvatarGroup";

export interface LedgerRowProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  meta?: string;
  amount: string;
  converted?: string;
  people?: AvatarGroupMember[];
  tone?: "surface" | "sunken";
}

/** The expense list's atom. Amounts are always mono + tabular so columns line up. */
export function LedgerRow({
  label,
  meta,
  amount,
  converted,
  people,
  tone = "surface",
  onClick,
  className,
  ...rest
}: LedgerRowProps) {
  return (
    <div
      onClick={onClick}
      className={[
        "flex items-center gap-[var(--space-4)] rounded-md border border-border px-[var(--space-5)] py-[var(--space-4)] font-body text-[length:var(--text-sm)] text-text",
        tone === "sunken" ? "bg-surface-2" : "bg-surface",
        onClick ? "cursor-pointer" : "cursor-default",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium">{label}</div>
        {meta ? (
          <div className="mt-px text-[length:var(--text-xs)] text-text-muted">
            {meta}
          </div>
        ) : null}
      </div>
      {people && people.length ? (
        <AvatarGroup people={people} size="sm" max={3} />
      ) : null}
      <div className="text-right font-mono tabular-nums">
        <div>{amount}</div>
        {converted ? (
          <div className="text-[length:var(--text-xs)] text-text-muted">
            → {converted}
          </div>
        ) : null}
      </div>
    </div>
  );
}
