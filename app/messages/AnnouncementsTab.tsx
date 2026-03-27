"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pin, Plus, X } from "lucide-react";
import type { Announcement } from "./types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
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

  // Mark all current announcements as read when tab mounts
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

  // Realtime: new announcements
  useEffect(() => {
    const channel = supabase
      .channel("announcements_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, async (payload) => {
        const newRow = payload.new as Announcement;
        // Fetch creator name
        const { data: creator } = await supabase
          .from("profiles").select("full_name").eq("id", newRow.created_by ?? "").single();
        const full = { ...newRow, creator: creator ?? null };
        setAnnouncements((prev) => {
          const next = [full, ...prev.filter((a) => !a.pinned)];
          const pinned = prev.filter((a) => a.pinned);
          return [...pinned, full, ...prev.filter((a) => !a.pinned && a.id !== full.id)];
        });
        // Mark as read immediately if already viewing this tab
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

  const pinned_anns    = announcements.filter((a) => a.pinned);
  const unpinned_anns  = announcements.filter((a) => !a.pinned);
  const ordered        = [...pinned_anns, ...unpinned_anns];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
        <div>
          <h2 className="font-semibold">Announcements</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {announcements.length} announcement{announcements.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold rounded-xl px-4 py-2 transition-all hover:brightness-110"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus size={14} />
            New Announcement
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* New announcement form */}
        {showForm && (
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: "var(--accent-primary)", background: "rgba(10,132,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">New Announcement</p>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-tertiary)" }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={submitAnnouncement} className="space-y-3">
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message…"
                className="w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none resize-none focus:border-[var(--accent-primary)] transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="rounded"
                  />
                  <Pin size={13} style={{ color: "var(--accent-gold)" }} />
                  <span style={{ color: "var(--text-secondary)" }}>Pin to top</span>
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {saving ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {ordered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-semibold mb-1">No announcements yet</p>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              {isAdmin ? "Post the first announcement above." : "Check back later."}
            </p>
          </div>
        )}

        {ordered.map((ann) => {
          const unread = !localRead.has(ann.id);
          return (
            <article
              key={ann.id}
              className="rounded-2xl border p-5 space-y-2 transition-colors"
              style={{
                background: "var(--bg-secondary)",
                borderColor: ann.pinned ? "rgba(255,214,10,0.35)" : unread ? "rgba(10,132,255,0.35)" : "var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.pinned && (
                    <Pin size={13} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
                  )}
                  {unread && (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(10,132,255,0.15)", color: "var(--accent-primary)" }}
                    >
                      New
                    </span>
                  )}
                  <h3 className="font-semibold">{ann.title}</h3>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {fmtDate(ann.created_at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                {ann.body}
              </p>
              {ann.creator && (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  — {(ann.creator as { full_name: string }).full_name}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
