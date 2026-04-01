export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import PortfolioAdminControls from "./PortfolioAdminControls";
import AllocationChart, { type AllocationSlice } from "./AllocationChart";
import RefreshPricesButton from "./RefreshPricesButton";
import Link from "next/link";
import { Wallet, TrendingUp, DollarSign, BarChart2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Portfolio() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    profileResult,
    holdingsResult,
    financialsResult,
    tradesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("holdings").select("*").order("ticker"),
    supabase.from("club_financials").select("*").eq("id", 1).single(),
    supabase.from("trades").select("*").order("trade_date", { ascending: false }).limit(10),
  ]);

  const profile    = profileResult.data;
  const holdings   = holdingsResult.data ?? [];
  const financials = financialsResult.data;
  const trades     = tradesResult.data ?? [];

  // ── Fetch live prices from Finnhub (server-side, key never hits client) ──
  let livePrices: Record<string, number | null> = {};
  const apiKey = process.env.FINNHUB_API_KEY;
  if (holdings.length > 0 && apiKey) {
    const fetches = holdings.map((h) =>
      fetch(
        `https://finnhub.io/api/v1/quote?symbol=${h.ticker}&token=${apiKey}`,
        { cache: "no-store" }
      )
        .then((r) => r.json())
        .then((data) => ({ ticker: h.ticker, price: (data.c as number) || null }))
        .catch(() => ({ ticker: h.ticker, price: null }))
    );
    const results = await Promise.all(fetches);
    for (const { ticker, price } of results) {
      livePrices[ticker] = price;
    }
  }

  // ── Merge live prices into holdings ────────────────────────────────────────
  const holdingsWithPrice = holdings.map((h) => ({
    ...h,
    current_price: livePrices[h.ticker] ?? h.current_price,
  }));

  // ── Compute aggregates ─────────────────────────────────────────────────────
  const holdingsValue = holdingsWithPrice.reduce(
    (sum, h) => sum + h.shares * (h.current_price ?? h.avg_cost_basis), 0,
  );
  const totalValue    = holdingsValue + (financials?.cash_on_hand ?? 0);
  const totalCost     = financials?.total_invested ?? 0;
  const totalGainLoss = totalValue - totalCost - (financials?.cash_on_hand ?? 0);
  const totalGainPct  = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // ── Allocation chart data ──────────────────────────────────────────────────
  const ACCENT_COLORS = [
    "#5E6AD2", "#30d158", "#ff9f0a", "#64d2ff",
    "#bf5af2", "#ff453a", "#ffd60a", "#0891b2",
  ];
  const allocationData: AllocationSlice[] = holdingsWithPrice.map((h, i) => ({
    ticker: h.ticker,
    value:  h.shares * (h.current_price ?? h.avg_cost_basis),
    color:  ACCENT_COLORS[i % ACCENT_COLORS.length],
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/portfolio" />

      <main style={{ padding: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Portfolio</h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Club holdings, cash, and trade history.{" "}
                <Link href="/portfolio/performance" className="hover:underline" style={{ color: "var(--accent-primary)" }}>
                  View performance →
                </Link>
              </p>
            </div>
            {profile?.role === "admin" && (
              <PortfolioAdminControls
                cashOnHand={financials?.cash_on_hand ?? 0}
                totalInvested={financials?.total_invested ?? 0}
              />
            )}
          </div>

          {/* ── Overview cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label:  "Total Value",
                value:  usd(totalValue),
                sub:    "Club portfolio total",
                stripe: "#5E6AD2",
                color:  "var(--text-primary)",
                Icon:   Wallet,
              },
              {
                label:  "Cash on Hand",
                value:  usd(financials?.cash_on_hand ?? 0),
                sub:    "Available to deploy",
                stripe: "#30d158",
                color:  "#30d158",
                Icon:   DollarSign,
              },
              {
                label:  "Invested",
                value:  usd(totalCost),
                sub:    "Total capital deployed",
                stripe: "#5E6AD2",
                color:  "var(--text-primary)",
                Icon:   TrendingUp,
              },
              {
                label:  "Equity Gain / Loss",
                value:  usd(totalGainLoss),
                sub:    pct(totalGainPct) + " total return",
                stripe: totalGainLoss >= 0 ? "#30d158" : "#ff453a",
                color:  totalGainLoss >= 0 ? "#30d158" : "#ff453a",
                Icon:   BarChart2,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `${card.stripe}66` }} />
                <card.Icon size={40} className="absolute right-3 bottom-3" style={{ color: "rgba(255,255,255,0.05)", strokeWidth: 1.5 }} />
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

          {/* ── Allocation chart ─────────────────────────────────────────── */}
          {allocationData.length > 0 && (
            <AllocationChart data={allocationData} totalValue={totalValue} />
          )}

          {/* ── Holdings table ────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)" }}
          >
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Holdings</h2>
                <span className="text-xs num" style={{ color: "var(--text-secondary)" }}>
                  {holdingsWithPrice.length} position{holdingsWithPrice.length !== 1 ? "s" : ""}
                </span>
              </div>
              <RefreshPricesButton />
            </div>

            {holdingsWithPrice.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                No holdings on record.{profile?.role === "admin" && " Use \"Add Holding\" above to get started."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Ticker", "Company", "Shares", "Avg Cost", "Live Price", "Market Value", "Gain / Loss", "Weight"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsWithPrice.map((holding) => {
                      const price     = holding.current_price ?? holding.avg_cost_basis;
                      const value     = holding.shares * price;
                      const costBasis = holding.shares * holding.avg_cost_basis;
                      const gainLoss  = value - costBasis;
                      const gainPct   = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
                      const gainColor = gainLoss >= 0 ? "var(--accent-green)" : "var(--accent-red)";
                      const weightPct = totalValue > 0 ? (value / totalValue) * 100 : 0;

                      return (
                        <tr
                          key={holding.id}
                          className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <td className="px-6 py-4 font-bold" style={{ color: "var(--accent-primary)" }}>
                            {holding.ticker}
                          </td>
                          <td className="px-6 py-4" style={{ color: "var(--text-primary)" }}>
                            {holding.company_name}
                          </td>
                          <td className="px-6 py-4 num" style={{ color: "var(--text-secondary)" }}>
                            {holding.shares}
                          </td>
                          <td className="px-6 py-4 num" style={{ color: "var(--text-secondary)" }}>
                            {usd(holding.avg_cost_basis)}
                          </td>
                          <td className="px-6 py-4 num" style={{ color: "var(--text-primary)" }}>
                            {holding.current_price ? usd(holding.current_price) : "—"}
                          </td>
                          <td className="px-6 py-4 num font-semibold" style={{ color: "var(--text-primary)" }}>
                            {usd(value)}
                          </td>
                          <td className="px-6 py-4 num font-semibold" style={{ color: gainColor }}>
                            {usd(gainLoss)} ({pct(gainPct)})
                          </td>
                          <td className="px-6 py-4" style={{ minWidth: 110 }}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(weightPct, 100)}%`, background: "var(--accent-primary)" }}
                                />
                              </div>
                              <span className="text-xs num flex-shrink-0" style={{ color: "var(--text-secondary)", minWidth: 38 }}>
                                {weightPct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Trade history ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)" }}
          >
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Recent Trades</h2>
            </div>

            {trades.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                No trades recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Date", "Type", "Ticker", "Company", "Shares", "Price", "Total"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const isBuy = trade.trade_type === "buy";
                      const total = trade.shares * trade.price_per_share;
                      return (
                        <tr
                          key={trade.id}
                          className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <td className="px-6 py-4" style={{ color: "var(--text-secondary)" }}>
                            {formatDate(trade.trade_date)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="text-xs font-semibold uppercase rounded px-2 py-0.5"
                              style={{
                                background: isBuy ? "rgba(48,209,88,0.15)" : "rgba(255,69,58,0.15)",
                                color: isBuy ? "var(--accent-green)" : "var(--accent-red)",
                              }}
                            >
                              {trade.trade_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold" style={{ color: "var(--accent-primary)" }}>
                            {trade.ticker}
                          </td>
                          <td className="px-6 py-4" style={{ color: "var(--text-primary)" }}>
                            {trade.company_name}
                          </td>
                          <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {trade.shares}
                          </td>
                          <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {usd(trade.price_per_share)}
                          </td>
                          <td className="px-6 py-4 tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                            {usd(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
