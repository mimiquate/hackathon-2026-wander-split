import { StopCard } from "@/components/trip";
import { stops } from "@/lib/demo-data";

export function Vouchers() {
  return (
    <section
      id="vouchers"
      className="scroll-mt-20 border-t border-border bg-surface px-10 py-[var(--section-gap)]"
    >
      <div className="mx-auto max-w-[var(--page-max)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold">
          Vouchers
        </h2>
        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
          {stops.map((stop) => (
            <StopCard
              key={stop.city}
              city={stop.city}
              dates={stop.dates}
              nights={stop.nights}
              state={stop.state}
              items={stop.items}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
