"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Users,
  CheckCircle2, Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  event_time: string | null;
  location: string;
}

interface AttendanceMember {
  member_id: string;
  present: boolean;
  rsvp: boolean;
  full_name: string;
}

interface Props {
  event: CalendarEvent;
  userId: string;
  isAdmin: boolean;
  userRsvp: boolean;
  rsvpCount: number;
  attendanceList: AttendanceMember[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  founding: { label: "Founding",  color: "#ffd60a" },
  meeting:  { label: "Meeting",   color: "#0a84ff" },
  workshop: { label: "Workshop",  color: "#30d158" },
  speaker:  { label: "Speaker",   color: "#bf5af2" },
  social:   { label: "Social",    color: "#ff9f0a" },
  deadline: { label: "Deadline",  color: "#ff453a" },
  review:   { label: "Review",    color: "#64d2ff" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function buildGCalUrl(ev: CalendarEvent): string {
  const [year, month, day] = ev.event_date.split("-");
  if (ev.event_time) {
    const [hh, mm] = ev.event_time.split(":");
    const pad = (s: string) => s.padStart(2, "0");
    const start = `${year}${month}${day}T${pad(hh)}${pad(mm)}00`;
    const startDate = new Date(`${ev.event_date}T${ev.event_time}:00`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(endDate.getDate()).padStart(2, "0")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
    const params = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates: `${start}/${end}`, details: ev.description ?? "", location: ev.location ?? "" });
    return `https://calendar.google.com/calendar/render?${params}`;
  }
  const nextDay = new Date(`${ev.event_date}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const end = `${nextDay.getFullYear()}${String(nextDay.getMonth() + 1).padStart(2, "0")}${String(nextDay.getDate()).padStart(2, "0")}`;
  const params = new URLSearchParams({ action: "TEMPLATE", text: ev.title, dates: `${year}${month}${day}/${end}`, details: ev.description ?? "", location: ev.location ?? "" });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EventRsvpClient({
  event, userId, isAdmin, userRsvp: initialRsvp, rsvpCount: initialCount, attendanceList: initialAttendance,
}: Props) {
  const [rsvp,           setRsvp]           = useState(initialRsvp);
  const [rsvpCount,      setRsvpCount]      = useState(initialCount);
  const [rsvpSaving,     setRsvpSaving]     = useState(false);
  const [attendance,     setAttendance]     = useState<Record<string, boolean>>(
    Object.fromEntries(initialAttendance.map((a) => [a.member_id, a.present])),
  );
  const [attendanceSaving, setAttendanceSaving] = useState<Set<string>>(new Set());

  const cfg   = EVENT_CONFIG[event.event_type] ?? { label: event.event_type, color: "var(--text-secondary)" };
  const isPast = event.event_date < new Date().toISOString().slice(0, 10);

  async function toggleRsvp() {
    setRsvpSaving(true);
    const next = !rsvp;
    const supabase = createClient();
    const { error } = await supabase
      .from("attendance")
      .upsert(
        { event_id: event.id, member_id: userId, rsvp: next },
        { onConflict: "event_id,member_id" },
      );
    if (!error) {
      setRsvp(next);
      setRsvpCount((c) => c + (next ? 1 : -1));
    }
    setRsvpSaving(false);
  }

  async function togglePresent(memberId: string) {
    const was = attendance[memberId] ?? false;
    const now = !was;
    setAttendanceSaving((prev) => new Set([...Array.from(prev), memberId]));
    setAttendance((prev) => ({ ...prev, [memberId]: now }));
    const supabase = createClient();
    const { error } = await supabase
      .from("attendance")
      .upsert(
        { event_id: event.id, member_id: memberId, present: now },
        { onConflict: "event_id,member_id" },
      );
    if (error) setAttendance((prev) => ({ ...prev, [memberId]: was }));
    setAttendanceSaving((prev) => { const s = new Set(Array.from(prev)); s.delete(memberId); return s; });
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href="/calendar"
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={14} />
        Back to Calendar
      </Link>

      {/* ── Event header card ────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "var(--bg-glass)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
          borderTopColor: cfg.color,
          borderTopWidth: 3,
        }}
      >
        <div className="p-6">
          {/* Type badge */}
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
            style={{ background: cfg.color + "18", color: cfg.color }}
          >
            {cfg.label}
          </span>

          <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h1>

          {/* Meta row */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <CalendarDays size={15} style={{ color: cfg.color, flexShrink: 0 }} />
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            {event.event_time && (
              <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Clock size={15} style={{ color: cfg.color, flexShrink: 0 }} />
                <span>{formatTime(event.event_time)}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              <MapPin size={15} style={{ color: cfg.color, flexShrink: 0 }} />
              <span>{event.location}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p
              className="mt-5 text-sm leading-relaxed border-t pt-4"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
            >
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* ── RSVP + Google Calendar row ───────────────────────────────────── */}
      {!isPast && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleRsvp}
            disabled={rsvpSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={
              rsvp
                ? { background: "rgba(48,209,88,0.15)", color: "var(--accent-green)", border: "1px solid rgba(48,209,88,0.3)" }
                : { background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }
            }
          >
            {rsvp ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {rsvpSaving ? "Saving…" : rsvp ? "Going" : "RSVP"}
          </button>

          <a
            href={buildGCalUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border transition-colors hover:bg-[var(--bg-tertiary)]"
            style={{ color: "var(--accent-primary)", borderColor: "var(--border)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Add to Google Calendar
          </a>
        </div>
      )}

      {/* ── RSVP count ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
        style={{ background: "var(--bg-glass)", border: "1px solid var(--border)" }}
      >
        <Users size={15} style={{ color: "var(--text-secondary)" }} />
        <span style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{rsvpCount}</strong>{" "}
          {rsvpCount === 1 ? "member" : "members"} {isPast ? "attended" : "attending"}
        </span>
      </div>

      {/* ── Admin attendance panel ───────────────────────────────────────── */}
      {isAdmin && initialAttendance.length > 0 && (
        <div
          className="rounded-2xl border border-[var(--border)] overflow-hidden"
          style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)" }}
        >
          <div
            className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Attendance
            </h2>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--accent-green)" }}>
              {presentCount} / {initialAttendance.length} present
            </span>
          </div>

          <div>
            {initialAttendance.map((member, i) => {
              const present  = attendance[member.member_id] ?? false;
              const isSaving = attendanceSaving.has(member.member_id);
              return (
                <button
                  key={member.member_id}
                  onClick={() => togglePresent(member.member_id)}
                  disabled={isSaving}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
                  style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all"
                    style={{
                      background: present ? "var(--accent-green)" : "transparent",
                      borderColor: present ? "var(--accent-green)" : "var(--border)",
                    }}
                  >
                    {present && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium">{member.full_name}</span>
                  {member.rsvp && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: "rgba(48,209,88,0.12)", color: "var(--accent-green)" }}>
                      RSVP'd
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
