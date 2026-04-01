import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSnaptradeClient } from "@/lib/snaptrade";

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: self } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return self?.role === "admin" ? user : null;
}

// POST /api/snaptrade/sync
// Pulls holdings + recent transactions from all connected SnapTrade accounts
// and upserts them into the club's holdings + trades tables.
export async function POST() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: snapUser } = await admin
    .from("snaptrade_users")
    .select("snaptrade_user_id, snaptrade_user_secret")
    .eq("id", user.id)
    .single();

  if (!snapUser) {
    return NextResponse.json({ error: "No brokerage connected. Connect one first." }, { status: 400 });
  }

  const snaptrade = getSnaptradeClient();
  const { snaptrade_user_id: userId, snaptrade_user_secret: userSecret } = snapUser;

  try {
  // ── Fetch data from SnapTrade ────────────────────────────────────────────────
  const [holdingsRes, activitiesRes] = await Promise.all([
    snaptrade.accountInformation.getAllUserHoldings({ userId, userSecret }),
    snaptrade.transactionsAndReporting.getActivities({ userId, userSecret }),
  ]);

  // ── Sync Holdings ────────────────────────────────────────────────────────────
  // Aggregate positions across all accounts by ticker
  const positionMap = new Map<
    string,
    { company_name: string; ticker: string; total_shares: number; total_cost: number }
  >();

  for (const accountHoldings of holdingsRes.data ?? []) {
    for (const pos of accountHoldings.positions ?? []) {
      const ticker: string = pos.symbol?.symbol?.symbol ?? "";
      const description: string = pos.symbol?.symbol?.description ?? ticker;
      const units: number = pos.units ?? 0;
      const avgCost: number = pos.average_purchase_price ?? 0;

      if (!ticker || units <= 0) continue;

      const existing = positionMap.get(ticker);
      if (existing) {
        const combinedShares = existing.total_shares + units;
        const combinedCost   = existing.total_cost + units * avgCost;
        positionMap.set(ticker, { ...existing, total_shares: combinedShares, total_cost: combinedCost });
      } else {
        positionMap.set(ticker, {
          company_name: description,
          ticker,
          total_shares: units,
          total_cost: units * avgCost,
        });
      }
    }
  }

  let holdingsSynced = 0;
  for (const [ticker, pos] of Array.from(positionMap)) {
    const avg_cost_basis = pos.total_shares > 0 ? pos.total_cost / pos.total_shares : 0;
    const { error } = await admin
      .from("holdings")
      .upsert(
        {
          company_name: pos.company_name,
          ticker,
          shares: pos.total_shares,
          avg_cost_basis,
        },
        { onConflict: "ticker" }
      );
    if (!error) holdingsSynced++;
  }

  // ── Sync Trades ──────────────────────────────────────────────────────────────
  const TRADE_TYPES: Record<string, string> = {
    BUY: "buy",
    SELL: "sell",
  };

  let tradesSynced = 0;
  for (const rawActivity of activitiesRes.data ?? []) {
    const activity = rawActivity as any;
    const tradeType = TRADE_TYPES[String(activity.type ?? "").toUpperCase()];
    if (!tradeType) continue; // skip dividends, fees, etc.

    const symObj = activity.symbol?.symbol ?? activity.symbol;
    const ticker: string = (typeof symObj === "string" ? symObj : symObj?.symbol) ?? "";
    if (!ticker) continue;

    const snaptradeId: string = activity.id ?? "";
    const shares: number = Math.abs(Number(activity.units ?? 0));
    const price: number = Number(activity.price ?? 0);
    const tradeDate: string = activity.trade_date
      ? new Date(activity.trade_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    const companyName: string =
      (typeof symObj === "string" ? symObj : symObj?.description) ?? ticker;

    if (!snaptradeId || shares <= 0) continue;

    const { error } = await admin
      .from("trades")
      .upsert(
        {
          snaptrade_id: snaptradeId,
          company_name: companyName,
          ticker,
          trade_type: tradeType,
          shares,
          price_per_share: price,
          trade_date: tradeDate,
          notes: "Synced from SnapTrade",
        },
        { onConflict: "snaptrade_id" }
      );
    if (!error) tradesSynced++;
  }

  return NextResponse.json({
    ok: true,
    holdingsSynced,
    tradesSynced,
  });
  } catch (err: any) {
    const message = err?.response?.data?.detail ?? err?.message ?? "Unknown error";
    return NextResponse.json({ error: `SnapTrade error: ${message}` }, { status: 500 });
  }
}
