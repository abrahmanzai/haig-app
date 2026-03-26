export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import ResearchClient from "./ResearchClient";

export default async function ResearchPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["authorized", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <AppNav name={profile.full_name} role={profile.role} currentPath="/research" />
      <main style={{ padding: 0 }}>
        <ResearchClient />
      </main>
    </div>
  );
}
