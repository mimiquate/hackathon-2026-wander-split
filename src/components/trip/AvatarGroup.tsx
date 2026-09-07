import type { HTMLAttributes } from "react";
import { Avatar, type AvatarSize } from "./Avatar";

export interface AvatarGroupPerson {
  name: string;
  colorIndex?: number;
}

export type AvatarGroupMember = AvatarGroupPerson | string;

export interface AvatarGroupProps extends HTMLAttributes<HTMLSpanElement> {
  people?: AvatarGroupMember[];
  max?: number;
  size?: AvatarSize;
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 24, md: 30, lg: 40 };

function memberName(member: AvatarGroupMember) {
  return typeof member === "string" ? member : member.name;
}

function memberColorIndex(member: AvatarGroupMember, fallback: number) {
  return typeof member === "string" ? fallback : (member.colorIndex ?? fallback);
}

/** Overlapping stack showing who's in on a trip, a booking or an expense. */
export function AvatarGroup({
  people = [],
  max = 4,
  size = "md",
  className,
  ...rest
}: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const px = SIZE_PX[size];
  const overlap = -px / 3.2;

  return (
    <span
      className={["inline-flex items-center", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {shown.map((member, i) => (
        <Avatar
          key={memberName(member)}
          name={memberName(member)}
          colorIndex={memberColorIndex(member, i)}
          size={size}
          ring
          style={{ marginLeft: i === 0 ? 0 : overlap }}
        />
      ))}
      {overflow > 0 ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-text-muted shadow-[0_0_0_2px_var(--surface)]"
          style={{ width: px, height: px, marginLeft: overlap }}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
