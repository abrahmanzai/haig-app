export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="h-8 w-48 rounded-lg mb-2 skeleton" />
      <div className="h-4 w-64 rounded mb-8 skeleton" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border)] p-5"
            style={{ background: "var(--bg-glass)" }}
          >
            <div className="h-3 w-20 rounded mb-3 skeleton" />
            <div className="h-7 w-28 rounded skeleton" />
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl border border-[var(--border)] p-6"
        style={{ background: "var(--bg-glass)", height: 200 }}
      />
    </div>
  );
}
