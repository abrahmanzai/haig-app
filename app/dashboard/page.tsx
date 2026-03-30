export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate, getTodayStr } from "@/lib/date";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppNav from "@/app/_components/AppNav";
import {
  Wallet, Vote, Clock, CalendarDays,
  CalendarRange, TrendingUp, PieChart, ShieldCheck,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  founding: "#ffd60a",
  meeting:  "#5E6AD2",
  workshop: "#30d158",
  speaker:  "#bf5af2",
  social:   "#ff9f0a",
  deadline: "#ff453a",
  review:   "#64d2ff",
};

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin",             color: "#ffd60a" },
  authorized: { label: "Authorized Member", color: "#30d158" },
  member:     { label: "Member",            color: "#5E6AD2" },
};

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function shortMonth(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function dayNum(dateStr: string) {
  return new Date(dateStr + "T00:00:00").getDate();
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = getTodayStr();

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
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-8">

          {/* ── Welcome header ───────────────────────────────────────────── */}
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase geist-mono"
                  style={{ background: "rgba(94,106,210,0.2)", color: "#5E6AD2" }}
                >
                  {roleConfig.label}
                </span>
                {profile?.role !== "member" && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#30d158" }} />
                    <span className="text-[10px] tracking-widest uppercase geist-mono" style={{ color: "#30d158" }}>
                      Authorized
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                {formatDate(today)}
                {profile?.joined_at && <> · Member since {formatDate(profile.joined_at)}</>}
              </p>
            </div>
            {(profile?.role === "authorized" || profile?.role === "admin") && (
              <Link
                href="/pitches/new"
                className="px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "#5E6AD2", boxShadow: "0 0 20px rgba(94,106,210,0.3)" }}
              >
                Initiate Pitch
              </Link>
            )}
          </div>

          {/* ── Pending-access banner (basic members only) ───────────────── */}
          {profile?.role === "member" && (
            <div
              className="rounded-xl p-4 border text-sm leading-relaxed"
              style={{
                background: "rgba(94,106,210,0.08)",
                borderColor: "rgba(94,106,210,0.25)",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--accent-primary)" }}>Pending full access — </strong>
              an admin will review your account and promote you to Authorized Member,
              which unlocks pitch submission and voting rights.
            </div>
          )}

          {/* ── Stat cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label:  "Capital Contribution",
                value:  usd(profile?.capital_contribution ?? 0),
                sub:    "Your partnership stake",
                stripe: "#5E6AD2",
                Icon:   Wallet,
              },
              {
                label:  "Voting Units",
                value:  (profile?.voting_units ?? 0).toFixed(4),
                sub:    "Weighted vote power",
                stripe: "#5E6AD2",
                Icon:   Vote,
              },
              {
                label:  "Active Votes",
                value:  activeVotes > 0 ? `${activeVotes} Pending` : "0",
                sub:    activeVotes > 0 ? "Votes open now" : "No open votes",
                stripe: activeVotes > 0 ? "#ffd60a" : "#5E6AD2",
                Icon:   Clock,
              },
              {
                label:  "Next Event",
                value:  nextEvent ? formatDate(nextEvent.event_date) : "—",
                sub:    nextEvent?.title ?? "No upcoming events",
                stripe: "#5E6AD2",
                Icon:   CalendarDays,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Top accent stripe */}
                <div
                  className="absolute top-0 left-0 w-full h-0.5"
                  style={{ background: `${stat.stripe}66` }}
                />
                {/* Ghost icon */}
                <stat.Icon
                  size={40}
                  className="absolute right-3 bottom-3"
                  style={{ color: "rgba(255,255,255,0.05)", strokeWidth: 1.5 }}
                />
                <p
                  className="text-[10px] uppercase tracking-widest mb-2 geist-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {stat.label}
                </p>
                <p
                  className="text-2xl font-bold mb-1 geist-mono"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] geist-mono" style={{ color: "var(--text-secondary)" }}>
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Portfolio + Upcoming Events ───────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Portfolio snapshot */}
            <div
              className="lg:col-span-2 rounded-2xl p-6"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                    Portfolio Snapshot
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Performance across all club allocations
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold geist-mono" style={{ color: "var(--text-primary)" }}>
                    {usd(totalValue)}
                  </p>
                  <Link
                    href="/portfolio"
                    className="text-xs hover:underline"
                    style={{ color: "#5E6AD2" }}
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Invested",      value: usd(financials?.total_invested ?? 0), pct: financials && totalValue > 0 ? (financials.total_invested / totalValue) : 0.9,  color: "#5E6AD2" },
                  { label: "Cash on Hand",  value: usd(financials?.cash_on_hand ?? 0),   pct: financials && totalValue > 0 ? (financials.cash_on_hand / totalValue) : 0.1,    color: "#30d158" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-[10px] uppercase tracking-widest geist-mono mb-1.5" style={{ color: "var(--text-secondary)" }}>
                      <span>{row.label}</span>
                      <span style={{ color: "var(--text-primary)" }}>{row.value}</span>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(row.pct * 100, 100)}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming events */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-glass)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Upcoming Events</h2>
                <Link href="/calendar" className="text-xs hover:underline" style={{ color: "#5E6AD2" }}>
                  Full calendar →
                </Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev) => {
                    const color = EVENT_COLORS[ev.event_type] ?? "#888";
                    return (
                      <div key={ev.id} className="flex gap-3 items-center group cursor-pointer">
                        {/* Date box */}
                        <div
                          className="flex flex-col items-center justify-center w-12 h-12 rounded flex-shrink-0 transition-colors"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span className="text-[9px] geist-mono" style={{ color: "var(--text-secondary)" }}>
                            {shortMonth(ev.event_date)}
                          </span>
                          <span className="text-lg font-bold geist-mono leading-none" style={{ color: "var(--text-primary)" }}>
                            {dayNum(ev.event_date)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
                            {ev.title}
                          </p>
                          <p className="text-[10px] mt-0.5 geist-mono" style={{ color: "var(--text-secondary)" }}>
                            {ev.location}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-semibold rounded px-1.5 py-0.5 flex-shrink-0 capitalize geist-mono"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: "/calendar",  label: "Calendar",  desc: "Manage Schedule",  Icon: CalendarRange, color: "#5E6AD2", show: true },
              { href: "/pitches",   label: "Pitches",   desc: "Review Proposals", Icon: TrendingUp,    color: "#5E6AD2", show: true },
              { href: "/portfolio", label: "Portfolio", desc: "Asset Allocation",  Icon: PieChart,      color: "#5E6AD2", show: true },
              { href: "/admin",     label: "Admin",     desc: "Global Settings",  Icon: ShieldCheck,   color: "#ffd60a", show: profile?.role === "admin" },
            ]
              .filter((l) => l.show)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col items-center justify-center py-8 rounded-2xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <link.Icon size={28} style={{ color: link.color }} strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{link.label}</p>
                  <p className="text-[10px] uppercase tracking-widest geist-mono" style={{ color: "var(--text-secondary)" }}>
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
