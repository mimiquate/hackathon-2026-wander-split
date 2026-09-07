import { Button } from "@/components/core";
import { FOCUS_RING } from "@/lib/styles";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Gastos", href: "#gastos" },
  { label: "Vouchers", href: "#vouchers" },
  { label: "Precios", href: "#precios" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg">
      <div className="mx-auto flex h-[72px] max-w-[var(--page-max)] items-center justify-between gap-6 px-[var(--gutter)]">
        <span className="font-display text-[1.3rem] font-bold tracking-[-0.02em] text-primary">
          wonderSplit
        </span>
        {/* Hidden below the ~900px breakpoint rather than a hamburger menu —
            the page stays fully reachable by scrolling, and this avoids adding
            a new stateful component for a CSS/breakpoint-only phase. */}
        <nav className="hidden flex-1 flex-wrap gap-[var(--space-7)] text-[length:var(--text-sm)] text-text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={["rounded-sm hover:text-text", FOCUS_RING].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-[var(--space-3)]">
          <Button
            variant="ghost"
            size="sm"
            href="/login"
            className="max-md:min-h-tap-min"
          >
            Ingresar
          </Button>
          <Button size="sm" href="/signup" className="max-md:min-h-tap-min">
            Armar un viaje
          </Button>
        </div>
      </div>
    </header>
  );
}
