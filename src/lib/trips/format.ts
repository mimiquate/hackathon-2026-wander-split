/** "1 persona ya está adentro" / "N personas ya están adentro" — used by
 * both the join screen and the trip page's crew summary. */
export function crewCountLabel(count: number): string {
  return count === 1 ? "1 persona ya está adentro" : `${count} personas ya están adentro`;
}

/** "US$45,00", "€620,00" — an expense's original or adjusted amount,
 * formatted for the Rioplatense locale this app's copy already uses. */
export function formatMoney(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}
