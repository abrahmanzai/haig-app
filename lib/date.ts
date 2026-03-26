/**
 * Centralized date formatting utilities.
 *
 * Server-side: timezone is determined by the TZ environment variable (America/Chicago).
 * Client-side: timezone is the browser's local timezone.
 *
 * Date-only strings (YYYY-MM-DD) have "T00:00:00" appended before parsing
 * to force local-midnight interpretation and prevent UTC-offset day shifts.
 * Full ISO timestamps are parsed as-is — they carry their own timezone info.
 */

function normalize(dateStr: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + "T00:00:00" : dateStr;
}

export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
): string {
  return new Date(normalize(dateStr)).toLocaleDateString("en-US", options);
}

export function formatLongDate(dateStr: string): string {
  return formatDate(dateStr, { weekday: "long", month: "long", day: "numeric" });
}

/**
 * Returns today's date as YYYY-MM-DD in the active timezone.
 * Server-side: respects TZ env var. Client-side: uses the browser's timezone.
 * Use this instead of new Date().toISOString().split("T")[0] which gives UTC.
 */
export function getTodayStr(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
