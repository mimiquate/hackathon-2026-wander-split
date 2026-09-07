const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses the "YYYY-MM-DD" value an `<input type="date">` submits into the
 * UTC-midnight Date a `@db.Date` column round-trips without drifting a day.
 *
 * Returns null for anything that isn't a real calendar date. The format-back
 * comparison is load-bearing: V8 silently rolls an impossible date over into
 * the next one (e.g. "2026-02-31" becomes March 3rd) instead of failing, so
 * a regex + NaN check alone isn't enough.
 */
export function parseCalendarDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!CALENDAR_DATE_PATTERN.test(trimmed)) return null;

  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (formatCalendarDate(date) !== trimmed) return null;

  return date;
}

/** Formats a Date back into the "YYYY-MM-DD" shape, reading UTC fields so it
 * inverts parseCalendarDate regardless of the host machine's timezone. */
export function formatCalendarDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
