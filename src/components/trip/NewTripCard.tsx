import Link from "next/link";
import { Icon } from "@/components/core/Icon";

/** Always the grid's first card — opens #7's create-trip flow. */
export function NewTripCard() {
  return (
    <Link
      href="/trips/new"
      className="flex h-full min-h-40 flex-col items-center justify-center gap-[var(--space-3)] rounded-2xl border-2 border-dashed border-border-strong p-[var(--space-6)] text-text-muted no-underline transition-colors duration-[var(--dur-fast)] hover:border-primary hover:text-primary"
    >
      <Icon name="plus" size={24} />
      <span className="font-body text-[length:var(--text-sm)] font-semibold">Nuevo viaje</span>
    </Link>
  );
}
