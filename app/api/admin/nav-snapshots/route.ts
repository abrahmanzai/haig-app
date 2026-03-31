import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/admin/nav-snapshots
// Computes current portfolio values from DB and saves a NAV snapshot for today.
export async function POST() {
  const supabase = createClient();

  // Auth + role check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch current portfolio data
  const [holdingsResult, financialsResult] = await Promise.all([
    supabase.from("holdings").select("shares, current_price, avg_cost_basis"),
    supabase.from("club_financials").select("cash_on_hand, total_invested").eq("id", 1).single(),
  ]);

  const holdings   = holdingsResult.data ?? [];
  const financials = financialsResult.data;

  const holdingsValue = holdings.reduce(
    (sum, h) => sum + h.shares * (h.current_price ?? h.avg_cost_basis),
    0,
  );
  const cashOnHand   = financials?.cash_on_hand   ?? 0;
  const totalInvested = financials?.total_invested ?? 0;
  const totalValue   = holdingsValue + cashOnHand;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("nav_snapshots")
    .upsert(
      {
        snapshot_date:  today,
        total_value:    parseFloat(totalValue.toFixed(2)),
        cash_on_hand:   parseFloat(cashOnHand.toFixed(2)),
        holdings_value: parseFloat(holdingsValue.toFixed(2)),
        total_invested: parseFloat(totalInvested.toFixed(2)),
      },
      { onConflict: "snapshot_date" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ snapshot: data });
}

// DELETE /api/admin/nav-snapshots?id=<uuid>
export async function DELETE(req: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("nav_snapshots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
