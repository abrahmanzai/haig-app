"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DirectMessage, MemberBasic } from "./types";

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateSep(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function initial(name: string) { return name[0].toUpperCase(); }

const AVATAR_COLORS = ["#0a84ff","#30d158","#bf5af2","#ff9f0a","#ff453a","#64d2ff","#ffd60a"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

interface Props {
  userId: string;
  userName: string;
  members: MemberBasic[];
  initialDMs: DirectMessage[];
  onUnreadChange: (count: number) => void;
}

export default function DirectMessagesTab({ userId, userName, members, initialDMs, onUnreadChange }: Props) {
  const supabase = createClient();

  const [conversations, setConversations] = useState<Record<string, DirectMessage[]>>(() => {
    const map: Record<string, DirectMessage[]> = {};
    for (const dm of initialDMs) {
      const peer = dm.sender_id === userId ? dm.recipient_id : dm.sender_id;
      (map[peer] ??= []).push(dm);
    }
    return map;
  });

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const dm of initialDMs) {
      if (dm.recipient_id === userId && !dm.read) {
        counts[dm.sender_id] = (counts[dm.sender_id] ?? 0) + 1;
      }
    }
    return counts;
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  useEffect(() => { onUnreadChange(totalUnread); }, [totalUnread, onUnreadChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  const markRead = useCallback(async (peerId: string) => {
    if (!unreadCounts[peerId]) return;
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", peerId)
      .eq("recipient_id", userId)
      .eq("read", false);
    setConversations((prev) => ({
      ...prev,
      [peerId]: (prev[peerId] ?? []).map((m) =>
        m.sender_id === peerId && !m.read ? { ...m, read: true } : m
      ),
    }));
    setUnreadCounts((prev) => { const next = { ...prev }; delete next[peerId]; return next; });
  }, [supabase, userId, unreadCounts]);

  function selectMember(id: string) {
    setSelectedId(id);
    markRead(id);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("dm_rt_" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const msg = payload.new as DirectMessage;
        const isForMe = msg.recipient_id === userId;
        const isByMe  = msg.sender_id    === userId;
        if (!isForMe && !isByMe) return;
        const peer = isByMe ? msg.recipient_id : msg.sender_id;
        setConversations((prev) => {
          const existing = prev[peer] ?? [];
          if (existing.some((m) => m.id === msg.id)) return prev;
          return { ...prev, [peer]: [...existing, msg] };
        });
        if (isForMe && !isByMe) {
          setSelectedId((sel) => {
            if (sel === peer) {
              supabase.from("direct_messages").update({ read: true }).eq("id", msg.id);
            } else {
              setUnreadCounts((prev) => ({ ...prev, [peer]: (prev[peer] ?? 0) + 1 }));
            }
            return sel;
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  async function send() {
    if (!selectedId || !input.trim() || sending) return;
    const text = input.trim();
    setSending(true);
    setInput("");

    const optimistic: DirectMessage = {
      id: "opt-" + Date.now(),
      sender_id: userId,
      recipient_id: selectedId,
      content: text,
      read: false,
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), optimistic],
    }));

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: userId, recipient_id: selectedId, content: text })
      .select("id")
      .single();

    if (!error && data) {
      setConversations((prev) => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).map((m) =>
          m.id === optimistic.id ? { ...m, id: data.id } : m
        ),
      }));

      // Fire-and-forget email notification to recipient
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:        "dm",
          recipientId: selectedId,
          senderName:  userName,
          preview:     text.length > 200 ? text.slice(0, 200) + "…" : text,
        }),
      }).catch(() => {});
    } else {
      setConversations((prev) => ({
        ...prev,
        [selectedId]: (prev[selectedId] ?? []).filter((m) => m.id !== optimistic.id),
      }));
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const selectedMember = members.find((m) => m.id === selectedId);
  const convo = selectedId ? (conversations[selectedId] ?? []) : [];

  // Sort members: unread first, then by last message time
  const sortedMembers = [...members].sort((a, b) => {
    const aUnread = unreadCounts[a.id] ?? 0;
    const bUnread = unreadCounts[b.id] ?? 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    const aLast = (conversations[a.id] ?? []).at(-1)?.created_at ?? "";
    const bLast = (conversations[b.id] ?? []).at(-1)?.created_at ?? "";
    return bLast.localeCompare(aLast);
  });

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div
        className={[
          "flex-col overflow-hidden border-r border-[var(--border)]",
          selectedId
            ? "hidden sm:flex sm:w-72 sm:flex-shrink-0"
            : "flex w-full sm:w-72 sm:flex-shrink-0",
        ].join(" ")}
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-sm">Messages</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {members.length === 0 && (
            <p className="px-4 py-8 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              No other members yet
            </p>
          )}
          {sortedMembers.map((m) => {
            const unread   = unreadCounts[m.id] ?? 0;
            const lastMsg  = (conversations[m.id] ?? []).at(-1);
            const isActive = selectedId === m.id;
            const color    = avatarColor(m.full_name);

            return (
              <button
                key={m.id}
                onClick={() => selectMember(m.id)}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors rounded-xl mx-1"
                style={{
                  width: "calc(100% - 8px)",
                  background: isActive ? "rgba(10,132,255,0.12)" : "transparent",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 relative"
                  style={{ background: color + "22", color }}
                >
                  {initial(m.full_name)}
                  {unread > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--accent-primary)", color: "#fff", fontSize: 9 }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: unread > 0 ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: unread > 0 ? 600 : 500 }}
                    >
                      {m.full_name}
                    </span>
                    {lastMsg && (
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs truncate"
                    style={{ color: unread > 0 ? "var(--text-secondary)" : "var(--text-tertiary)", fontWeight: unread > 0 ? 500 : 400 }}
                  >
                    {lastMsg
                      ? (lastMsg.sender_id === userId ? "You: " : "") + lastMsg.content
                      : <span style={{ fontStyle: "italic" }}>No messages yet</span>}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conversation panel ───────────────────────────────────── */}
      <div
        className={[
          "flex-col overflow-hidden",
          selectedId ? "flex flex-1" : "hidden sm:flex sm:flex-1",
        ].join(" ")}
      >
        {!selectedId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1">Select a conversation</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Choose a member from the list
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Convo header */}
            <div
              className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-shrink-0"
              style={{ background: "var(--bg-secondary)" }}
            >
              <button
                className="sm:hidden p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                onClick={() => setSelectedId(null)}
                aria-label="Back"
              >
                <ArrowLeft size={17} style={{ color: "var(--text-secondary)" }} />
              </button>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: avatarColor(selectedMember?.full_name ?? "?") + "22",
                  color: avatarColor(selectedMember?.full_name ?? "?"),
                }}
              >
                {initial(selectedMember?.full_name ?? "?")}
              </div>
              <div>
                <p className="font-semibold text-sm">{selectedMember?.full_name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--text-tertiary)" }}>
                  {selectedMember?.role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {convo.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    No messages yet — say something!
                  </p>
                </div>
              )}

              {convo.map((msg, i) => {
                const isMine   = msg.sender_id === userId;
                const prev     = convo[i - 1];
                const next     = convo[i + 1];
                const showSep  = !prev || !sameDay(prev.created_at, msg.created_at);
                const showTime = !next || next.sender_id !== msg.sender_id || !sameDay(msg.created_at, next.created_at);
                const isOptimistic = msg.id.startsWith("opt-");

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showSep && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        <span className="text-xs px-2" style={{ color: "var(--text-tertiary)" }}>
                          {fmtDateSep(msg.created_at)}
                        </span>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} mb-0.5`}>
                      <div className={`flex flex-col max-w-[78%] sm:max-w-[68%] ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className="px-3.5 py-2.5 text-sm leading-relaxed break-words"
                          style={{
                            background: isMine ? "var(--accent-primary)" : "var(--bg-tertiary)",
                            color: isMine ? "#fff" : "var(--text-primary)",
                            borderRadius: isMine
                              ? "1.1rem 1.1rem 0.25rem 1.1rem"
                              : "1.1rem 1.1rem 1.1rem 0.25rem",
                            opacity: isOptimistic ? 0.7 : 1,
                          }}
                        >
                          {msg.content}
                        </div>
                        {showTime && (
                          <span className="text-xs mt-1 px-0.5" style={{ color: "var(--text-tertiary)" }}>
                            {fmtTime(msg.created_at)}
                            {isMine && !isOptimistic && (
                              <span style={{ color: msg.read ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
                                {" · "}{msg.read ? "Read" : "Sent"}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 pb-4 pt-3 border-t border-[var(--border)] flex-shrink-0"
              style={{ background: "var(--bg-primary)" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${selectedMember?.full_name ?? ""}…`}
                  className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none resize-none transition-colors focus:border-[var(--accent-primary)]"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", maxHeight: 120, lineHeight: "1.5" }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 disabled:opacity-30 active:scale-95"
                  style={{ background: "var(--accent-primary)" }}
                  aria-label="Send"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-1.5 px-1" style={{ color: "var(--text-tertiary)" }}>
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
