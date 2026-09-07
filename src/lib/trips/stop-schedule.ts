import { formatCalendarDate, parseCalendarDate } from "@/lib/trips/dates";
import type { TripStopData } from "@/lib/trips/stops";

export interface DisplayStop extends TripStopData {
  computedStartDate: string; // "YYYY-MM-DD"
  computedEndDate: string; // "YYYY-MM-DD"
}

/** Derives each stop's date range from the trip's start date plus every
 * earlier stop's nights — dates are never stored, only computed. */
export function computeStopDates(stops: TripStopData[], tripStartDate: string): DisplayStop[] {
  const startDate = parseCalendarDate(tripStartDate);
  if (!startDate) return [];

  return stops.map((stop) => {
    const nightsBeforeThisStop = stops
      .filter((s) => s.position < stop.position)
      .reduce((sum, s) => sum + s.nights, 0);

    const computedStart = new Date(startDate);
    computedStart.setDate(computedStart.getDate() + nightsBeforeThisStop);

    const computedEnd = new Date(computedStart);
    computedEnd.setDate(computedEnd.getDate() + stop.nights);

    return {
      ...stop,
      computedStartDate: formatCalendarDate(computedStart),
      computedEndDate: formatCalendarDate(computedEnd),
    };
  });
}
