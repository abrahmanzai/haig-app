export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import EventRsvpClient from "./EventRsvpClient";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [eventResult, profileResult] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).single(),
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
  ]);

  if (!eventResult.data) notFound();

  const event   = eventResult.data;
  const profile = profileResult.data;
  const isAdmin = profile?.role === "admin";

  // ── User's own RSVP ─────────────────────────────────────────────────────────
  const { data: rsvpRow } = await supabase
    .from("attendance")
    .select("rsvp")
    .eq("event_id", params.id)
    .eq("member_id", user.id)
    .maybeSingle();

  // ── RSVP count ───────────────────────────────────────────────────────────────
  const { count: rsvpCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("event_id", params.id)
    .eq("rsvp", true);

  // ── Attendance list (admin only) ─────────────────────────────────────────────
  let attendanceList: Array<{ member_id: string; present: boolean; rsvp: boolean; full_name: string }> = [];

  if (isAdmin) {
    // Fetch all attendance rows for this event
    const { data: rows } = await supabase
      .from("attendance")
      .select("member_id, present, rsvp")
      .eq("event_id", params.id);

    if (rows && rows.length > 0) {
      const memberIds = rows.map((r) => r.member_id);
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", memberIds)
        .order("full_name");

      const nameMap: Record<string, string> = {};
      for (const p of profileRows ?? []) nameMap[p.id] = p.full_name;

      attendanceList = rows.map((r) => ({
        member_id: r.member_id,
        present:   r.present ?? false,
        rsvp:      r.rsvp    ?? false,
        full_name: nameMap[r.member_id] ?? "Unknown",
      }));
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav name={profile?.full_name} role={profile?.role} currentPath="/calendar" />
      <main style={{ padding: 0 }}>
        <EventRsvpClient
          event={event}
          userId={user.id}
          isAdmin={isAdmin}
          userRsvp={rsvpRow?.rsvp ?? false}
          rsvpCount={rsvpCount ?? 0}
          attendanceList={attendanceList}
        />
      </main>
    </div>
  );
}
