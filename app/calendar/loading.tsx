export default function CalendarLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="h-8 w-36 rounded-lg bg-[var(--bg-tertiary)] mb-6 animate-pulse" />

      <div
        className="rounded-2xl border border-[var(--border)] p-6 animate-pulse"
        style={{ background: "var(--bg-glass)", height: 420 }}
      />
    </div>
  );
}
