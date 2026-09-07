/** "1 persona ya está adentro" / "N personas ya están adentro" — used by
 * both the join screen and the trip page's crew summary. */
export function crewCountLabel(count: number): string {
  return count === 1 ? "1 persona ya está adentro" : `${count} personas ya están adentro`;
}

/** Rioplatense-locale currency formatting for a trip's own currency —
 * shared by the Balance tab's per-person, transfer, and total figures. */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);
}
