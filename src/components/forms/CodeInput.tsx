import type { ClipboardEvent, KeyboardEvent } from "react";
import { useRef } from "react";
import { FOCUS_RING_INSET } from "@/lib/styles";

export interface CodeInputProps {
  length?: number;
  /** Name of the hidden field that carries the combined value into FormData. */
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Turns every box's ring alert-colored, per the design's codeRing behavior. */
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Six one-digit boxes with auto-advance, backspace-back, and paste support. */
export function CodeInput({
  length = 6,
  name,
  value,
  onChange,
  error = false,
  disabled = false,
  autoFocus = false,
}: CodeInputProps) {
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, digit: string) {
    // Padded with spaces (not stripped) so a box can be edited directly out
    // of order without losing later digits' positions — join() can't
    // otherwise represent a gap in a plain string. Blanks render as empty
    // via the .trim() in each box's displayed value below.
    const chars = value.padEnd(length, " ").split("");
    // An empty string here would collapse the array when joined (shifting
    // every later character left), losing the gap entirely — a literal
    // space is what actually holds this column's place.
    chars[index] = digit || " ";
    onChange(chars.join(""));
  }

  function focusBox(index: number) {
    boxRefs.current[index]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    setDigit(index, digit);
    if (index < length - 1) focusBox(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (value[index]?.trim()) {
        event.preventDefault();
        setDigit(index, "");
      } else if (index > 0) {
        event.preventDefault();
        setDigit(index - 1, "");
        focusBox(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!digits) return;
    onChange(digits);
    focusBox(Math.min(digits.length, length - 1));
  }

  const ringClasses = error
    ? "shadow-[inset_0_0_0_1px_var(--alert)]"
    : ["shadow-[inset_0_0_0_1px_var(--border)]", FOCUS_RING_INSET].join(" ");

  return (
    <div className="flex gap-[var(--space-3)]">
      <input type="hidden" name={name} value={value} readOnly />
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            boxRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          aria-label={`Dígito ${index + 1} de ${length}`}
          value={(value[index] ?? "").trim()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className={[
            "h-14 w-full rounded-md bg-[var(--bg)] text-center font-mono text-[1.15rem] font-semibold text-text outline-none",
            "transition-shadow duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            disabled ? "opacity-50" : "",
            ringClasses,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ))}
    </div>
  );
}
