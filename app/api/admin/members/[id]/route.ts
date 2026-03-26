import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateVotingUnits } from "@/lib/voting";

// PATCH /api/admin/members/[id]
// Body: { role?: string, capital_contribution?: number }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Verify requesting user is authenticated and is an admin
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: self } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (self?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.role !== undefined) {
    if (!["member", "authorized", "admin"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updates.role = body.role;
  }

  if (body.capital_contribution !== undefined) {
    const capital = Number(body.capital_contribution);
    if (isNaN(capital) || capital < 0) {
      return NextResponse.json({ error: "Invalid capital" }, { status: 400 });
    }
    updates.capital_contribution = capital;
    updates.voting_units = calculateVotingUnits(capital);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", params.id)
    .select("id, full_name, role, capital_contribution, voting_units")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ member: data });
}
