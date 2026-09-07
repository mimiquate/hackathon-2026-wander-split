"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/core/Icon";
import { FOCUS_RING } from "@/lib/styles";

export interface BackButtonProps {
  /** Used only when there's no history to go back to (a direct link/bookmark). */
  fallbackHref: string;
}

/** "Volver" — returns to wherever the user came from (the route panel today,
 * #9's map once that exists) rather than a hardcoded destination. */
export function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className={["inline-flex items-center gap-[var(--space-2)] rounded-sm text-text-muted hover:text-text", FOCUS_RING].join(
        " ",
      )}
    >
      <Icon name="arrow-left" size={18} />
      <span className="text-[length:var(--text-sm)] font-medium">Volver</span>
    </button>
  );
}
