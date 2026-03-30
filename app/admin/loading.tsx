export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="h-8 w-40 rounded-lg bg-[var(--bg-tertiary)] mb-2 animate-pulse" />
      <div className="h-4 w-56 rounded bg-[var(--bg-tertiary)] mb-8 animate-pulse" />

      {/* Tab bar skeleton */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--bg-secondary)" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-lg animate-pulse"
            style={{ background: "var(--bg-tertiary)", width: i === 0 ? 90 : i === 1 ? 80 : i === 2 ? 80 : 70 }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden animate-pulse"
        style={{ background: "var(--bg-glass)" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)]"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-48 rounded bg-[var(--bg-tertiary)]" />
            </div>
            <div className="h-6 w-20 rounded-full bg-[var(--bg-tertiary)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
