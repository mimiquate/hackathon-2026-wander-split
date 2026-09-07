import { Card, Icon } from "@/components/core";
import { SettleRow } from "@/components/trip";
import { gastosTotal, settlements } from "@/lib/demo-data";

const BULLETS = [
  {
    icon: "file-text",
    text: "El tipo de cambio lo sacamos de tu resumen bancario, no de una tabla genérica.",
  },
  { icon: "users", text: "Gastos parciales: 4 de 6, sin cuentas aparte." },
  { icon: "check-check", text: "Cada transferencia se marca como saldada." },
];

export function Gastos() {
  return (
    <section
      id="gastos"
      className="scroll-mt-20 grid grid-cols-1 items-center gap-12 border-t border-border bg-surface px-[var(--gutter)] py-[var(--section-gap)] md:grid-cols-[0.95fr_1.05fr]"
    >
      <div>
        <div className="font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
          Saldar
        </div>
        <h2 className="mt-3 text-balance font-display text-[length:var(--text-xl)] font-bold leading-[var(--leading-tight)] tracking-[var(--tracking-display)]">
          Tres transferencias y listo
        </h2>
        <p className="mt-4 max-w-[46ch] text-pretty text-text-muted">
          Cargás el gasto, marcás quién estuvo, y nosotros lo cruzamos todo.
          En vez de doce pagos cruzados te queda una lista corta, en una sola
          moneda.
        </p>
        <div className="mt-[22px] flex flex-col gap-[10px] text-[length:var(--text-sm)] text-text-muted">
          {BULLETS.map((bullet) => (
            <div key={bullet.icon} className="flex items-center gap-[10px]">
              <Icon name={bullet.icon} size={16} />
              <span>{bullet.text}</span>
            </div>
          ))}
        </div>
      </div>
      <Card elevated padding="md">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[length:var(--text-md)] font-bold">
            Cómo queda la cuenta
          </h3>
          <span className="font-mono text-[length:var(--text-xs)] text-text-muted">
            {gastosTotal}
          </span>
        </div>
        <div className="mt-[14px] flex flex-col gap-[10px]">
          {settlements.map((settlement) => (
            <SettleRow
              key={`${settlement.from.name}-${settlement.to.name}-${settlement.amount}`}
              from={settlement.from}
              to={settlement.to}
              amount={settlement.amount}
              done={settlement.done}
            />
          ))}
        </div>
        <p className="mt-4 text-[length:var(--text-sm)] text-text-muted">
          De 12 pagos cruzados a 3. El resto ya está en cero.
        </p>
      </Card>
    </section>
  );
}
