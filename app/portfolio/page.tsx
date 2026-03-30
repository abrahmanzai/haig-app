export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import PortfolioAdminControls from "./PortfolioAdminControls";

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
  const totalValue  = holdingsValue + (financials?.cash_on_hand ?? 0);
  const totalCost   = financials?.total_invested ?? 0;
  const totalGainLoss = totalValue - totalCost - (financials?.cash_on_hand ?? 0);
  const totalGainPct  = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/portfolio" />

      <main style={{ padding: 0 }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold">Portfolio</h1>
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
                label: "Total Value",
                value: usd(totalValue),
                color: "var(--text-primary)",
              },
              {
                label: "Cash on Hand",
                value: usd(financials?.cash_on_hand ?? 0),
                color: "var(--accent-green)",
              },
              {
                label: "Invested",
                value: usd(totalCost),
                color: "var(--text-secondary)",
              },
              {
                label: "Equity Gain / Loss",
                value: usd(totalGainLoss) + "  (" + pct(totalGainPct) + ")",
                color: totalGainLoss >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-[var(--border)] p-5"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {card.label}
                </p>
                <p className="text-xl font-bold leading-snug" style={{ color: card.color }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Holdings table ────────────────────────────────────────────── */}
          <div
            className="rounded-2xl border border-[var(--border)] overflow-hidden"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Holdings</h2>
            </div>

            {holdingsWithPrice.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
                No holdings on record.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Ticker", "Company", "Shares", "Avg Cost", "Live Price", "Market Value", "Gain / Loss"].map((h) => (
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
                    {holdingsWithPrice.map((holding) => {
                      const price      = holding.current_price ?? holding.avg_cost_basis;
                      const value      = holding.shares * price;
                      const costBasis  = holding.shares * holding.avg_cost_basis;
                      const gainLoss   = value - costBasis;
                      const gainPct    = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
                      const gainColor  = gainLoss >= 0 ? "var(--accent-green)" : "var(--accent-red)";

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
                          <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {holding.shares}
                          </td>
                          <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                            {usd(holding.avg_cost_basis)}
                          </td>
                          <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-primary)" }}>
                            {holding.current_price ? usd(holding.current_price) : "—"}
                          </td>
                          <td className="px-6 py-4 tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                            {usd(value)}
                          </td>
                          <td className="px-6 py-4 tabular-nums font-semibold" style={{ color: gainColor }}>
                            {usd(gainLoss)} ({pct(gainPct)})
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
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold">Recent Trades</h2>
            </div>

            {trades.length === 0 ? (
              <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
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
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const isBuy  = trade.trade_type === "buy";
                      const total  = trade.shares * trade.price_per_share;
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
