import { RouteMap } from "./RouteMap";

export function RouteSection() {
  return (
    <section className="border-t border-border px-10 py-[var(--section-gap)]">
      <div className="mx-auto max-w-[var(--page-max)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold">
          La ruta
        </h2>
        <div className="mt-6">
          <RouteMap />
        </div>
        <p className="mt-3 font-mono text-[length:var(--text-xs)] text-text-muted">
          3 paradas · 1.240 km
        </p>
      </div>
    </section>
  );
}
