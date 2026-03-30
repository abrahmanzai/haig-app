"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  author?: { full_name: string } | null;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) + " · " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  pitchId: string;
  userId: string;
  userName: string;
  canComment: boolean;
  initialComments: Comment[];
}

export default function PitchComments({ pitchId, userId, userName, canComment, initialComments }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("pitch_comments_" + pitchId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "pitch_comments",
        filter: `pitch_id=eq.${pitchId}`,
      }, async (payload) => {
        const row = payload.new as Comment;
        const { data: author } = await supabase
          .from("profiles").select("full_name").eq("id", row.author_id ?? "").single();
        const full = { ...row, author: author ?? null };
        setComments((prev) => {
          if (prev.some((c) => c.id === full.id)) return prev;
          return [...prev, full];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, pitchId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const optimistic: Comment = {
      id: "opt-" + Date.now(),
      author_id: userId,
      content: text,
      created_at: new Date().toISOString(),
      author: { full_name: userName },
    };
    setComments((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from("pitch_comments")
      .insert({ pitch_id: pitchId, author_id: userId, content: text })
      .select("id")
      .single();

    if (!error && data) {
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...c, id: data.id } : c))
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setInput(text);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as unknown as React.FormEvent); }
  }

  return (
    <div
      className="rounded-2xl border border-[var(--border)] overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="font-semibold">
          Discussion
          {comments.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-[var(--border)]">
        {comments.length === 0 && (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            No comments yet. {canComment ? "Be the first to share your thoughts." : ""}
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="px-6 py-4 flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              {(c.author?.full_name ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold">
                  {c.author?.full_name ?? "Member"}
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {fmtTime(c.created_at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {canComment && (
        <form onSubmit={submit} className="px-6 py-4 border-t border-[var(--border)] flex gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            {userName[0].toUpperCase()}
          </div>
          <div className="flex-1 flex gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts on this pitch… (Enter to post)"
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none resize-none transition-colors focus:border-[var(--accent-primary)]"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="self-end rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: "var(--accent-primary)", color: "#fff" }}
            >
              {sending ? "…" : "Post"}
            </button>
          </div>
        </form>
      )}
      {!canComment && (
        <p className="px-6 py-4 border-t border-[var(--border)] text-xs" style={{ color: "var(--text-tertiary)" }}>
          Only Authorized Members can post comments.
        </p>
      )}
    </div>
  );
}
