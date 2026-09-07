import type { HTMLAttributes } from "react";
import { Icon } from "../core/Icon";
import type { AvatarGroupMember } from "./AvatarGroup";
import { Avatar } from "./Avatar";

export interface SettleRowProps extends HTMLAttributes<HTMLDivElement> {
  from: AvatarGroupMember;
  to: AvatarGroupMember;
  amount: string;
  done?: boolean;
}

function memberName(member: AvatarGroupMember) {
  return typeof member === "string" ? member : member.name;
}

function memberColorIndex(member: AvatarGroupMember, fallback: number) {
  return typeof member === "string" ? fallback : (member.colorIndex ?? fallback);
}

/** The settle-up instruction: two avatars, an arrow, one plain sentence. */
export function SettleRow({
  from,
  to,
  amount,
  done = false,
  className,
  ...rest
}: SettleRowProps) {
  const fromName = memberName(from);
  const toName = memberName(to);

  return (
    <div
      className={[
        "flex items-center gap-[var(--space-4)] border-t border-dashed border-border-strong pt-[var(--space-5)] font-body text-[length:var(--text-sm)] text-text",
        done ? "opacity-60" : "opacity-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <Avatar name={fromName} colorIndex={memberColorIndex(from, 0)} />
      <span className="flex text-text-muted">
        <Icon name="arrow-right" size={14} />
      </span>
      <Avatar name={toName} colorIndex={memberColorIndex(to, 1)} />
      <span className="flex-1">
        {fromName.split(" ")[0]} le transfiere{" "}
        <strong className="font-mono font-semibold tabular-nums">{amount}</strong>{" "}
        a {toName.split(" ")[0]}
      </span>
      {done ? (
        <span className="flex text-success">
          <Icon name="check" size={16} />
        </span>
      ) : null}
    </div>
  );
}
