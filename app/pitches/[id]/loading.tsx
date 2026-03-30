export default function PitchDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <div className="h-4 w-24 rounded bg-[var(--bg-tertiary)] mb-6 animate-pulse" />

      {/* Title + meta */}
      <div className="mb-8">
        <div className="h-8 w-64 rounded-lg bg-[var(--bg-tertiary)] mb-3 animate-pulse" />
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-16 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
        </div>
        <div className="h-4 w-48 rounded bg-[var(--bg-tertiary)] animate-pulse" />
      </div>

      {/* Thesis card */}
      <div
        className="rounded-2xl border border-[var(--border)] p-6 mb-6 animate-pulse"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-5 w-32 rounded bg-[var(--bg-tertiary)] mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-full rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-5/6 rounded bg-[var(--bg-tertiary)]" />
          <div className="h-3 w-3/4 rounded bg-[var(--bg-tertiary)]" />
        </div>
      </div>

      {/* Vote panel skeleton */}
      <div
        className="rounded-2xl border border-[var(--border)] p-6 animate-pulse"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-5 w-24 rounded bg-[var(--bg-tertiary)] mb-4" />
        <div className="h-8 w-full rounded-full bg-[var(--bg-tertiary)] mb-3" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-xl bg-[var(--bg-tertiary)]" />
          <div className="h-10 flex-1 rounded-xl bg-[var(--bg-tertiary)]" />
          <div className="h-10 flex-1 rounded-xl bg-[var(--bg-tertiary)]" />
        </div>
      </div>
    </div>
  );
}
