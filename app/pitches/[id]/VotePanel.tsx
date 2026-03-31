"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Vote {
  voter_id: string;
  voter_name?: string | null; // only populated for admin
  vote: string;
  voting_units_cast: number;
}

interface Props {
  pitchId: string;
  pitchStatus: string;
  voteThreshold: string;
  canVote: boolean;
  isAdmin: boolean;
  userVotingUnits: number;
  initialVotes: Vote[];
  userVote: Vote | null;
  userId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THRESHOLD_REQUIRED: Record<string, number> = {
  simple:                       0.5,
  supermajority_two_thirds:     2 / 3,
  supermajority_three_quarters: 0.75,
};

const THRESHOLD_LABELS: Record<string, string> = {
  simple:                       "Simple majority (>50%)",
  supermajority_two_thirds:     "Supermajority (>66.7%)",
  supermajority_three_quarters: "Supermajority (>75%)",
};

function tally(votes: Vote[]) {
  let yes = 0, no = 0, abstain = 0;
  for (const v of votes) {
    if      (v.vote === "yes")     yes     += Number(v.voting_units_cast);
    else if (v.vote === "no")      no      += Number(v.voting_units_cast);
    else                           abstain += Number(v.voting_units_cast);
  }
  return { yes, no, abstain, total: yes + no + abstain };
}

function didPass(t: { yes: number; no: number }, threshold: string): boolean | null {
  const decisive = t.yes + t.no;
  if (decisive === 0) return null;
  return t.yes / decisive > (THRESHOLD_REQUIRED[threshold] ?? 0.5);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VotePanel({
  pitchId, pitchStatus, voteThreshold,
  canVote, isAdmin, userVotingUnits,
  initialVotes, userVote: initialUserVote, userId,
}: Props) {
  const router = useRouter();
  const [votes,   setVotes]   = useState<Vote[]>(initialVotes);
  const [myVote,  setMyVote]  = useState<Vote | null>(initialUserVote);
  const [casting, setCasting] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const t      = tally(votes);
  const result = didPass(t, voteThreshold);

  const isVoting   = pitchStatus === "voting";
  const isResolved = pitchStatus === "approved" || pitchStatus === "rejected";

  async function castVote(choice: "yes" | "no" | "abstain") {
    if (!canVote) return;
    setCasting(choice);
    setError(null);

    const supabase = createClient();
    const units = Number(userVotingUnits);

    if (myVote) {
      const { error: err } = await supabase
        .from("votes")
        .update({ vote: choice, voting_units_cast: units })
        .eq("pitch_id", pitchId)
        .eq("voter_id", userId);
      if (err) { setError(err.message); setCasting(null); return; }
      setVotes((prev) =>
        prev.map((v) => v.voter_id === userId ? { ...v, vote: choice, voting_units_cast: units } : v)
      );
    } else {
      const { error: err } = await supabase
        .from("votes")
        .insert({ pitch_id: pitchId, voter_id: userId, vote: choice, voting_units_cast: units });
      if (err) { setError(err.message); setCasting(null); return; }
      setVotes((prev) => [...prev, { voter_id: userId, vote: choice, voting_units_cast: units }]);
    }

    setMyVote({ voter_id: userId, vote: choice, voting_units_cast: units });
    setCasting(null);
    router.refresh();
  }

  // Nothing to show for pending pitches with no votes yet
  if (!isVoting && !isResolved && votes.length === 0) {
    return (
      <div
        className="rounded-2xl border border-[var(--border)] p-6"
        style={{ background: "var(--bg-secondary)" }}
      >
        <h2 className="font-semibold mb-2">Votes</h2>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Voting hasn't opened yet — an admin will open voting when ready.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[var(--border)] p-6 space-y-5"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* ── Header + live pass/fail indicator ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-semibold">Votes</h2>
        {result !== null && isVoting && (
          <span
            className="text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1.5"
            style={
              result
                ? { background: "rgba(48,209,88,0.15)", color: "var(--accent-green)" }
                : { background: "rgba(255,69,58,0.15)", color: "var(--accent-red)" }
            }
          >
            {result ? "Passing" : "Failing"}
          </span>
        )}
      </div>

      {/* ── Final outcome banner (approved / rejected) ────────────────────── */}
      {isResolved && (
        <div
          className="rounded-xl p-4 border"
          style={
            pitchStatus === "approved"
              ? { background: "rgba(48,209,88,0.08)", borderColor: "rgba(48,209,88,0.3)" }
              : { background: "rgba(255,69,58,0.08)", borderColor: "rgba(255,69,58,0.3)" }
          }
        >
          <p className="font-semibold text-sm mb-1" style={{ color: pitchStatus === "approved" ? "var(--accent-green)" : "var(--accent-red)" }}>
            {pitchStatus === "approved" ? "✓ Pitch Approved" : "✗ Pitch Rejected"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Threshold used: {THRESHOLD_LABELS[voteThreshold]} ·{" "}
            {(t.yes + t.no) > 0
              ? `${((t.yes / (t.yes + t.no)) * 100).toFixed(1)}% yes of decisive votes`
              : "No decisive votes cast"}
          </p>
        </div>
      )}

      {/* ── Combined segmented progress bar with threshold marker ──────────── */}
      {(() => {
        const yesPct     = t.total > 0 ? (t.yes     / t.total) * 100 : 0;
        const noPct      = t.total > 0 ? (t.no      / t.total) * 100 : 0;
        const abstainPct = t.total > 0 ? (t.abstain / t.total) * 100 : 0;
        const required   = THRESHOLD_REQUIRED[voteThreshold] ?? 0.5;
        // Threshold applies to decisive votes only (yes + no)
        const decisive   = t.yes + t.no;
        const thresholdOnBar = decisive > 0
          ? (required * decisive / t.total) * 100
          : required * 100;

        return (
          <div className="space-y-2">
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
              {/* Yes segment */}
              <div
                className="absolute left-0 top-0 h-full transition-all duration-500"
                style={{ width: `${yesPct}%`, background: "#30d158" }}
              />
              {/* No segment */}
              <div
                className="absolute top-0 h-full transition-all duration-500"
                style={{ left: `${yesPct}%`, width: `${noPct}%`, background: "#ff453a" }}
              />
              {/* Abstain segment */}
              <div
                className="absolute top-0 h-full transition-all duration-500"
                style={{ left: `${yesPct + noPct}%`, width: `${abstainPct}%`, background: "#8e8e93" }}
              />
              {/* Threshold marker */}
              {t.total > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5"
                  style={{
                    left: `${Math.min(thresholdOnBar, 99)}%`,
                    background: "rgba(255,255,255,0.9)",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }}
                  title={`${THRESHOLD_LABELS[voteThreshold]} threshold`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "Yes",     value: t.yes,     color: "#30d158", pct: yesPct },
                { label: "No",      value: t.no,      color: "#ff453a", pct: noPct },
                { label: "Abstain", value: t.abstain, color: "#8e8e93", pct: abstainPct },
              ].map(({ label, value, color, pct }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span className="tabular-nums font-semibold" style={{ color }}>
                    {value.toFixed(4)} ({pct.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {votes.length} voter{votes.length !== 1 ? "s" : ""} · {t.total.toFixed(4)} total units cast
        {" "}· Threshold: {THRESHOLD_LABELS[voteThreshold]}
      </p>

      {/* ── Cast / change vote (active voting, eligible users) ────────────── */}
      {canVote && isVoting && (
        <div className="pt-2 border-t border-[var(--border)] space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            {myVote ? "Change Your Vote" : "Cast Your Vote"}
          </p>
          {myVote && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Current: <strong style={{ color: "var(--accent-primary)" }}>{myVote.vote.toUpperCase()}</strong>
              {" "}({Number(myVote.voting_units_cast).toFixed(4)} units)
            </p>
          )}
          <div className="flex gap-3">
            {(["yes", "no", "abstain"] as const).map((choice) => {
              const colors = { yes: "#30d158", no: "#ff453a", abstain: "#8e8e93" };
              const mine   = myVote?.vote === choice;
              const color  = colors[choice];
              return (
                <button
                  key={choice}
                  onClick={() => castVote(choice)}
                  disabled={!!casting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold uppercase border transition-all disabled:opacity-50"
                  style={
                    mine
                      ? { background: color + "25", color, borderColor: color + "70" }
                      : { background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }
                  }
                >
                  {casting === choice ? "…" : choice}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!canVote && isVoting && (
        <p className="text-xs pt-2 border-t border-[var(--border)]" style={{ color: "var(--text-tertiary)" }}>
          Only Authorized Members can vote.
        </p>
      )}

      {/* ── Admin audit: individual votes (names visible only to admin) ───── */}
      {isAdmin && votes.length > 0 && (
        <div className="pt-3 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
            Admin Audit — Individual Votes
          </p>
          <div className="space-y-2">
            {votes.map((v) => {
              const voteColors = { yes: "#30d158", no: "#ff453a", abstain: "#8e8e93" };
              const color = voteColors[v.vote as keyof typeof voteColors] ?? "#8e8e93";
              return (
                <div
                  key={v.voter_id}
                  className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {v.voter_name ?? "Unknown Member"}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {Number(v.voting_units_cast).toFixed(4)} units
                    </span>
                    <span
                      className="font-semibold uppercase w-14 text-center rounded px-1.5 py-0.5"
                      style={{ background: color + "20", color }}
                    >
                      {v.vote}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm rounded-xl p-3" style={{ background: "rgba(255,69,58,0.10)", color: "var(--accent-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
