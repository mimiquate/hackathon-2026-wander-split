import type { HTMLAttributes } from "react";
import { Icon } from "../core/Icon";
import type { AvatarGroupMember } from "./AvatarGroup";
import { AvatarGroup } from "./AvatarGroup";
import { StatusChip, type StatusChipState } from "./StatusChip";

export interface StopCardItem {
  label: string;
  icon?: string;
}

export type StopCardItemInput = StopCardItem | string;

export interface StopCardProps extends HTMLAttributes<HTMLDivElement> {
  city: string;
  nights?: number;
  dates?: string;
  state?: StatusChipState;
  items?: StopCardItemInput[];
  people?: AvatarGroupMember[];
}

function itemLabel(item: StopCardItemInput) {
  return typeof item === "string" ? item : item.label;
}

function itemIcon(item: StopCardItemInput) {
  return typeof item === "string" ? "dot" : (item.icon ?? "dot");
}

/** One city on the route, with its bookings listed and a single planning-state chip. */
export function StopCard({
  city,
  nights,
  dates,
  state,
  items = [],
  people,
  className,
  ...rest
}: StopCardProps) {
  const meta = [dates, nights ? `${nights} noches` : null].filter(Boolean).join(" · ");

  return (
    <div
      className={[
        "rounded-2xl border border-border bg-surface p-[var(--space-6)] font-body text-text shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="flex flex-wrap items-start gap-x-[var(--space-4)] gap-y-2">
        <span className="mt-0.5 flex text-primary">
          <Icon name="map-pin" size={18} />
        </span>
        <div className="flex-1">
          <div className="font-display text-[length:var(--text-md)] font-bold">
            {city}
          </div>
          {meta ? (
            <div className="font-mono text-[length:var(--text-xs)] text-text-muted">
              {meta}
            </div>
          ) : null}
        </div>
        {state ? <StatusChip state={state} /> : null}
      </div>
      {items.length ? (
        <ul className="mt-[var(--space-5)] flex list-none flex-col gap-[var(--space-3)] p-0">
          {items.map((item) => (
            <li
              key={itemLabel(item)}
              className="flex items-center gap-[var(--space-3)] text-[length:var(--text-sm)] text-text-muted"
            >
              <Icon name={itemIcon(item)} size={14} />
              <span className="text-text">{itemLabel(item)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {people && people.length ? (
        <div className="mt-[var(--space-5)] border-t border-border pt-[var(--space-4)]">
          <AvatarGroup people={people} size="sm" max={5} />
        </div>
      ) : null}
    </div>
  );
}
