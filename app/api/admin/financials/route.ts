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

// PATCH /api/admin/financials — update cash_on_hand and/or total_invested
export async function PATCH(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.cash_on_hand !== undefined) {
    const v = Number(body.cash_on_hand);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "cash_on_hand must be non-negative" }, { status: 400 });
    updates.cash_on_hand = v;
  }
  if (body.total_invested !== undefined) {
    const v = Number(body.total_invested);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "total_invested must be non-negative" }, { status: 400 });
    updates.total_invested = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("club_financials")
    .update(updates)
    .eq("id", 1)
    .select("cash_on_hand, total_invested")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ financials: data });
}
