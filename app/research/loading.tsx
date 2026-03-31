export default function ResearchLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-8 w-48 rounded-lg mb-6 skeleton" />

      <div
        className="rounded-2xl border border-[var(--border)] p-5 mb-6"
        style={{ background: "var(--bg-glass)" }}
      >
        <div className="h-11 w-full rounded-xl skeleton" />
      </div>

      <div
        className="rounded-2xl border border-[var(--border)] p-6"
        style={{ background: "var(--bg-glass)", height: 300 }}
      />
    </div>
  );
}
