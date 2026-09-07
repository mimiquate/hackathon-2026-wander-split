import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { FOCUS_RING_INSET } from "@/lib/styles";
import { Icon } from "@/components/core/Icon";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "style"> {
  label?: string;
  hint?: string;
  /** Replaces hint and turns the ring ocre. */
  error?: string;
  /** Lucide icon name shown inside the field, left. */
  icon?: string;
  /** Static trailing unit, e.g. "EUR". */
  suffix?: string;
  /** Use for money and codes — tabular mono digits. */
  mono?: boolean;
}

export function Input({
  label,
  hint,
  error,
  icon,
  suffix,
  mono = false,
  disabled = false,
  id,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const noteId = hint || error ? `${inputId}-note` : undefined;

  return (
    <div className="block font-body">
      <label htmlFor={inputId}>
        {label ? (
          <span className="mb-[var(--space-2)] block text-[length:var(--text-sm)] font-bold text-text">
            {label}
          </span>
        ) : null}
        <span
          className={[
            "flex items-center gap-[var(--space-3)] rounded-md bg-surface px-[var(--space-5)] transition-shadow duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            "h-control-h-md",
            disabled ? "opacity-50" : "",
            error
              ? "shadow-[inset_0_0_0_1px_var(--alert)]"
              : ["shadow-[inset_0_0_0_1px_var(--border)]", FOCUS_RING_INSET].join(" "),
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {icon ? (
            <span className="flex text-text-muted">
              <Icon name={icon} size={16} />
            </span>
          ) : null}
          <input
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={noteId}
            className={[
              "min-w-0 flex-1 border-none bg-transparent text-[length:var(--text-sm)] text-text outline-none placeholder:text-text-muted",
              mono ? "font-mono tabular-nums" : "font-body",
            ].join(" ")}
            {...rest}
          />
          {suffix ? (
            <span className="font-mono text-[length:var(--text-xs)] text-text-muted">{suffix}</span>
          ) : null}
        </span>
      </label>
      {hint || error ? (
        <span
          id={noteId}
          className={[
            "mt-[var(--space-2)] block text-[length:var(--text-xs)]",
            error ? "text-alert" : "text-text-muted",
          ].join(" ")}
        >
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}
