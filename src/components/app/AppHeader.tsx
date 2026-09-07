import Link from "next/link";
import { FOCUS_RING } from "@/lib/styles";

export type AppNavItem = "viajes" | "gastos" | "vouchers" | "perfil";

const NAV_ITEMS: { key: AppNavItem; label: string }[] = [
  { key: "viajes", label: "Viajes" },
  { key: "gastos", label: "Gastos" },
  { key: "vouchers", label: "Vouchers" },
  { key: "perfil", label: "Perfil" },
];

export interface AppHeaderProps {
  active: AppNavItem;
}

/**
 * The authenticated app's persistent header: wordmark + the Viajes/Gastos/
 * Vouchers/Perfil nav strip. Only "Viajes" is wired up today (this ticket,
 * #22) — the other three are inert placeholders (real `disabled` buttons,
 * not dead links) until their own tickets exist, same treatment auth's plan
 * gave its inert account-menu items.
 */
export function AppHeader({ active }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="mx-auto flex h-[72px] max-w-[var(--page-max)] items-center justify-between gap-6 px-[var(--gutter)]">
        <span className="font-display text-[1.3rem] font-bold tracking-[-0.02em] text-primary">
          wonderSplit
        </span>
        <nav className="flex items-center gap-[var(--space-7)] text-[length:var(--text-sm)] font-semibold">
          {NAV_ITEMS.map((item) =>
            item.key === "viajes" ? (
              <Link
                key={item.key}
                href="/trips"
                aria-current={active === "viajes" ? "page" : undefined}
                className={[
                  "rounded-sm",
                  active === "viajes" ? "text-primary" : "text-text-muted hover:text-text",
                  FOCUS_RING,
                ].join(" ")}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                disabled
                className="cursor-not-allowed rounded-sm text-text-muted opacity-50"
              >
                {item.label}
              </button>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
