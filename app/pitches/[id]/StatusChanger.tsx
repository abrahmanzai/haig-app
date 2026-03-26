"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Vote {
  vote: string;
  voting_units_cast: number;
}

interface Props {
  pitchId: string;
  currentStatus: string;
  voteThreshold: string;
  votes: Vote[];
}

const THRESHOLD_REQUIRED: Record<string, number> = {
  simple:                       0.5,
  supermajority_two_thirds:     2 / 3,
  supermajority_three_quarters: 0.75,
};

const THRESHOLD_LABELS: Record<string, string> = {
  simple:                       ">50%",
  supermajority_two_thirds:     ">66.7%",
  supermajority_three_quarters: ">75%",
};

function resolveOutcome(votes: Vote[], threshold: string): "approved" | "rejected" {
  let yes = 0, no = 0;
  for (const v of votes) {
    if (v.vote === "yes")      yes += Number(v.voting_units_cast);
    else if (v.vote === "no")  no  += Number(v.voting_units_cast);
  }
  const decisive = yes + no;
  const required = THRESHOLD_REQUIRED[threshold] ?? 0.5;
  if (decisive === 0) return "rejected"; // no decisive votes → reject
  return yes / decisive > required ? "approved" : "rejected";
}

export default function StatusChanger({ pitchId, currentStatus, voteThreshold, votes }: Props) {
  const router = useRouter();
  const [status,  setStatus]  = useState(currentStatus);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateStatus(next: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("pitches")
      .update({ status: next })
      .eq("id", pitchId);

    if (err) { setError(err.message); setSaving(false); return; }

    setStatus(next);
    setSaving(false);
    setMessage(next === "approved" ? "Approved ✓" : next === "rejected" ? "Rejected ✗" : "Updated ✓");
    setTimeout(() => setMessage(null), 3000);
    router.refresh();
  }

  async function closeVoting() {
    const outcome = resolveOutcome(votes, voteThreshold);
    await updateStatus(outcome);
  }

  const required = THRESHOLD_LABELS[voteThreshold] ?? ">50%";

  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-5 space-y-3"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Admin · Vote Controls
        </p>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Saving…</span>}
          {message && (
            <span
              className="text-xs font-semibold"
              style={{ color: message.includes("Approved") ? "#30d158" : message.includes("Rejected") ? "#ff453a" : "#30d158" }}
            >
              {message}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {/* Open Voting — only from pending */}
        {status === "pending" && (
          <button
            onClick={() => updateStatus("voting")}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 hover:brightness-110"
            style={{ background: "rgba(255,159,10,0.15)", color: "#ff9f0a", borderColor: "rgba(255,159,10,0.4)" }}
          >
            Open Voting →
          </button>
        )}

        {/* Close Voting — auto-resolves based on threshold */}
        {status === "voting" && (
          <div className="flex flex-col gap-1">
            <button
              onClick={closeVoting}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50 hover:brightness-110"
              style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff", borderColor: "rgba(10,132,255,0.4)" }}
            >
              Close Voting &amp; Resolve
            </button>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Threshold: {required} yes of decisive votes
            </p>
          </div>
        )}

        {/* Manual override — reopen or close manually after resolution */}
        {(status === "approved" || status === "rejected" || status === "closed") && (
          <>
            <button
              onClick={() => updateStatus("voting")}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
              style={{ background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }}
            >
              Reopen Voting
            </button>
            <button
              onClick={() => updateStatus("closed")}
              disabled={saving || status === "closed"}
              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
              style={{ background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }}
            >
              Archive
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#ff453a" }}>{error}</p>
      )}
    </div>
  );
}
