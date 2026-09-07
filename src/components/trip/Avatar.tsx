import type { HTMLAttributes } from "react";

const RAMP_CLASSES = [
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
];

export type AvatarSize = "sm" | "md" | "lg";

const SIZE_PX: Record<AvatarSize, number> = { sm: 24, md: 30, lg: 40 };

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  colorIndex?: number;
  size?: AvatarSize;
  ring?: boolean;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** The same per-index background class Avatar renders with — exported so a
 * color picker can show swatches that actually match, without a second copy
 * of the ramp. Wraps modulo-safely, same as Avatar itself. */
export function avatarRampClass(colorIndex: number) {
  return RAMP_CLASSES[((colorIndex % RAMP_CLASSES.length) + RAMP_CLASSES.length) % RAMP_CLASSES.length];
}

/** Identifies a traveller. Colors are assigned per person, never by list position. */
export function Avatar({
  name,
  colorIndex = 0,
  size = "md",
  ring = false,
  className,
  style,
  ...rest
}: AvatarProps) {
  const px = SIZE_PX[size];
  const fontSize = px <= 24 ? 9 : px <= 30 ? 11 : 14;
  const ramp = avatarRampClass(colorIndex);

  return (
    <span
      title={name}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full font-mono font-semibold text-text-on-accent",
        ramp,
        ring ? "shadow-[0_0_0_2px_var(--surface)]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
      style={{ width: px, height: px, fontSize, letterSpacing: "0.02em", ...style }}
    >
      {initials(name)}
    </span>
  );
}
