export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/app/_components/AppNav";
import { FileText, ChevronRight } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pending",  color: "#8e8e93" },
  voting:   { label: "Voting",   color: "#5E6AD2" },
  approved: { label: "Approved", color: "#30d158" },
  rejected: { label: "Rejected", color: "#ff453a" },
  closed:   { label: "Closed",   color: "#636366" },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  buy:  { label: "BUY",  color: "#30d158" },
  sell: { label: "SELL", color: "#ff453a" },
  hold: { label: "HOLD", color: "#ff9f0a" },
};

const ALL_STATUSES = ["all", "pending", "voting", "approved", "rejected", "closed"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Pitches({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, pitchesResult] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase
      .from("pitches")
      .select(`
        id, company_name, ticker, pitch_type, thesis,
        price_target, current_price, status, created_at,
        profiles:submitted_by ( full_name )
      `)
      .order("created_at", { ascending: false }),
  ]);

  const profile    = profileResult.data;
  const allPitches = pitchesResult.data ?? [];

  const activeStatus = ALL_STATUSES.includes(searchParams.status ?? "")
    ? (searchParams.status ?? "all")
    : "all";

  const pitches =
    activeStatus === "all"
      ? allPitches
      : allPitches.filter((p) => p.status === activeStatus);

  const canSubmit = profile?.role === "authorized" || profile?.role === "admin";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/pitches" />

      <main style={{ padding: 0 }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-6">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Pitches
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Active investment proposals and community voting pipeline.
              </p>
            </div>
            {canSubmit && (
              <Link
                href="/pitches/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 hover:opacity-90"
                style={{
                  background: "#5E6AD2",
                  boxShadow: "0 4px 16px rgba(94,106,210,0.25)",
                }}
              >
                + New Pitch
              </Link>
            )}
          </div>

          {/* ── Status filter tabs ───────────────────────────────────────── */}
          <div
            className="flex gap-2 flex-wrap pb-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            {ALL_STATUSES.map((s) => {
              const active = s === activeStatus;
              const cfg    = s !== "all" ? STATUS_CONFIG[s] : null;
              const count  = s !== "all" ? allPitches.filter((p) => p.status === s).length : null;
              return (
                <Link
                  key={s}
                  href={s === "all" ? "/pitches" : `/pitches?status=${s}`}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize flex items-center gap-2"
                  style={
                    active
                      ? {
                          background: cfg ? cfg.color + "18" : "var(--bg-tertiary)",
                          color: cfg ? cfg.color : "#EDEDEF",
                        }
                      : { background: "transparent", color: "var(--text-secondary)" }
                  }
                >
                  {s}
                  {count !== null && count > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold geist-mono"
                      style={{ background: "#5E6AD2", color: "#fff" }}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Pitch cards ──────────────────────────────────────────────── */}
          {pitches.length === 0 ? (
            <div
              className="rounded-2xl border p-12 text-center"
              style={{ background: "var(--bg-glass)", borderColor: "var(--border)" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--bg-tertiary)" }}
              >
                <FileText size={22} style={{ color: "var(--text-secondary)" }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No pitches yet</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {canSubmit
                  ? "Be the first to submit an investment pitch."
                  : "Pitches will appear here once authorized members submit them."}
              </p>
              {canSubmit && (
                <Link
                  href="/pitches/new"
                  className="mt-5 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                  style={{ background: "#5E6AD2" }}
                >
                  Submit First Pitch
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {pitches.map((pitch) => {
                const statusCfg = STATUS_CONFIG[pitch.status] ?? STATUS_CONFIG.pending;
                const typeCfg   = TYPE_CONFIG[pitch.pitch_type] ?? TYPE_CONFIG.buy;
                const submitterName =
                  Array.isArray(pitch.profiles)
                    ? pitch.profiles[0]?.full_name
                    : (pitch.profiles as { full_name?: string } | null)?.full_name;

                // Voting progress: treat approved as 100%, rejected as 0, others unknown
                const isApproved = pitch.status === "approved";
                const isRejected = pitch.status === "rejected";
                const showBar    = pitch.status === "voting" || isApproved || isRejected;
                const barPct     = isApproved ? 100 : isRejected ? 100 : 50;

                return (
                  <Link
                    key={pitch.id}
                    href={`/pitches/${pitch.id}`}
                    className="group relative overflow-hidden flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl transition-all"
                    style={{
                      background: "var(--bg-glass)",
                      border: "1px solid var(--border)",
                      backdropFilter: "blur(12px)",
                      borderLeft: `4px solid ${statusCfg.color}`,
                    }}
                  >
                    {/* Ticker + type + company */}
                    <div className="min-w-[160px] flex-shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold geist-mono" style={{ color: "var(--text-primary)" }}>
                          {pitch.ticker}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight geist-mono"
                          style={{ background: typeCfg.color + "20", color: typeCfg.color }}
                        >
                          {typeCfg.label}
                        </span>
                      </div>
                      <p className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                        {pitch.company_name}
                      </p>
                    </div>

                    {/* Data grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                      {/* Current price */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider geist-mono mb-1 font-bold" style={{ color: "var(--text-secondary)" }}>
                          Current Price
                        </p>
                        <p className="text-sm geist-mono" style={{ color: "var(--text-primary)" }}>
                          {pitch.current_price ? `$${Number(pitch.current_price).toFixed(2)}` : "—"}
                        </p>
                      </div>

                      {/* Target */}
                      <div>
                        <p className="text-[10px] uppercase tracking-wider geist-mono mb-1 font-bold" style={{ color: "var(--text-secondary)" }}>
                          Target
                        </p>
                        <p className="text-sm geist-mono" style={{ color: "var(--text-primary)" }}>
                          {pitch.price_target ? `$${Number(pitch.price_target).toFixed(2)}` : "—"}
                        </p>
                      </div>

                      {/* Progress / status bar — spans 2 cols */}
                      <div className="md:col-span-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-wider geist-mono mb-1 font-bold" style={{ color: "var(--text-secondary)" }}>
                          <span>{showBar ? (isApproved ? "Outcome" : isRejected ? "Outcome" : "Voting Progress") : "Thesis"}</span>
                          <span style={{ color: isApproved ? "#30d158" : isRejected ? "#ff453a" : "#EDEDEF" }}>
                            {isApproved ? "APPROVED" : isRejected ? "REJECTED" : pitch.status.toUpperCase()}
                          </span>
                        </div>
                        {showBar ? (
                          <div
                            className="w-full h-1.5 rounded-full overflow-hidden"
                            style={{ background: isApproved ? "rgba(48,209,88,0.15)" : isRejected ? "rgba(255,69,58,0.15)" : "var(--bg-tertiary)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barPct}%`,
                                background: isApproved ? "#30d158" : isRejected ? "#ff453a" : "#5E6AD2",
                              }}
                            />
                          </div>
                        ) : (
                          <p
                            className="text-xs truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {pitch.thesis}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: submitter + date + chevron */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        {submitterName && (
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                            {submitterName.split(" ")[0]}
                          </p>
                        )}
                        <p className="text-[10px] geist-mono" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(pitch.created_at)}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Non-authorized notice ─────────────────────────────────────── */}
          {!canSubmit && (
            <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
              Pitch submission and voting are available to Authorized Members.
              Contact an admin to request access.
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
