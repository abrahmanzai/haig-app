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

// GET /api/snaptrade/accounts
// Lists all brokerage accounts connected by the admin via SnapTrade.
export async function GET() {
  const user = await verifyAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: snapUser } = await admin
    .from("snaptrade_users")
    .select("snaptrade_user_id, snaptrade_user_secret")
    .eq("id", user.id)
    .single();

  if (!snapUser) return NextResponse.json({ accounts: [] });

  try {
    const snaptrade = getSnaptradeClient();
    const response = await snaptrade.accountInformation.listUserAccounts({
      userId: snapUser.snaptrade_user_id,
      userSecret: snapUser.snaptrade_user_secret,
    });

    const accounts = (response.data ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      number: a.number,
      institution: a.institution_name ?? a.brokerage?.name ?? "Unknown",
    }));

    return NextResponse.json({ accounts });
  } catch (err: any) {
    const message = err?.response?.data?.detail ?? err?.message ?? "Unknown error";
    return NextResponse.json({ error: `SnapTrade error: ${message}` }, { status: 500 });
  }
}
