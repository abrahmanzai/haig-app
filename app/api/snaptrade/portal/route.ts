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

// GET /api/snaptrade/portal
// Returns a SnapTrade connection portal URL for the admin to link a brokerage.
// Auto-registers the user if not yet registered.
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const admin = createAdminClient();
    const snaptrade = getSnaptradeClient();

    // Ensure user is registered
    let { data: snapUser } = await admin
      .from("snaptrade_users")
      .select("snaptrade_user_id, snaptrade_user_secret")
      .eq("id", user.id)
      .single();

    if (!snapUser) {
      const response = await snaptrade.authentication.registerSnapTradeUser({
        userId: user.id,
      });
      const registered = response.data;
      if (!registered?.userId || !registered?.userSecret) {
        return NextResponse.json({ error: "SnapTrade registration failed — check SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY" }, { status: 500 });
      }
      const { error: insertError } = await admin.from("snaptrade_users").insert({
        id: user.id,
        snaptrade_user_id: registered.userId,
        snaptrade_user_secret: registered.userSecret,
      });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      snapUser = { snaptrade_user_id: registered.userId, snaptrade_user_secret: registered.userSecret };
    }

    // Generate connection portal link
    const portalResponse = await snaptrade.authentication.loginSnapTradeUser({
      userId: snapUser.snaptrade_user_id,
      userSecret: snapUser.snaptrade_user_secret,
    });

    const redirectURI = (portalResponse.data as any)?.redirectURI;
    if (!redirectURI) {
      return NextResponse.json({ error: "Failed to generate portal link — SnapTrade returned no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: redirectURI });
  } catch (err: any) {
    const message = err?.response?.data?.detail ?? err?.message ?? "Unknown error";
    return NextResponse.json({ error: `SnapTrade error: ${message}` }, { status: 500 });
  }
}
