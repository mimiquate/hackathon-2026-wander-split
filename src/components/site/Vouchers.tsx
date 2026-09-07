import { StopCard } from "@/components/trip";
import { stops } from "@/lib/demo-data";

export function Vouchers() {
  return (
    <section
      id="vouchers"
      className="scroll-mt-20 border-t border-border"
    >
      <div className="mx-auto max-w-[var(--page-max)] px-[var(--gutter)] py-[var(--section-gap)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold leading-[var(--leading-snug)]">
          Cada parada, con su estado
        </h2>
        <p className="mt-2 max-w-[52ch] text-[length:var(--text-sm)] text-text-muted">
          Lo que está reservado, lo que hay que comprar YA y lo que todavía se
          está pensando.
        </p>
        <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[var(--space-6)]">
          {stops.map((stop) => (
            <StopCard
              key={stop.city}
              city={stop.city}
              dates={stop.dates}
              nights={stop.nights}
              state={stop.state}
              items={stop.items}
              people={stop.people}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
