"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupMessage, MemberBasic } from "./types";

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

function initial(name: string | null | undefined) { return (name ?? "?")[0].toUpperCase(); }

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
  initialMessages: GroupMessage[];
}

export default function GroupChatTab({ userId, userName, members, initialMessages }: Props) {
  const [messages, setMessages] = useState<GroupMessage[]>(initialMessages);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const supabase  = createClient();

  const memberMap = Object.fromEntries(
    [{ id: userId, full_name: userName }, ...members].map((m) => [m.id, m.full_name])
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel("group_messages_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages" }, (payload) => {
        const row = payload.new as GroupMessage;
        const enriched: GroupMessage = {
          ...row,
          sender: row.sender_id ? { full_name: memberMap[row.sender_id] ?? "Member" } : null,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === enriched.id)) return prev;
          return [...prev, enriched];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const optimistic: GroupMessage = {
      id: "opt-" + Date.now(),
      sender_id: userId,
      content: text,
      created_at: new Date().toISOString(),
      sender: { full_name: userName },
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("group_messages")
      .insert({ sender_id: userId, content: text })
      .select("id")
      .single();

    if (!error && data) {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, id: data.id } : m)));
    } else if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div
        className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 flex-shrink-0"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(48,209,88,0.15)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-sm">General</h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {members.length + 1} member{members.length !== 0 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No messages yet — say hello!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine     = msg.sender_id === userId;
          const senderName = msg.sender?.full_name ?? "Member";
          const prev       = messages[i - 1];
          const next       = messages[i + 1];
          const showSep    = !prev || !sameDay(prev.created_at, msg.created_at);
          const showAvatar = !isMine && (!next || next.sender_id !== msg.sender_id || !sameDay(msg.created_at, next.created_at));
          const showName   = !isMine && (!prev || prev.sender_id !== msg.sender_id || showSep);
          const showTime   = !next || next.sender_id !== msg.sender_id || !sameDay(msg.created_at, next.created_at);
          const isOptimistic = msg.id.startsWith("opt-");
          const color      = avatarColor(senderName);

          return (
            <div key={msg.id}>
              {showSep && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs px-2" style={{ color: "var(--text-tertiary)" }}>
                    {fmtDateSep(msg.created_at)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
              )}

              <div className={`flex items-end gap-2 mb-0.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar placeholder for alignment */}
                {!isMine && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-0.5"
                    style={{
                      background: showAvatar ? color + "22" : "transparent",
                      color: showAvatar ? color : "transparent",
                    }}
                  >
                    {showAvatar ? initial(senderName) : ""}
                  </div>
                )}

                <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                  {showName && (
                    <span className="text-xs mb-1 px-1 font-medium" style={{ color }}>
                      {senderName}
                    </span>
                  )}
                  <div
                    className="px-3.5 py-2.5 text-sm leading-relaxed break-words"
                    style={{
                      background: isMine ? "var(--accent-primary)" : "var(--bg-tertiary)",
                      color: isMine ? "#fff" : "var(--text-primary)",
                      borderRadius: isMine
                        ? "1.1rem 1.1rem 0.25rem 1.1rem"
                        : "1.1rem 1.1rem 1.1rem 0.25rem",
                      opacity: isOptimistic ? 0.65 : 1,
                    }}
                  >
                    {msg.content}
                  </div>
                  {showTime && (
                    <span className="text-xs mt-1 px-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {fmtTime(msg.created_at)}
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
            placeholder="Message General…"
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
    </div>
  );
}
