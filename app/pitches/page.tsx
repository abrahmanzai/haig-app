export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/app/_components/AppNav";

// ─── Config ───────────────────────────────────────────────────────────────────

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

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

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

  const profile  = profileResult.data;
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Investment Pitches</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {allPitches.length} pitch{allPitches.length !== 1 ? "es" : ""} total
              </p>
            </div>
            {canSubmit && (
              <Link
                href="/pitches/new"
                className="px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                style={{ background: "var(--accent-primary)" }}
              >
                + Submit Pitch
              </Link>
            )}
          </div>

          {/* ── Status filter tabs ───────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.map((s) => {
              const active = s === activeStatus;
              const cfg    = s !== "all" ? STATUS_CONFIG[s] : null;
              return (
                <Link
                  key={s}
                  href={s === "all" ? "/pitches" : `/pitches?status=${s}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize"
                  style={
                    active
                      ? {
                          background: cfg ? cfg.color + "20" : "var(--bg-tertiary)",
                          color: cfg ? cfg.color : "var(--text-primary)",
                          borderColor: cfg ? cfg.color + "55" : "var(--border-hover)",
                        }
                      : { background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }
                  }
                >
                  {s}
                  {s !== "all" && (
                    <span className="ml-1 opacity-70">
                      ({allPitches.filter((p) => p.status === s).length})
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Pitch cards ──────────────────────────────────────────────── */}
          {pitches.length === 0 ? (
            <div
              className="rounded-2xl border border-[var(--border)] p-12 text-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <p className="text-2xl mb-3">📋</p>
              <p className="font-semibold mb-1">No pitches yet</p>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                {canSubmit
                  ? "Be the first to submit an investment pitch."
                  : "Pitches will appear here once authorized members submit them."}
              </p>
              {canSubmit && (
                <Link
                  href="/pitches/new"
                  className="mt-4 inline-block px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                  style={{ background: "var(--accent-primary)" }}
                >
                  Submit First Pitch
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {pitches.map((pitch) => {
                const statusCfg = STATUS_CONFIG[pitch.status] ?? STATUS_CONFIG.pending;
                const typeCfg   = TYPE_CONFIG[pitch.pitch_type] ?? TYPE_CONFIG.buy;
                // profiles is a joined object — Supabase returns it as an object or array
                const submitterName =
                  Array.isArray(pitch.profiles)
                    ? pitch.profiles[0]?.full_name
                    : (pitch.profiles as { full_name?: string } | null)?.full_name;

                return (
                  <Link
                    key={pitch.id}
                    href={`/pitches/${pitch.id}`}
                    className="block rounded-2xl border border-[var(--border)] p-5 hover:border-[var(--border-hover)] transition-colors"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs font-bold uppercase tracking-wider rounded px-2 py-0.5"
                            style={{ background: typeCfg.color + "20", color: typeCfg.color }}
                          >
                            {typeCfg.label}
                          </span>
                          <span
                            className="font-bold text-lg"
                            style={{ color: "var(--accent-primary)" }}
                          >
                            {pitch.ticker}
                          </span>
                          <span className="text-base font-semibold">
                            {pitch.company_name}
                          </span>
                        </div>

                        {/* Thesis */}
                        <p
                          className="text-sm leading-relaxed mb-3"
                          style={{
                            color: "var(--text-secondary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {pitch.thesis}
                        </p>

                        {/* Meta row */}
                        <div className="flex gap-4 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
                          {pitch.price_target && (
                            <span>
                              Target: <strong style={{ color: "var(--text-secondary)" }}>
                                ${Number(pitch.price_target).toFixed(2)}
                              </strong>
                            </span>
                          )}
                          {pitch.current_price && (
                            <span>
                              Price: <strong style={{ color: "var(--text-secondary)" }}>
                                ${Number(pitch.current_price).toFixed(2)}
                              </strong>
                            </span>
                          )}
                          {submitterName && <span>By {submitterName}</span>}
                          <span>{fmtDate(pitch.created_at)}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className="text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1.5 flex-shrink-0"
                        style={{ background: statusCfg.color + "20", color: statusCfg.color }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Non-authorized notice ─────────────────────────────────────── */}
          {!canSubmit && (
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              Pitch submission and voting are available to Authorized Members.
              Contact an admin to request access.
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
