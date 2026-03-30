export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate, getTodayStr } from "@/lib/date";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/app/_components/AppNav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  founding: "#ffd60a",
  meeting:  "#0a84ff",
  workshop: "#30d158",
  speaker:  "#bf5af2",
  social:   "#ff9f0a",
  deadline: "#ff453a",
  review:   "#64d2ff",
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin",             color: "#ffd60a" },
  authorized: { label: "Authorized Member", color: "#30d158" },
  member:     { label: "Member",            color: "#0a84ff" },
};

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayStr();

  // Fetch all data in parallel
  const [
    profileResult,
    upcomingResult,
    votingCountResult,
    financialsResult,
    holdingsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, capital_contribution, voting_units, joined_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("events")
      .select("id, title, event_type, event_date, location")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(4),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "voting"),
    supabase
      .from("club_financials")
      .select("cash_on_hand, total_invested")
      .eq("id", 1)
      .single(),
    supabase
      .from("holdings")
      .select("shares, current_price"),
  ]);

  const profile        = profileResult.data;

  const upcomingEvents = upcomingResult.data ?? [];
  const activeVotes    = votingCountResult.count ?? 0;
  const financials     = financialsResult.data;
  const holdings       = holdingsResult.data ?? [];

  const holdingsValue = holdings.reduce(
    (sum, h) => sum + h.shares * (h.current_price ?? 0), 0,
  );
  const totalValue  = holdingsValue + (financials?.cash_on_hand ?? 0);
  const nextEvent   = upcomingEvents[0];
  const roleConfig  = ROLE_CONFIG[profile?.role ?? "member"];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/dashboard" />

      <main style={{ padding: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Welcome header ───────────────────────────────────────────── */}
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {formatDate(today)}
                {profile?.joined_at && (
                  <> · Member since {formatDate(profile.joined_at)}</>
                )}
              </p>
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full"
              style={{ background: roleConfig.color + "20", color: roleConfig.color }}
            >
              {roleConfig.label}
            </span>
          </div>

          {/* ── Pending-access banner (basic members only) ───────────────── */}
          {profile?.role === "member" && (
            <div
              className="rounded-xl p-4 border text-sm leading-relaxed"
              style={{
                background: "rgba(10,132,255,0.08)",
                borderColor: "rgba(10,132,255,0.25)",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--accent-primary)" }}>Pending full access — </strong>
              an admin will review your account and promote you to Authorized Member,
              which unlocks pitch submission and voting rights.
            </div>
          )}

          {/* ── Quick-stat cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Capital Contribution",
                value: usd(profile?.capital_contribution ?? 0),
                sub:   "Your partnership stake",
                color: "var(--accent-primary)",
                accent: "var(--accent-primary)",
              },
              {
                label: "Voting Units",
                value: (profile?.voting_units ?? 0).toFixed(4),
                sub:   "Weighted vote power",
                color: "var(--accent-purple)",
                accent: "var(--accent-purple)",
              },
              {
                label: "Active Votes",
                value: String(activeVotes),
                sub:   activeVotes > 0 ? "Votes open now" : "No open votes",
                color: activeVotes > 0 ? "var(--accent-orange)" : "var(--text-tertiary)",
                accent: activeVotes > 0 ? "var(--accent-orange)" : "var(--bg-tertiary)",
              },
              {
                label: "Next Event",
                value: nextEvent ? formatDate(nextEvent.event_date) : "—",
                sub:   nextEvent?.title ?? "No upcoming events",
                color: "var(--accent-green)",
                accent: "var(--accent-green)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{ borderTop: `2px solid ${stat.accent}33` }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mb-1 truncate num" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Two-column: portfolio + upcoming events ───────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Portfolio snapshot */}
            <div className="stat-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold">Portfolio</h2>
                <Link
                  href="/portfolio"
                  className="text-xs hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Total Value",  value: usd(totalValue),                        color: "var(--text-primary)"   },
                  { label: "Invested",     value: usd(financials?.total_invested ?? 0),   color: "var(--text-secondary)" },
                  { label: "Cash on Hand", value: usd(financials?.cash_on_hand ?? 0),     color: "var(--accent-green)"   },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-sm py-0.5">
                    <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                    <span className="font-semibold num" style={{ color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div
              className="lg:col-span-2 stat-card p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold">Upcoming Events</h2>
                <Link
                  href="/calendar"
                  className="text-xs hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Full calendar →
                </Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  No upcoming events.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev) => {
                    const color = EVENT_COLORS[ev.event_type] ?? "#888";
                    return (
                      <div key={ev.id} className="flex items-start gap-3">
                        <span
                          className="w-2 h-2 rounded-full mt-[5px] flex-shrink-0"
                          style={{ background: color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                            {formatDate(ev.event_date)} · {ev.location}
                          </p>
                        </div>
                        <span
                          className="text-xs font-semibold rounded px-1.5 py-0.5 flex-shrink-0 capitalize"
                          style={{ background: color + "18", color }}
                        >
                          {ev.event_type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick-nav tiles ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/calendar",  label: "Calendar",  desc: "Events & schedule",  color: "var(--accent-primary)",  show: true },
              { href: "/pitches",   label: "Pitches",   desc: "Investment ideas",    color: "var(--accent-green)",    show: true },
              { href: "/portfolio", label: "Portfolio", desc: "Holdings & trades",   color: "var(--accent-teal)",     show: true },
              { href: "/admin",     label: "Admin",     desc: "Manage members",      color: "var(--accent-gold)",     show: profile?.role === "admin" },
            ]
              .filter((l) => l.show)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="glass-card p-4 block transition-all"
                  style={{ borderTop: `2px solid ${link.color}22` }}
                >
                  <p className="font-semibold text-sm mb-1" style={{ color: link.color }}>{link.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {link.desc}
                  </p>
                </Link>
              ))}
          </div>

        </div>
      </main>
    </div>
  );
}
