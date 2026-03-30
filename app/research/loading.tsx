export default function ResearchLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-8 w-48 rounded-lg bg-[var(--bg-tertiary)] mb-6 animate-pulse" />

      <div
        className="rounded-2xl border border-[var(--border)] p-5 mb-6 animate-pulse"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-11 w-full rounded-xl bg-[var(--bg-tertiary)]" />
      </div>

      <div
        className="rounded-2xl border border-[var(--border)] p-6 animate-pulse"
        style={{ background: "var(--bg-glass)", height: 300 }}
      />
    </div>
  );
}
