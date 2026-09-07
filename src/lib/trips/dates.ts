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

const SHORT_MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

/** "12 oct" — a compact display date. Reads UTC fields, same as
 * formatCalendarDate, so it's deterministic regardless of host timezone. */
export function formatShortDate(date: Date): string {
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * "recién" / "hace 4 horas" / "hace 2 días" — a human relative timestamp,
 * computed at render time from a real `createdAt`, not a stored string
 * (#23). Reads wall-clock time, unlike this file's other helpers, since
 * it's timing a real instant rather than a calendar date.
 */
export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());

  if (diffMs < MINUTE_MS) return "recién";

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return `hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
  }

  const days = Math.floor(diffMs / DAY_MS);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}
