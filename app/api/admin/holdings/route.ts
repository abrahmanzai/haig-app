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

// POST /api/admin/holdings — add a new holding
export async function POST(req: NextRequest) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { company_name, ticker, shares, avg_cost_basis } = body;

  if (!company_name || !ticker || shares == null || avg_cost_basis == null) {
    return NextResponse.json(
      { error: "company_name, ticker, shares, and avg_cost_basis are required" },
      { status: 400 }
    );
  }

  const sharesNum = Number(shares);
  const costNum   = Number(avg_cost_basis);
  if (isNaN(sharesNum) || sharesNum <= 0) {
    return NextResponse.json({ error: "shares must be a positive number" }, { status: 400 });
  }
  if (isNaN(costNum) || costNum < 0) {
    return NextResponse.json({ error: "avg_cost_basis must be a non-negative number" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("holdings")
    .insert({
      company_name: company_name.trim(),
      ticker: ticker.trim().toUpperCase(),
      shares: sharesNum,
      avg_cost_basis: costNum,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holding: data }, { status: 201 });
}
