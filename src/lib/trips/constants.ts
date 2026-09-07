// No server-only imports here — Phase 2's client-side currency <select>
// imports this module directly, so it must stay safe for the browser bundle.

export const TRIP_ROLES = ["admin", "participant"] as const;
export type TripRole = (typeof TRIP_ROLES)[number];

export function isTripRole(value: string): value is TripRole {
  return (TRIP_ROLES as readonly string[]).includes(value);
}

// Trimmed down from the design's Select, which also shows ARS — adding it
// back later is a one-line change to this list, not a rework.
export const TRIP_CURRENCIES = ["USD", "EUR"] as const;
export type TripCurrency = (typeof TRIP_CURRENCIES)[number];
export const DEFAULT_TRIP_CURRENCY: TripCurrency = "USD";

export function isTripCurrency(value: string): value is TripCurrency {
  return (TRIP_CURRENCIES as readonly string[]).includes(value);
}
