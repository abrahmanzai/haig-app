export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import PerformanceClient, { type NavSnapshot } from "./PerformanceClient";

export default async function PerformancePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, snapshotsResult, holdingsResult, financialsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("nav_snapshots").select("*").order("snapshot_date", { ascending: true }),
    supabase.from("holdings").select("shares, current_price, avg_cost_basis"),
    supabase.from("club_financials").select("cash_on_hand, total_invested").eq("id", 1).single(),
  ]);

  const profile    = profileResult.data;
  const snapshots  = (snapshotsResult.data ?? []) as NavSnapshot[];
  const holdings   = holdingsResult.data ?? [];
  const financials = financialsResult.data;

  // Current portfolio values from DB (using stored prices, not live Finnhub)
  const holdingsValue = holdings.reduce(
    (sum, h) => sum + h.shares * (h.current_price ?? h.avg_cost_basis),
    0,
  );
  const currentValue    = holdingsValue + (financials?.cash_on_hand ?? 0);
  const currentInvested = financials?.total_invested ?? 0;

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/portfolio" />
      <main style={{ padding: 0 }}>
        <PerformanceClient
          snapshots={snapshots}
          isAdmin={profile?.role === "admin"}
          currentValue={currentValue}
          currentInvested={currentInvested}
        />
      </main>
    </div>
  );
}
