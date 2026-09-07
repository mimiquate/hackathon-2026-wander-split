import { Button } from "@/components/core";

// The hero's trip-card mock (TripPreview) needs crew/expense data and lands
// in Phase 4 — this phase is copy + CTAs only, per the plan's own split.
export function Hero() {
  return (
    <section className="mx-auto max-w-[var(--page-max)] animate-[ws-rise_var(--dur-enter)_var(--ease-out)_both] px-10 py-[72px]">
      <div className="font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
        Viajes en grupo
      </div>
      <h1 className="mt-[10px] text-balance font-display text-[length:clamp(2.4rem,5vw,3.4rem)] font-bold tracking-[-0.01em]">
        Planeá el viaje, dividí los gastos, disfrutalo con tu banda.
      </h1>
      <p className="mt-4 max-w-[46ch] text-[1.05rem] text-text-muted">
        wonderSplit arma el itinerario entre todos y hace la cuenta al final:
        quién pagó, quién debe qué, con la menor cantidad de transferencias
        posible.
      </p>
      <div className="mt-[26px] flex flex-wrap items-center gap-[10px]">
        <Button size="lg" iconRight="arrow-right">
          Armar un viaje
        </Button>
        <Button size="lg" variant="secondary">
          Ver cómo funciona
        </Button>
      </div>
    </section>
  );
}
