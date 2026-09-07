import { Button } from "@/components/core";

const REASSURANCES = [
  "Sin límite de viajeros",
  "Sin tarjeta",
  "Desde el navegador, sin instalar nada",
];

export function FinalCta() {
  return (
    <section
      id="precios"
      className="scroll-mt-20 border-t border-border bg-surface px-[var(--gutter)] py-[var(--section-gap)]"
    >
      <div className="mx-auto max-w-[620px] text-center">
        <div className="font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
          Beta abierta
        </div>
        <h2 className="mt-3 text-balance font-display text-[length:var(--text-xl)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          ¿Tenés un viaje en el grupo?
        </h2>
        <p className="mt-[14px] text-text-muted">
          Armalo en dos minutos y compartí el link con tu banda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-[10px]">
          <Button size="lg" iconRight="arrow-right">
            Armá tu primer viaje
          </Button>
        </div>
        <div className="mt-[22px] flex flex-wrap justify-center gap-[18px] font-mono text-[length:var(--text-xs)] text-text-muted">
          {REASSURANCES.flatMap((text, i) => [
            i > 0 ? (
              <span key={`dot-${i}`} aria-hidden="true">
                ·
              </span>
            ) : null,
            <span key={text}>{text}</span>,
          ])}
        </div>
      </div>
    </section>
  );
}
