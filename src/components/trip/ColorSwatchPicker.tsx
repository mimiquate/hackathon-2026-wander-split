"use client";

import { useState } from "react";
import { FOCUS_RING } from "@/lib/styles";
import { AVATAR_COLOR_COUNT } from "@/lib/avatar-colors";
import { avatarRampClass } from "./Avatar";

export interface ColorSwatchPickerProps {
  name: string;
  label?: string;
  defaultValue?: number;
}

/** Lets the joiner pick their per-trip color — independent of any
 * account-level color, and never prefilled/defaulted to something that
 * looks like a real choice already made. */
export function ColorSwatchPicker({
  name,
  label = "Elegí tu color",
  defaultValue = 0,
}: ColorSwatchPickerProps) {
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div>
      <span className="mb-[var(--space-2)] block text-[length:var(--text-sm)] font-bold text-text">
        {label}
      </span>
      <div className="flex gap-[var(--space-3)]" role="radiogroup" aria-label={label}>
        {Array.from({ length: AVATAR_COLOR_COUNT }, (_, colorIndex) => (
          <button
            key={colorIndex}
            type="button"
            role="radio"
            aria-checked={selected === colorIndex}
            aria-label={`Color ${colorIndex + 1}`}
            onClick={() => setSelected(colorIndex)}
            className={[
              "h-10 w-10 rounded-full transition-shadow duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              avatarRampClass(colorIndex),
              selected === colorIndex
                ? "shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--primary)]"
                : "",
              FOCUS_RING,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={selected} />
    </div>
  );
}
