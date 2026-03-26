export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import AdminClient from "./AdminClient";

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

  const [membersResult, eventsResult, pitchesResult, financialsResult, holdingsResult, tradesResult] = await Promise.all([
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
    supabase.from("holdings").select("*").order("ticker"),
    supabase.from("trades").select("*").order("trade_date", { ascending: false }),
  ]);

  const members    = membersResult.data ?? [];
  const events     = eventsResult.data ?? [];
  const pitches    = pitchesResult.data ?? [];
  const financials = financialsResult.data;
  const holdings   = holdingsResult.data ?? [];
  const trades     = tradesResult.data ?? [];

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

          {/* ── Interactive member + event + holdings + trades CRUD ──────── */}
          <AdminClient
            members={members}
            events={events}
            holdings={holdings}
            trades={trades}
            financials={financials ?? null}
            adminId={user.id}
          />

        </div>
      </main>
    </div>
  );
}
