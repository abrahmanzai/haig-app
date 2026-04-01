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

// POST /api/snaptrade/register
// Registers the current admin as a SnapTrade user (idempotent).
// Returns { registered: true } — secrets are stored server-side only.
export async function POST() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  // Check if already registered
  const { data: existing } = await admin
    .from("snaptrade_users")
    .select("snaptrade_user_id")
    .eq("id", user.id)
    .single();

  if (existing) return NextResponse.json({ registered: true });

  try {
    // Register with SnapTrade
    const snaptrade = getSnaptradeClient();
    const response = await snaptrade.authentication.registerSnapTradeUser({
      userId: user.id,
    });

    const snapUser = response.data;
    if (!snapUser?.userId || !snapUser?.userSecret) {
      return NextResponse.json({ error: "SnapTrade registration failed — check env vars" }, { status: 500 });
    }

    // Persist credentials
    const { error } = await admin.from("snaptrade_users").insert({
      id: user.id,
      snaptrade_user_id: snapUser.userId,
      snaptrade_user_secret: snapUser.userSecret,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ registered: true }, { status: 201 });
  } catch (err: any) {
    const message = err?.response?.data?.detail ?? err?.message ?? "Unknown error";
    return NextResponse.json({ error: `SnapTrade error: ${message}` }, { status: 500 });
  }
}
