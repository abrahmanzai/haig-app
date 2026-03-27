"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pin, Plus, X, Megaphone } from "lucide-react";
import type { Announcement } from "./types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday · " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// Deterministic color per name
const AVATAR_COLORS = ["#0a84ff","#30d158","#bf5af2","#ff9f0a","#ff453a","#64d2ff","#ffd60a"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

interface Props {
  userId: string;
  isAdmin: boolean;
  initialAnnouncements: Announcement[];
  readIds: Set<string>;
  onMarkRead: (ids: string[]) => void;
}

export default function AnnouncementsTab({ userId, isAdmin, initialAnnouncements, readIds, onMarkRead }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [showForm,  setShowForm]  = useState(false);
  const [title,     setTitle]     = useState("");
  const [body,      setBody]      = useState("");
  const [pinned,    setPinned]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [localRead, setLocalRead] = useState<Set<string>>(readIds);
  const supabase = createClient();
  const didMarkRef = useRef(false);

  // Mark all current announcements as read on mount
  useEffect(() => {
    if (didMarkRef.current) return;
    didMarkRef.current = true;
    const unread = announcements.filter((a) => !localRead.has(a.id)).map((a) => a.id);
    if (unread.length === 0) return;
    const rows = unread.map((id) => ({ user_id: userId, announcement_id: id }));
    supabase.from("announcement_reads").upsert(rows, { onConflict: "user_id,announcement_id" }).then(() => {
      setLocalRead((prev) => new Set([...Array.from(prev), ...unread]));
      onMarkRead(unread);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("announcements_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, async (payload) => {
        const newRow = payload.new as Announcement;
        const { data: creator } = await supabase
          .from("profiles").select("full_name").eq("id", newRow.created_by ?? "").single();
        const full = { ...newRow, creator: creator ?? null };
        setAnnouncements((prev) => [
          ...prev.filter((a) => a.pinned),
          full,
          ...prev.filter((a) => !a.pinned && a.id !== full.id),
        ]);
        supabase.from("announcement_reads")
          .upsert([{ user_id: userId, announcement_id: full.id }], { onConflict: "user_id,announcement_id" });
        setLocalRead((prev) => new Set([...Array.from(prev), full.id]));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, (payload) => {
        const updated = payload.new as Announcement;
        setAnnouncements((prev) => {
          const next = prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a));
          return [...next.filter((a) => a.pinned), ...next.filter((a) => !a.pinned)];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userId]);

  async function submitAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await supabase.from("announcements").insert({
      title: title.trim(),
      body: body.trim(),
      pinned,
      created_by: userId,
    });
    setTitle(""); setBody(""); setPinned(false); setShowForm(false);
    setSaving(false);
  }

  const ordered = [
    ...announcements.filter((a) => a.pinned),
    ...announcements.filter((a) => !a.pinned),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(10,132,255,0.15)" }}
          >
            <Megaphone size={17} style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Announcements</h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {announcements.length} total
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3.5 py-2 transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus size={13} />
            New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">

        {/* ── New announcement form ─────────────────────────────── */}
        {showForm && (
          <div
            className="rounded-2xl border p-5 space-y-3 mb-2"
            style={{ borderColor: "var(--accent-primary)", background: "rgba(10,132,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>New Announcement</p>
              <button
                onClick={() => { setShowForm(false); setTitle(""); setBody(""); setPinned(false); }}
                className="rounded-lg p-1 hover:bg-[var(--bg-tertiary)] transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={submitAnnouncement} className="space-y-3">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              />
              <textarea
                required
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none resize-none focus:border-[var(--accent-primary)] transition-colors"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded"
                  />
                  <Pin size={12} style={{ color: "var(--accent-gold)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Pin to top</span>
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50 hover:brightness-110 transition-all active:scale-95"
                  style={{ background: "var(--accent-primary)", color: "#fff" }}
                >
                  {saving ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {ordered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--bg-secondary)" }}
            >
              <Megaphone size={24} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1">No announcements yet</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {isAdmin ? "Post the first announcement above." : "Check back later."}
              </p>
            </div>
          </div>
        )}

        {/* ── Announcement cards ───────────────────────────────── */}
        {ordered.map((ann) => {
          const unread = !localRead.has(ann.id);
          const creatorName = (ann.creator as { full_name: string } | null)?.full_name ?? "Admin";
          const color = avatarColor(creatorName);

          return (
            <article
              key={ann.id}
              className="rounded-2xl overflow-hidden transition-all"
              style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${ann.pinned ? "rgba(255,214,10,0.25)" : unread ? "rgba(10,132,255,0.25)" : "var(--border)"}`,
              }}
            >
              {/* Accent stripe */}
              <div
                className="h-0.5 w-full"
                style={{
                  background: ann.pinned
                    ? "linear-gradient(90deg, var(--accent-gold), transparent)"
                    : unread
                    ? "linear-gradient(90deg, var(--accent-primary), transparent)"
                    : "transparent",
                }}
              />

              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {ann.pinned && (
                      <Pin size={12} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
                    )}
                    {unread && (
                      <span
                        className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(10,132,255,0.15)", color: "var(--accent-primary)" }}
                      >
                        New
                      </span>
                    )}
                    <h3 className="font-semibold text-sm truncate">{ann.title}</h3>
                  </div>
                  <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {fmtDate(ann.created_at)}
                  </span>
                </div>

                {/* Body */}
                <p
                  className="text-sm leading-relaxed whitespace-pre-line mb-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ann.body}
                </p>

                {/* Footer: avatar + name */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: color + "25", color }}
                  >
                    {creatorName[0].toUpperCase()}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {creatorName}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
