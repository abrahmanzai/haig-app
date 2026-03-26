export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  // Handle both "YYYY-MM-DD" and full ISO timestamps
  const d = dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr;
  return new Date(d).toLocaleDateString("en-US", options ?? {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatLongDate(dateStr: string): string {
  const d = dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr;
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}
