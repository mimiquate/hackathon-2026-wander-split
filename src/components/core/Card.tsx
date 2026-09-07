import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardTone = "surface" | "sunken";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  elevated?: boolean;
  padding?: CardPadding;
  tone?: CardTone;
  as?: ElementType;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-[var(--space-4)]",
  md: "p-[var(--space-7)]",
  lg: "p-[var(--space-9)]",
};

/** Every grouped block sits in a Card — hierarchy comes from elevation, not extra accent color. */
export function Card({
  children,
  elevated = false,
  padding = "md",
  tone = "surface",
  as: Tag = "div",
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-border font-body text-text",
        tone === "sunken" ? "bg-surface-2" : "bg-surface",
        elevated ? "shadow-raised" : "shadow-card",
        PADDING_CLASSES[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}
