"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavSnapshot {
  id: string;
  snapshot_date: string;
  total_value: number;
  cash_on_hand: number;
  holdings_value: number;
  total_invested: number;
}

interface Props {
  snapshots: NavSnapshot[];
  isAdmin: boolean;
  currentValue: number;
  currentInvested: number;
}

// ─── Period definitions ───────────────────────────────────────────────────────

type Period = "1M" | "3M" | "YTD" | "1Y" | "ALL";

const PERIODS: Period[] = ["1M", "3M", "YTD", "1Y", "ALL"];

function cutoffDate(period: Period): string {
  const d = new Date();
  if (period === "1M")  { d.setMonth(d.getMonth() - 1); }
  if (period === "3M")  { d.setMonth(d.getMonth() - 3); }
  if (period === "YTD") { d.setMonth(0); d.setDate(1); }
  if (period === "1Y")  { d.setFullYear(d.getFullYear() - 1); }
  if (period === "ALL") { return "0000-00-00"; }
  return d.toISOString().slice(0, 10);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function shortDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
        {label && new Date(label + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>
      <p className="font-bold geist-mono" style={{ color: "var(--text-primary)" }}>
        {usd(payload[0].value)}
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PerformanceClient({ snapshots, isAdmin, currentValue, currentInvested }: Props) {
  const [period,    setPeriod]    = useState<Period>("ALL");
  const [recording, setRecording] = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [data,      setData]      = useState<NavSnapshot[]>(snapshots);
  const [error,     setError]     = useState<string | null>(null);

  // ── Filter by period ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = cutoffDate(period);
    return data.filter((s) => s.snapshot_date >= cutoff);
  }, [data, period]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const first = filtered[0];
  const last  = filtered[filtered.length - 1];

  const startValue   = first?.total_value ?? currentValue;
  const endValue     = last?.total_value  ?? currentValue;
  const absReturn    = endValue - startValue;
  const pctReturn    = startValue > 0 ? (absReturn / startValue) * 100 : 0;
  const isPositive   = absReturn >= 0;

  // Unrealised gain vs cost basis
  const unrealised    = currentValue - currentInvested;
  const unrealisedPct = currentInvested > 0 ? (unrealised / currentInvested) * 100 : 0;

  // ── Record today's snapshot ─────────────────────────────────────────────────
  async function recordSnapshot() {
    setRecording(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/nav-snapshots", { method: "POST" });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save snapshot"); return; }
      const snap = json.snapshot as NavSnapshot;
      setData((prev) => {
        const without = prev.filter((s) => s.snapshot_date !== snap.snapshot_date);
        return [...without, snap].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
      });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setRecording(false);
    }
  }

  async function deleteSnapshot(id: string) {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/nav-snapshots?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Delete failed"); return; }
      setData((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Network error — please try again.");
    } finally {
      setDeleting(null);
    }
  }

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = filtered.map((s) => ({
    date:  s.snapshot_date,
    value: s.total_value,
  }));

  const lineColor = isPositive ? "var(--accent-green)" : "var(--accent-red)";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Portfolio Performance
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Historical NAV and total return
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={recordSnapshot}
            disabled={recording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <RefreshCw size={14} className={recording ? "animate-spin" : ""} />
            {recording ? "Recording…" : "Record Today's Snapshot"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "rgba(255,69,58,0.3)", background: "rgba(255,69,58,0.08)", color: "var(--accent-red)" }}>
          {error}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label:  "Current NAV",
            value:  usd(currentValue),
            sub:    "All holdings + cash",
            stripe: "var(--accent-primary)",
            color:  "var(--text-primary)",
          },
          {
            label:  "Period Return",
            value:  usd(absReturn),
            sub:    pct(pctReturn),
            stripe: isPositive ? "var(--accent-green)" : "var(--accent-red)",
            color:  isPositive ? "var(--accent-green)" : "var(--accent-red)",
          },
          {
            label:  "Unrealised P&L",
            value:  usd(unrealised),
            sub:    pct(unrealisedPct) + " vs cost basis",
            stripe: unrealised >= 0 ? "var(--accent-green)" : "var(--accent-red)",
            color:  unrealised >= 0 ? "var(--accent-green)" : "var(--accent-red)",
          },
          {
            label:  "Data Points",
            value:  String(data.length),
            sub:    `${filtered.length} in period`,
            stripe: "var(--accent-primary)",
            color:  "var(--text-primary)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", backdropFilter: "blur(12px)" }}
          >
            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: card.stripe + "99" }} />
            <p className="text-[10px] uppercase tracking-widest mb-2 geist-mono" style={{ color: "var(--text-secondary)" }}>
              {card.label}
            </p>
            <p className="text-2xl font-bold mb-1 geist-mono" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-[10px] geist-mono" style={{ color: "var(--text-secondary)" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-glass)", border: "1px solid var(--border)", backdropFilter: "blur(12px)" }}
      >
        {/* Period picker */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>NAV Over Time</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  period === p
                    ? { background: "var(--accent-primary)", color: "#fff" }
                    : { background: "var(--bg-tertiary)", color: "var(--text-secondary)" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "var(--bg-tertiary)" }}
            >
              {isPositive
                ? <TrendingUp size={26} style={{ color: "var(--accent-green)" }} />
                : <TrendingDown size={26} style={{ color: "var(--accent-red)" }} />
              }
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              {data.length === 0 ? "No snapshots recorded yet" : "Not enough data for this period"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {isAdmin
                ? "Click "Record Today's Snapshot" to start tracking NAV history."
                : "Ask an admin to record portfolio snapshots over time."}
            </p>
          </div>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v: number) => "$" + (v / 1000).toFixed(0) + "k"}
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)", fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                {first && (
                  <ReferenceLine
                    y={first.total_value}
                    stroke="var(--border-hover)"
                    strokeDasharray="4 4"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  strokeWidth={2}
                  dot={chartData.length <= 30}
                  activeDot={{ r: 5, fill: lineColor, stroke: "var(--bg-secondary)", strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Snapshot history table (admin) ───────────────────────────────── */}
      {isAdmin && data.length > 0 && (
        <div
          className="rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)" }}
        >
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Snapshot History</h2>
            <span className="text-xs geist-mono" style={{ color: "var(--text-secondary)" }}>
              {data.length} recorded
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Date", "Total Value", "Holdings", "Cash", "Invested", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data].reverse().map((snap) => (
                  <tr
                    key={snap.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-5 py-3 geist-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                      {snap.snapshot_date}
                    </td>
                    <td className="px-5 py-3 font-semibold geist-mono" style={{ color: "var(--text-primary)" }}>
                      {usd(snap.total_value)}
                    </td>
                    <td className="px-5 py-3 geist-mono" style={{ color: "var(--text-secondary)" }}>
                      {usd(snap.holdings_value)}
                    </td>
                    <td className="px-5 py-3 geist-mono" style={{ color: "var(--accent-green)" }}>
                      {usd(snap.cash_on_hand)}
                    </td>
                    <td className="px-5 py-3 geist-mono" style={{ color: "var(--text-secondary)" }}>
                      {usd(snap.total_invested)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => deleteSnapshot(snap.id)}
                        disabled={deleting === snap.id}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,69,58,0.1)] disabled:opacity-40"
                        title="Delete snapshot"
                      >
                        <Trash2 size={13} style={{ color: "var(--accent-red)" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
