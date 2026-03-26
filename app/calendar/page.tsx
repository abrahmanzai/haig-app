import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = createClient();

  const [eventsResult, authResult] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const events = eventsResult.data ?? [];
  const user   = authResult.data.user;

  let profile: { full_name: string; role: string } | null = null;
  let userId: string | undefined;

  if (user) {
    userId = user.id;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/calendar" />
      <CalendarClient
        events={events}
        isAdmin={profile?.role === "admin"}
        userId={userId}
      />
    </div>
  );
}
