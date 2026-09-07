import { Button } from "@/components/core";

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Gastos", href: "#gastos" },
  { label: "Vouchers", href: "#vouchers" },
  { label: "Precios", href: "#precios" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-bg px-10 py-5">
      <span className="font-display text-[1.3rem] font-bold tracking-[-0.02em] text-primary">
        wonderSplit
      </span>
      <nav className="flex flex-1 flex-wrap gap-[var(--space-7)] text-[length:var(--text-sm)] text-text-muted">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-text">
            {link.label}
          </a>
        ))}
      </nav>
      <Button variant="ghost" size="sm">
        Ingresar
      </Button>
      <Button size="sm">Armar un viaje</Button>
    </header>
  );
}
