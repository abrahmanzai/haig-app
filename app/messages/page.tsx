export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/app/_components/AppNav";
import MessagesClient from "./MessagesClient";
import type { Announcement, GroupMessage, DirectMessage, MemberBasic } from "./types";

export default async function MessagesPage() {
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

  const [
    announcementsResult,
    groupMessagesResult,
    dmsResult,
    membersResult,
    readsResult,
  ] = await Promise.all([
    supabase
      .from("announcements")
      .select("*, creator:profiles!created_by(full_name)")
      .order("pinned",      { ascending: false })
      .order("created_at",  { ascending: false })
      .limit(100),

    supabase
      .from("group_messages")
      .select("*, sender:profiles!sender_id(full_name)")
      .order("created_at", { ascending: true })
      .limit(200),

    supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: true }),

    supabase
      .from("profiles")
      .select("id, full_name, role")
      .neq("id", user.id)
      .in("role", ["authorized", "admin"])
      .order("full_name"),

    supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", user.id),
  ]);

  const readIds = new Set((readsResult.data ?? []).map((r) => r.announcement_id));

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav name={profile.full_name} role={profile.role} currentPath="/messages" />
      <main style={{ padding: 0, flex: 1, overflow: "hidden" }}>
        <MessagesClient
          userId={user.id}
          userName={profile.full_name}
          userRole={profile.role}
          members={(membersResult.data ?? []) as MemberBasic[]}
          initialAnnouncements={(announcementsResult.data ?? []) as Announcement[]}
          initialGroupMessages={(groupMessagesResult.data ?? []) as GroupMessage[]}
          initialDMs={(dmsResult.data ?? []) as DirectMessage[]}
          readAnnouncementIds={Array.from(readIds)}
        />
      </main>
    </div>
  );
}
