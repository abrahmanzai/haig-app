import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// POST /api/admin/trades — record a new trade
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { company_name, ticker, trade_type, shares, price_per_share, trade_date, notes } = body;

  if (!company_name || !ticker || !trade_type || shares == null || price_per_share == null || !trade_date) {
    return NextResponse.json(
      { error: "company_name, ticker, trade_type, shares, price_per_share, and trade_date are required" },
      { status: 400 }
    );
  }
  if (!["buy", "sell"].includes(trade_type)) {
    return NextResponse.json({ error: "trade_type must be 'buy' or 'sell'" }, { status: 400 });
  }

  const sharesNum = Number(shares);
  const priceNum  = Number(price_per_share);
  if (isNaN(sharesNum) || sharesNum <= 0) {
    return NextResponse.json({ error: "shares must be a positive number" }, { status: 400 });
  }
  if (isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json({ error: "price_per_share must be non-negative" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trades")
    .insert({
      company_name: company_name.trim(),
      ticker: ticker.trim().toUpperCase(),
      trade_type,
      shares: sharesNum,
      price_per_share: priceNum,
      trade_date,
      notes: notes?.trim() || null,
      suggested_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trade: data }, { status: 201 });
}
