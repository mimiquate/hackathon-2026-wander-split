"use client";

import { Avatar } from "@/components/trip/Avatar";

export interface AvatarColorPickerProps {
  name: string;
  value: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}

export function AvatarColorPicker({ name, value, onChange, disabled = false }: AvatarColorPickerProps) {
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <label className="text-[length:var(--text-sm)] font-bold text-text">Elegí tu color</label>
      <div role="radiogroup" className="flex gap-[var(--space-4)]">
        {[0, 1, 2, 3, 4].map((index) => (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onChange(index)}
            className={[
              "cursor-pointer rounded-full transition-transform duration-[var(--dur-fast)] disabled:cursor-not-allowed",
              value === index ? "ring-2 ring-primary ring-offset-2" : "",
              disabled ? "opacity-50" : "hover:scale-110",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-pressed={value === index}
          >
            <Avatar name="A" colorIndex={index} size="md" />
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
