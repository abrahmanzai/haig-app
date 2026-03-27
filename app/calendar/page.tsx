export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import AppNav from "@/app/_components/AppNav";
import CalendarClient from "./CalendarClient";

export interface MemberProfile {
  id: string;
  full_name: string;
  role: string;
}

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
  let members: MemberProfile[] = [];

  if (user) {
    userId = user.id;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;

    // Fetch all members so admin can take attendance
    if (data?.role === "admin") {
      const { data: membersData } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name");
      members = (membersData ?? []) as MemberProfile[];
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/calendar" />
      <CalendarClient
        events={events}
        isAdmin={profile?.role === "admin"}
        userId={userId}
        members={members}
      />
    </div>
  );
}
