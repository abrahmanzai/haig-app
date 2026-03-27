"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupMessage, MemberBasic } from "./types";

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initial(name: string | null | undefined) {
  return (name ?? "?")[0].toUpperCase();
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
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const supabase   = createClient();

  // Member lookup map for enriching realtime messages
  const memberMap = Object.fromEntries(
    [{ id: userId, full_name: userName }, ...members].map((m) => [m.id, m.full_name])
  );

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("group_messages_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_messages" }, (payload) => {
        const row = payload.new as GroupMessage;
        // Enrich with sender name from known members
        const enriched: GroupMessage = {
          ...row,
          sender: row.sender_id ? { full_name: memberMap[row.sender_id] ?? "Member" } : null,
        };
        setMessages((prev) => {
          // Deduplicate in case optimistic update already added it
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
      // Replace optimistic with real id
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, id: data.id } : m))
      );
    } else if (error) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
        <h2 className="font-semibold">General</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          All authorized members
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              No messages yet — say hello!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine    = msg.sender_id === userId;
          const senderName = msg.sender?.full_name ?? "Member";
          const prev      = messages[i - 1];
          const showName  = !isMine && (i === 0 || prev?.sender_id !== msg.sender_id);
          const showTime  = i === messages.length - 1 ||
            messages[i + 1]?.sender_id !== msg.sender_id;

          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              {!isMine && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-0.5"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", opacity: showTime ? 1 : 0 }}
                >
                  {initial(senderName)}
                </div>
              )}

              <div className={`flex flex-col max-w-[72%] ${isMine ? "items-end" : "items-start"}`}>
                {showName && (
                  <span className="text-xs mb-1 px-1" style={{ color: "var(--text-tertiary)" }}>
                    {senderName}
                  </span>
                )}
                <div
                  className="px-4 py-2.5 text-sm leading-relaxed break-words"
                  style={{
                    background: isMine ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: isMine ? "#fff" : "var(--text-primary)",
                    borderRadius: isMine
                      ? "1.2rem 1.2rem 0.3rem 1.2rem"
                      : "1.2rem 1.2rem 1.2rem 0.3rem",
                  }}
                >
                  {msg.content}
                </div>
                {showTime && (
                  <span className="text-xs mt-1 px-1" style={{ color: "var(--text-tertiary)" }}>
                    {fmtTime(msg.created_at)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message General…"
            className="flex-1 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none resize-none transition-colors focus:border-[var(--accent-primary)]"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              maxHeight: 120,
              lineHeight: "1.5",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:brightness-110 disabled:opacity-30"
            style={{ background: "var(--accent-primary)" }}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
