import { Button } from "@/components/core";
import { AvatarGroup } from "@/components/trip";
import { crew } from "@/lib/demo-data";
import { TripPreview } from "./TripPreview";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[var(--page-max)] animate-[ws-rise_var(--dur-enter)_var(--ease-out)_both] grid-cols-1 items-center gap-12 px-[var(--gutter)] pb-14 pt-[72px] md:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="font-mono text-[length:var(--text-eyebrow)] tracking-[var(--tracking-eyebrow)] text-text-muted">
          Viajes en grupo · 3 ciudades
        </div>
        <h1 className="mt-3 text-balance font-display text-[length:clamp(2.4rem,5vw,3.4rem)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          Armen la ruta juntos. La cuenta la hacemos nosotros.
        </h1>
        <p className="mt-[18px] max-w-[46ch] text-pretty text-text-muted">
          Planeás el viaje en un mapa que todos pueden editar, guardás cada
          reserva en un solo lugar y al final wonderSplit dice quién le
          transfiere a quién, con la menor cantidad de movimientos posible.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-[10px]">
          <Button size="lg" iconRight="arrow-right">
            Armar un viaje
          </Button>
          <Button size="lg" variant="secondary">
            Ver cómo funciona
          </Button>
        </div>
        <div className="mt-7 flex items-center gap-3 text-[length:var(--text-sm)] text-text-muted">
          <AvatarGroup people={crew} max={5} size="sm" />
          Menos planillas, menos “¿quién me debía?”, más viaje.
        </div>
      </div>
      <TripPreview />
    </section>
  );
}
