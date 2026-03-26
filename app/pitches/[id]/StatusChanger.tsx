"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUSES = ["pending", "voting", "approved", "rejected", "closed"] as const;
type Status = typeof STATUSES[number];

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "#8e8e93" },
  voting:   { label: "Voting",   color: "#ff9f0a" },
  approved: { label: "Approved", color: "#30d158" },
  rejected: { label: "Rejected", color: "#ff453a" },
  closed:   { label: "Closed",   color: "#636366" },
};

export default function StatusChanger({
  pitchId,
  currentStatus,
}: {
  pitchId: string;
  currentStatus: string;
}) {
  const router  = useRouter();
  const [status, setStatus]   = useState<Status>(currentStatus as Status);
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState<string | null>(null);
  const [saved,  setSaved]    = useState(false);

  async function handleChange(next: Status) {
    if (next === status) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("pitches")
      .update({ status: next })
      .eq("id", pitchId);

    if (err) { setError(err.message); setSaving(false); return; }

    setStatus(next);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-5"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Admin · Change Status
        </p>
        {saving && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Saving…</span>}
        {saved  && <span className="text-xs" style={{ color: "#30d158" }}>Saved ✓</span>}
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const c      = STATUS_CONFIG[s];
          const active = s === status;
          return (
            <button
              key={s}
              disabled={saving}
              onClick={() => handleChange(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-50"
              style={
                active
                  ? { background: c.color + "20", color: c.color, borderColor: c.color + "60" }
                  : { background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: "#ff453a" }}>{error}</p>
      )}
    </div>
  );
}
