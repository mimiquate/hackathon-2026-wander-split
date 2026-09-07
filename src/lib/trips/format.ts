/** "1 persona ya está adentro" / "N personas ya están adentro" — used by
 * both the join screen and the trip page's crew summary. */
export function crewCountLabel(count: number): string {
  return count === 1 ? "1 persona ya está adentro" : `${count} personas ya están adentro`;
}

/** "1 viajero" / "N viajeros" — the trip card's compact traveler count. */
export function travelerCountLabel(count: number): string {
  return count === 1 ? "1 viajero" : `${count} viajeros`;
}

/** "1 viaje" / "N viajes" — the dashboard's aggregate eyebrow line. */
export function tripCountLabel(count: number): string {
  return count === 1 ? "1 viaje" : `${count} viajes`;
}
