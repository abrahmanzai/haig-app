export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import NewPitchForm from "./NewPitchForm";

export default async function NewPitchPage() {
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
          </div>
          <NewPitchForm userId={user.id} />
        </div>
      </main>
    </div>
  );
}
