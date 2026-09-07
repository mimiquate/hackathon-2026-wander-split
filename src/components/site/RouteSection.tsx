import { RouteMap } from "./RouteMap";

export function RouteSection() {
  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[var(--page-max)] px-[var(--gutter)] py-[var(--space-9)]">
        <div className="flex flex-wrap justify-between gap-3 font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
          <span>La ruta</span>
          <span>1.240 km · 7 noches</span>
        </div>
        <div className="mt-[14px] overflow-hidden rounded-xl bg-bg">
          <RouteMap />
        </div>
      </div>
    </section>
  );
}
