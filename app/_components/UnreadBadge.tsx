"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UnreadBadge() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let userId: string | null = null;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      // Unread DMs
      const { count: dmCount } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false);

      // Unread announcements (no read record for me)
      const { data: allAnns } = await supabase
        .from("announcements")
        .select("id");
      const { data: myReads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);

      const readSet = new Set((myReads ?? []).map((r) => r.announcement_id));
      const unreadAnns = (allAnns ?? []).filter((a) => !readSet.has(a.id)).length;

      setCount((dmCount ?? 0) + unreadAnns);
    }

    init();

    // Realtime: new DM for me
    const dmChannel = supabase
      .channel("unread_badge_dm")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new as { recipient_id: string; read: boolean };
          if (msg.recipient_id === userId && !msg.read) {
            setCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    // Realtime: new announcement
    const annChannel = supabase
      .channel("unread_badge_ann")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" },
        () => { setCount((c) => c + 1); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(annChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (count <= 0) return null;

  return (
    <span
      className="text-xs font-bold rounded-full px-1.5"
      style={{
        background: "var(--accent-red)",
        color: "#fff",
        minWidth: 18,
        textAlign: "center",
        lineHeight: "1.6",
        display: "inline-block",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
