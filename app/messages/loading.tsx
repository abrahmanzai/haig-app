export default function MessagesLoading() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar skeleton */}
      <div className="flex gap-1 px-4 pt-4 pb-0 border-b border-[var(--border)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-t-xl skeleton"
            style={{ background: "var(--bg-tertiary)", width: i === 2 ? 140 : 120 }}
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="flex-1 px-5 py-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] p-5"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 rounded-full" />
              <div className="h-4 w-32 rounded skeleton" />
              <div className="ml-auto h-3 w-16 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded skeleton" />
              <div className="h-3 w-3/4 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
