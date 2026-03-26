import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin",      color: "#ffd60a" },
  authorized: { label: "Authorized", color: "#30d158" },
  member:     { label: "Member",     color: "#0a84ff" },
};

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Admin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify admin role server-side
  const { data: self } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (self?.role !== "admin") redirect("/dashboard");

  const [membersResult, eventsResult, pitchesResult, financialsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, capital_contribution, voting_units, joined_at")
      .order("joined_at", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, event_type, event_date, location")
      .order("event_date", { ascending: true })
      .limit(6),
    supabase
      .from("pitches")
      .select("id, status")
      ,
    supabase.from("club_financials").select("*").eq("id", 1).single(),
  ]);

  const members    = membersResult.data ?? [];
  const events     = eventsResult.data ?? [];
  const pitches    = pitchesResult.data ?? [];
  const financials = financialsResult.data;

  // Counts
  const memberCount     = members.length;
  const authorizedCount = members.filter((m) => m.role === "authorized" || m.role === "admin").length;
  const votingPitches   = pitches.filter((p) => p.status === "voting").length;
  const pendingPitches  = pitches.filter((p) => p.status === "pending").length;

  const EVENT_COLORS: Record<string, string> = {
    founding: "#ffd60a", meeting: "#0a84ff", workshop: "#30d158",
    speaker: "#bf5af2", social: "#ff9f0a", deadline: "#ff453a", review: "#64d2ff",
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AppNav name={self?.full_name} role={self?.role} currentPath="/admin" />

      <main style={{ padding: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Manage members, events, and the portfolio
            </p>
          </div>

          {/* ── Summary stats ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Members",   value: memberCount,     color: "var(--accent-primary)" },
              { label: "Authorized",       value: authorizedCount, color: "var(--accent-green)"  },
              { label: "Open Votes",       value: votingPitches,   color: "var(--accent-orange)" },
              { label: "Pending Pitches",  value: pendingPitches,  color: "var(--accent-purple)" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[var(--border)] p-5"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {s.label}
                </p>
                <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Members table ────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-semibold">Members</h2>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Role changes: edit directly in Supabase dashboard
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["Name", "Email", "Role", "Capital", "Voting Units", "Joined"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{member.full_name}</td>
                        <td className="px-6 py-4" style={{ color: "var(--text-secondary)" }}>
                          {member.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-xs font-semibold rounded-full px-2.5 py-1"
                            style={{ background: roleCfg.color + "20", color: roleCfg.color }}
                          >
                            {roleCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {usd(member.capital_contribution ?? 0)}
                        </td>
                        <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                          {(member.voting_units ?? 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4" style={{ color: "var(--text-tertiary)" }}>
                          {member.joined_at ? fmtDate(member.joined_at.split("T")[0]) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Two-column: upcoming events + financials ─────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Upcoming events */}
            <div
              className="rounded-2xl border border-[var(--border)] p-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <h2 className="font-semibold mb-4">Upcoming Events</h2>
              {events.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No events.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => {
                    const color = EVENT_COLORS[ev.event_type] ?? "#888";
                    return (
                      <div key={ev.id} className="flex items-start gap-3">
                        <span
                          className="w-2 h-2 rounded-full mt-[5px] flex-shrink-0"
                          style={{ background: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                            {fmtDate(ev.event_date)} · {ev.location}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Club financials */}
            <div
              className="rounded-2xl border border-[var(--border)] p-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <h2 className="font-semibold mb-4">Club Financials</h2>
              <div className="space-y-3">
                {[
                  { label: "Total Invested",   value: usd(financials?.total_invested ?? 0),  color: "var(--text-primary)"   },
                  { label: "Cash on Hand",     value: usd(financials?.cash_on_hand ?? 0),    color: "var(--accent-green)"   },
                  { label: "Total Members",    value: String(memberCount),                    color: "var(--accent-primary)" },
                  { label: "Authorized Members", value: String(authorizedCount),              color: "var(--accent-green)"   },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                    <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: "var(--text-tertiary)" }}>
                Edit financials and holdings directly in the Supabase dashboard or via the portfolio admin actions (coming soon).
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
