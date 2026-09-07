import { Card } from "@/components/core";
import { LedgerRow, SettleRow, StatusChip } from "@/components/trip";
import { crew, expenses, settlements, stops } from "@/lib/demo-data";

/** The hero's trip-card mock — status chips, a couple of ledger rows, one settle row. */
export function TripPreview() {
  const heroExpenses = expenses.slice(0, 2);
  const heroSettlement = settlements[0];
  const routeHeading = stops.map((stop) => stop.city).join(" → ");

  return (
    <Card elevated padding="md">
      <div className="font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
        12–19 oct · 6 viajeros
      </div>
      <h3 className="mb-[14px] mt-[6px] font-display text-[1.15rem] font-bold">
        {routeHeading}
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChip state="thinking" />
        <StatusChip state="urgent" />
        <StatusChip state="booked" />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        {heroExpenses.map((expense) => (
          <LedgerRow
            key={expense.label}
            label={expense.label}
            meta={expense.meta}
            amount={expense.amount}
            converted={expense.converted}
            tone="sunken"
          />
        ))}
      </div>
      <SettleRow
        from={crew[heroSettlement.from]}
        to={crew[heroSettlement.to]}
        amount={heroSettlement.amount}
      />
    </Card>
  );
}
