"use client";

import { useState, useCallback } from "react";
import AnnouncementsTab from "./AnnouncementsTab";
import GroupChatTab     from "./GroupChatTab";
import DirectMessagesTab from "./DirectMessagesTab";
import type { Announcement, GroupMessage, DirectMessage, MemberBasic } from "./types";

type Tab = "announcements" | "chat" | "dms";

interface Props {
  userId: string;
  userName: string;
  userRole: string;
  members: MemberBasic[];
  initialAnnouncements: Announcement[];
  initialGroupMessages: GroupMessage[];
  initialDMs: DirectMessage[];
  readAnnouncementIds: string[];
}

export default function MessagesClient({
  userId, userName, userRole,
  members,
  initialAnnouncements,
  initialGroupMessages,
  initialDMs,
  readAnnouncementIds,
}: Props) {
  const [activeTab, setActiveTab]       = useState<Tab>("announcements");
  const [unreadDMs, setUnreadDMs]       = useState(0);
  const [readIds,   setReadIds]         = useState<Set<string>>(new Set(readAnnouncementIds));

  const unreadAnnouncements = initialAnnouncements.filter((a) => !readIds.has(a.id)).length;
  const isAdmin = userRole === "admin";

  function handleMarkRead(ids: string[]) {
    setReadIds((prev) => new Set([...Array.from(prev), ...ids]));
  }

  const handleDMUnread = useCallback((count: number) => {
    setUnreadDMs(count);
  }, []);

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "announcements", label: "Announcements", badge: unreadAnnouncements },
    { id: "chat",          label: "Group Chat" },
    { id: "dms",           label: "Direct Messages", badge: unreadDMs },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-[var(--border)] flex-shrink-0"
        style={{ background: "var(--bg-primary)" }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-xl"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                borderBottom: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab.label}
              {!!tab.badge && tab.badge > 0 && (
                <span
                  className="text-xs font-bold rounded-full px-1.5 py-0.5"
                  style={{
                    background: "var(--accent-primary)",
                    color: "#fff",
                    minWidth: 18,
                    textAlign: "center",
                    lineHeight: "1.4",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        <div className="h-full" style={{ display: activeTab === "announcements" ? "flex" : "none", flexDirection: "column" }}>
          <AnnouncementsTab
            userId={userId}
            isAdmin={isAdmin}
            initialAnnouncements={initialAnnouncements}
            readIds={readIds}
            onMarkRead={handleMarkRead}
          />
        </div>

        <div className="h-full" style={{ display: activeTab === "chat" ? "flex" : "none", flexDirection: "column" }}>
          <GroupChatTab
            userId={userId}
            userName={userName}
            members={members}
            initialMessages={initialGroupMessages}
          />
        </div>

        <div className="h-full" style={{ display: activeTab === "dms" ? "flex" : "none", flexDirection: "column" }}>
          <DirectMessagesTab
            userId={userId}
            userName={userName}
            members={members}
            initialDMs={initialDMs}
            onUnreadChange={handleDMUnread}
          />
        </div>
      </div>
    </div>
  );
}
