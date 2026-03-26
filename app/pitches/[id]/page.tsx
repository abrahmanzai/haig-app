export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppNav from "@/app/_components/AppNav";
import VotePanel from "./VotePanel";
import StatusChanger from "./StatusChanger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "#8e8e93" },
  voting:   { label: "Voting",   color: "#ff9f0a" },
  approved: { label: "Approved", color: "#30d158" },
  rejected: { label: "Rejected", color: "#ff453a" },
  closed:   { label: "Closed",   color: "#636366" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  buy:  { label: "BUY",  color: "#30d158" },
  sell: { label: "SELL", color: "#ff453a" },
  hold: { label: "HOLD", color: "#ff9f0a" },
};

const THRESHOLD_LABELS: Record<string, string> = {
  simple:                       "Simple majority (>50%)",
  supermajority_two_thirds:     "Supermajority (>66.7%)",
  supermajority_three_quarters: "Supermajority (>75%)",
};

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PitchDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, pitchResult, votesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, voting_units")
      .eq("id", user.id)
      .single(),
    supabase
      .from("pitches")
      .select(`
        id, company_name, ticker, pitch_type, thesis, financials, risks,
        price_target, current_price, vote_threshold, status, created_at,
        profiles:submitted_by ( full_name )
      `)
      .eq("id", params.id)
      .single(),
    supabase
      .from("votes")
      .select("voter_id, vote, voting_units_cast")
      .eq("pitch_id", params.id),
  ]);

  if (pitchResult.error || !pitchResult.data) notFound();

  const profile = profileResult.data;
  const pitch   = pitchResult.data;
  const votes   = votesResult.data ?? [];

  const submitterName =
    Array.isArray(pitch.profiles)
      ? pitch.profiles[0]?.full_name
      : (pitch.profiles as { full_name?: string } | null)?.full_name;

  const statusCfg = STATUS_CONFIG[pitch.status] ?? STATUS_CONFIG.pending;
  const typeCfg   = TYPE_CONFIG[pitch.pitch_type] ?? TYPE_CONFIG.buy;
  const isAdmin   = profile?.role === "admin";
  const canVote   = (profile?.role === "authorized" || profile?.role === "admin") && pitch.status === "voting";

  const userVote = votes.find((v) => v.voter_id === user.id) ?? null;

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/pitches" />

      <main style={{ padding: 0 }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Back link ──────────────────────────────────────────────── */}
          <Link
            href="/pitches"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: "var(--text-tertiary)" }}
          >
            ← Back to Pitches
          </Link>

          {/* ── Pitch header card ──────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] p-6"
            style={{ background: "var(--bg-secondary)" }}
          >
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wider rounded px-2 py-0.5"
                style={{ background: typeCfg.color + "20", color: typeCfg.color }}
              >
                {typeCfg.label}
              </span>
              <span className="font-bold text-2xl" style={{ color: "var(--accent-primary)" }}>
                {pitch.ticker}
              </span>
              <span className="text-xl font-semibold">{pitch.company_name}</span>

              <span className="ml-auto flex-shrink-0">
                <span
                  className="text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1.5"
                  style={{ background: statusCfg.color + "20", color: statusCfg.color }}
                >
                  {statusCfg.label}
                </span>
              </span>
            </div>

            {/* Meta */}
            <div className="flex gap-4 text-xs mb-5 flex-wrap" style={{ color: "var(--text-tertiary)" }}>
              {submitterName && <span>By <strong style={{ color: "var(--text-secondary)" }}>{submitterName}</strong></span>}
              <span>{formatDate(pitch.created_at, { month: "long", day: "numeric", year: "numeric" })}</span>
              <span>Threshold: <strong style={{ color: "var(--text-secondary)" }}>{THRESHOLD_LABELS[pitch.vote_threshold]}</strong></span>
            </div>

            {/* Price targets */}
            {(pitch.current_price || pitch.price_target) && (
              <div className="flex gap-6 mb-5 text-sm">
                {pitch.current_price && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>Current</p>
                    <p className="font-semibold tabular-nums">{usd(Number(pitch.current_price))}</p>
                  </div>
                )}
                {pitch.price_target && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>Target</p>
                    <p className="font-semibold tabular-nums" style={{ color: "var(--accent-green)" }}>
                      {usd(Number(pitch.price_target))}
                    </p>
                  </div>
                )}
                {pitch.current_price && pitch.price_target && (
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "var(--text-tertiary)" }}>Upside</p>
                    <p
                      className="font-semibold tabular-nums"
                      style={{
                        color:
                          Number(pitch.price_target) >= Number(pitch.current_price)
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    >
                      {(
                        ((Number(pitch.price_target) - Number(pitch.current_price)) /
                          Number(pitch.current_price)) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Thesis */}
            <Section title="Investment Thesis">
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {pitch.thesis}
              </p>
            </Section>

            {pitch.financials && (
              <Section title="Key Financials">
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                  {pitch.financials}
                </p>
              </Section>
            )}

            {pitch.risks && (
              <Section title="Key Risks">
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                  {pitch.risks}
                </p>
              </Section>
            )}
          </div>

          {/* ── Admin controls ─────────────────────────────────────────── */}
          {isAdmin && (
            <StatusChanger pitchId={pitch.id} currentStatus={pitch.status} />
          )}

          {/* ── Vote panel ─────────────────────────────────────────────── */}
          <VotePanel
            pitchId={pitch.id}
            pitchStatus={pitch.status}
            voteThreshold={pitch.vote_threshold}
            canVote={canVote}
            userVotingUnits={profile?.voting_units ?? 0}
            initialVotes={votes}
            userVote={userVote}
            userId={user.id}
          />

        </div>
      </main>
    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}
