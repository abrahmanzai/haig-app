export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import AdminClient from "./AdminClient";

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function Admin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
      .order("event_date", { ascending: true }),
    supabase.from("pitches").select("id, status"),
    supabase.from("club_financials").select("*").eq("id", 1).single(),
  ]);

  const members    = membersResult.data ?? [];
  const events     = eventsResult.data ?? [];
  const pitches    = pitchesResult.data ?? [];
  const financials = financialsResult.data;

  const memberCount     = members.length;
  const authorizedCount = members.filter((m) => m.role === "authorized" || m.role === "admin").length;
  const votingPitches   = pitches.filter((p) => p.status === "voting").length;
  const pendingPitches  = pitches.filter((p) => p.status === "pending").length;

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
              { label: "Total Members",  value: memberCount,     color: "var(--accent-primary)" },
              { label: "Authorized",     value: authorizedCount, color: "var(--accent-green)"   },
              { label: "Open Votes",     value: votingPitches,   color: "var(--accent-orange)"  },
              { label: "Pending Pitches",value: pendingPitches,  color: "var(--accent-purple)"  },
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

          {/* ── Club financials ───────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] p-6"
            style={{ background: "var(--bg-secondary)" }}
          >
            <h2 className="font-semibold mb-4">Club Financials</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Invested",     value: usd(financials?.total_invested ?? 0), color: "var(--text-primary)"   },
                { label: "Cash on Hand",       value: usd(financials?.cash_on_hand ?? 0),   color: "var(--accent-green)"   },
                { label: "Total Members",      value: String(memberCount),                   color: "var(--accent-primary)" },
                { label: "Authorized Members", value: String(authorizedCount),               color: "var(--accent-green)"   },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
                    {row.label}
                  </p>
                  <p className="font-semibold" style={{ color: row.color }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Interactive member + event CRUD ──────────────────────────── */}
          <AdminClient members={members} events={events} adminId={user.id} />

        </div>
      </main>
    </div>
  );
}
