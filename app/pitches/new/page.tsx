export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import NewPitchForm from "./NewPitchForm";

export default async function NewPitchPage({
  searchParams,
}: {
  searchParams: { ticker?: string; company?: string; price?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "authorized" && profile?.role !== "admin") {
    redirect("/pitches");
  }

  const prefill = {
    ticker:        searchParams.ticker  ?? "",
    company_name:  searchParams.company ?? "",
    current_price: searchParams.price   ?? "",
  };

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/pitches" />
      <main style={{ padding: 0 }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Submit Pitch</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Present your investment thesis to the club
            </p>
            {(prefill.ticker || prefill.company_name) && (
              <div
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                style={{ background: "rgba(48,209,88,0.08)", borderColor: "rgba(48,209,88,0.3)", color: "var(--accent-green)" }}
              >
                <span>Pre-filled from Research:</span>
                <strong>{prefill.ticker}{prefill.company_name ? ` · ${prefill.company_name}` : ""}</strong>
              </div>
            )}
          </div>
          <NewPitchForm userId={user.id} prefill={prefill} />
        </div>
      </main>
    </div>
  );
}
