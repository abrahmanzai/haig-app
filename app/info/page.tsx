export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import InfoClient from "./InfoClient";

export default async function InfoPage() {
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

  const [{ data: minutes }, { data: documents }] = await Promise.all([
    supabase
      .from("meeting_minutes")
      .select("id, meeting_number, title, content, meeting_date")
      .order("meeting_number", { ascending: false }),
    supabase
      .from("partnership_documents")
      .select("id, title, description, file_url, document_date")
      .order("document_date", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen">
      <AppNav name={profile.full_name} role={profile.role} currentPath="/info" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <InfoClient
          minutes={minutes ?? []}
          documents={documents ?? []}
          isAdmin={profile.role === "admin"}
        />
      </main>
    </div>
  );
}
