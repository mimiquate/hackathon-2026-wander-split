import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "alert";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-control-h-sm px-[var(--space-4)] text-[length:var(--text-sm)]",
  md: "h-control-h-md px-[var(--space-6)] text-[length:var(--text-sm)]",
  lg: "h-control-h-lg px-[var(--space-8)] text-[length:var(--text-base)]",
};

// The source's `alert` variant hovers via opacity alone, but this repo's
// Button contract requires every filled variant to shift fill color on
// hover (never opacity-only) — so alert reuses --ocre-500 (the same token
// the source uses for its own pressed state) for hover instead.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-press",
  secondary:
    "bg-transparent text-primary shadow-[inset_0_0_0_1px_var(--primary)] hover:opacity-[0.82] active:brightness-[0.94]",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  alert:
    "bg-alert text-text-on-alert hover:bg-[var(--ocre-500)] active:bg-[color-mix(in_oklab,var(--ocre-500)_85%,black)]",
};

// `outline-none` clears Tailwind's internal --tw-outline-style variable to
// "none", so it has to be set back to "solid" explicitly on focus-visible —
// outline-width/color alone don't bring the outline back.
const FOCUS_RING =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  fullWidth = false,
  disabled = false,
  className,
  ...rest
}: ButtonProps) {
  const iconSize = size === "lg" ? 20 : 16;

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "inline-flex cursor-pointer items-center justify-center gap-[var(--space-3)] whitespace-nowrap rounded-pill font-body font-bold transition-[background,opacity,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-[0.45]",
        fullWidth ? "w-full" : "w-auto",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        FOCUS_RING,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={iconSize} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}
