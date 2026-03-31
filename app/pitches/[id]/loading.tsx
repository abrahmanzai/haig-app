export default function PitchDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <div className="h-4 w-24 rounded mb-6 skeleton" />

      {/* Title + meta */}
      <div className="mb-8">
        <div className="h-8 w-64 rounded-lg mb-3 skeleton" />
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-16 rounded-full skeleton" />
          <div className="h-6 w-20 rounded-full skeleton" />
        </div>
        <div className="h-4 w-48 rounded skeleton" />
      </div>

      {/* Thesis card */}
      <div
        className="rounded-2xl border border-[var(--border)] p-6 mb-6"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-5 w-32 rounded mb-4 skeleton" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded skeleton" />
          <div className="h-3 w-full rounded skeleton" />
          <div className="h-3 w-5/6 rounded skeleton" />
          <div className="h-3 w-3/4 rounded skeleton" />
        </div>
      </div>

      {/* Vote panel skeleton */}
      <div
        className="rounded-2xl border border-[var(--border)] p-6"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-5 w-24 rounded mb-4 skeleton" />
        <div className="h-8 w-full rounded-full mb-3 skeleton" />
        <div className="flex gap-3">
          <div className="h-10 flex-1 rounded-xl skeleton" />
          <div className="h-10 flex-1 rounded-xl skeleton" />
          <div className="h-10 flex-1 rounded-xl skeleton" />
        </div>
      </div>
    </div>
  );
}
