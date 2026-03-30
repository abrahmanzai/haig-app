export default function PitchesLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-40 rounded-lg bg-[var(--bg-tertiary)] animate-pulse" />
        <div className="h-10 w-32 rounded-xl bg-[var(--bg-tertiary)] animate-pulse" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] p-5 animate-pulse"
            style={{ background: "var(--bg-glass)", height: 180 }}
          >
            <div className="h-5 w-16 rounded bg-[var(--bg-tertiary)] mb-3" />
            <div className="h-4 w-40 rounded bg-[var(--bg-tertiary)] mb-2" />
            <div className="h-3 w-full rounded bg-[var(--bg-tertiary)] mb-1" />
            <div className="h-3 w-3/4 rounded bg-[var(--bg-tertiary)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
