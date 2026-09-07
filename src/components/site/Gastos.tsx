import { SettleRow } from "@/components/trip";
import { crew, settlements } from "@/lib/demo-data";

// Total + footnote copy reused verbatim from ui_kits/app/ExpensesScreen.jsx's
// own total card — the plan/data.js don't carry a precomputed total.
const TOTAL = "US$834,10";

export function Gastos() {
  const lastIndex = settlements.length - 1;

  return (
    <section
      id="gastos"
      className="scroll-mt-20 border-t border-border px-10 py-[var(--section-gap)]"
    >
      <div className="mx-auto max-w-[var(--page-max)]">
        <h2 className="font-display text-[length:var(--text-lg)] font-semibold">
          Gastos
        </h2>
        <div className="mt-6 font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
          Total del viaje
        </div>
        <div className="mt-1 font-mono text-[1.9rem] tabular-nums">{TOTAL}</div>
        <p className="mt-[2px] text-[length:var(--text-sm)] text-text-muted">
          US$139,02 por persona · vos pusiste{" "}
          <strong className="font-mono">US$189,00</strong>
        </p>
        <div className="mt-6 flex max-w-md flex-col gap-2">
          {settlements.map((settlement, i) => (
            <SettleRow
              key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
              from={crew[settlement.from]}
              to={crew[settlement.to]}
              amount={settlement.amount}
              done={i === lastIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
