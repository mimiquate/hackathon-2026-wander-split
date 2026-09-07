import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import { FOCUS_RING_INSET } from "@/lib/styles";
import { Icon } from "@/components/core/Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style"> {
  label?: string;
  hint?: string;
  /** Replaces hint and turns the ring ocre. */
  error?: string;
  /** Lucide icon name shown inside the field, left. */
  icon?: string;
  options: SelectOption[];
}

export function Select({
  label,
  hint,
  error,
  icon,
  options,
  disabled = false,
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const noteId = hint || error ? `${selectId}-note` : undefined;

  return (
    <div className="block font-body">
      <label htmlFor={selectId}>
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
          <select
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={noteId}
            className="min-w-0 flex-1 appearance-none border-none bg-transparent bg-none text-[length:var(--text-sm)] text-text outline-none"
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="flex text-text-muted">
            <Icon name="chevron-down" size={16} />
          </span>
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
