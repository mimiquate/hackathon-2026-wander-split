import { Card } from "@/components/core";
import { LedgerRow, SettleRow, StatusChip } from "@/components/trip";
import { heroLedger, settleHero, stops } from "@/lib/demo-data";

/** The hero's trip-card mock — status chips, a couple of ledger rows, one settle row. */
export function TripPreview() {
  const routeHeading = stops.map((stop) => stop.city).join(" → ");

  return (
    <Card elevated padding="md">
      <div className="font-mono text-[length:var(--text-eyebrow)] uppercase tracking-[var(--tracking-eyebrow)] text-text-muted">
        12–19 oct · 6 viajeros
      </div>
      <h3 className="mb-[14px] mt-[6px] font-display text-[length:var(--text-md)] font-bold leading-[var(--leading-snug)]">
        {routeHeading}
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusChip state="thinking" />
        <StatusChip state="urgent" />
        <StatusChip state="booked" />
      </div>
      <div className="flex flex-col gap-2">
        {heroLedger.map((entry) => (
          <LedgerRow
            key={entry.label}
            label={entry.label}
            meta={entry.meta}
            amount={entry.amount}
            converted={entry.converted}
            people={entry.people}
            tone="sunken"
          />
        ))}
      </div>
      <div className="mt-4">
        <SettleRow from={settleHero.from} to={settleHero.to} amount={settleHero.amount} />
      </div>
    </Card>
  );
}
