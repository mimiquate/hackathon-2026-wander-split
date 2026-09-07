import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "@/components/core/Icon";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "style" | "type"> {
  label: ReactNode;
  /** Second line in muted text, e.g. "solo Juan y María usaron esto". */
  description?: string;
  checked?: boolean;
}

export function Checkbox({
  label,
  description,
  checked = false,
  disabled = false,
  className,
  ...rest
}: CheckboxProps) {
  return (
    <label
      className={[
        "flex min-h-[var(--tap-min)] cursor-pointer gap-[var(--space-4)] font-body text-[length:var(--text-sm)] text-text",
        description ? "items-start" : "items-center",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="peer sr-only"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={[
          "flex h-5 w-5 flex-none items-center justify-center rounded-sm text-text-on-primary",
          "bg-surface shadow-[inset_0_0_0_1px_var(--border-strong)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          "peer-checked:bg-primary peer-checked:shadow-none",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
          "[&>span]:opacity-0 peer-checked:[&>span]:opacity-100",
          description ? "mt-0.5" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Icon name="check" size={14} />
      </span>
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="block text-[length:var(--text-xs)] text-text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
