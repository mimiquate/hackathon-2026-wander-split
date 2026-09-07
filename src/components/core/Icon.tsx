import type { HTMLAttributes } from "react";

// Lucide is a documented substitution (the brand source shipped no icon set) —
// keeping the CDN source is a non-goal to change, see docs/plans/1-1-landing-page.md.
const LUCIDE_CDN = "https://unpkg.com/lucide-static@0.436.0/icons/";

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number;
  strokeWidth?: number;
}

/** Renders a Lucide glyph as a currentColor mask — no icon font, no inline SVG. */
export function Icon({
  name,
  size = 18,
  strokeWidth,
  className,
  style,
  ...rest
}: IconProps) {
  const url = `url("${LUCIDE_CDN}${name}.svg")`;

  return (
    <span
      aria-hidden="true"
      className={["inline-block shrink-0 bg-current", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        opacity: strokeWidth === 1 ? 0.8 : 1,
        ...style,
      }}
    />
  );
}
