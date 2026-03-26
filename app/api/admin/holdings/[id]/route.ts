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

// PATCH /api/admin/holdings/[id] — update shares and/or avg_cost_basis
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.shares !== undefined) {
    const v = Number(body.shares);
    if (isNaN(v) || v <= 0) return NextResponse.json({ error: "shares must be positive" }, { status: 400 });
    updates.shares = v;
  }
  if (body.avg_cost_basis !== undefined) {
    const v = Number(body.avg_cost_basis);
    if (isNaN(v) || v < 0) return NextResponse.json({ error: "avg_cost_basis must be non-negative" }, { status: 400 });
    updates.avg_cost_basis = v;
  }
  if (body.company_name !== undefined) updates.company_name = String(body.company_name).trim();
  if (body.ticker !== undefined) updates.ticker = String(body.ticker).trim().toUpperCase();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("holdings")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ holding: data });
}

// DELETE /api/admin/holdings/[id] — remove a holding
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { error } = await admin.from("holdings").delete().eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
