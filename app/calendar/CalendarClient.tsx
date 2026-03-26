"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, ChevronRight, Plus, X, LayoutGrid, List,
} from "lucide-react";
import { formatDate, formatLongDate } from "@/lib/date";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;      // "YYYY-MM-DD"
  event_time: string | null;
  location: string;
}

interface Props {
  events: CalendarEvent[];
  isAdmin: boolean;
  userId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  founding: { label: "Founding",  color: "#ffd60a" },  // gold
  meeting:  { label: "Meeting",   color: "#0a84ff" },  // blue
  workshop: { label: "Workshop",  color: "#30d158" },  // green
  speaker:  { label: "Speaker",   color: "#bf5af2" },  // purple
  social:   { label: "Social",    color: "#ff9f0a" },  // orange
  deadline: { label: "Deadline",  color: "#ff453a" },  // red
  review:   { label: "Review",    color: "#64d2ff" },  // teal
};

const PHASES = [
  { label: "Phase 1 — Foundation & Learning", start: "2026-03-01", end: "2026-05-31" },
  { label: "Phase 2 — First Investments",     start: "2026-06-01", end: "2026-08-31" },
  { label: "Phase 3 — Fall Expansion",        start: "2026-09-01", end: "2026-11-30" },
  { label: "Phase 4 — Year End & FY2 Launch", start: "2026-12-01", end: "2027-03-31" },
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EMPTY_FORM = {
  title: "", description: "", event_type: "meeting",
  event_date: "", event_time: "", location: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGCalUrl(ev: CalendarEvent): string {
  // Format: YYYYMMDDTHHMMSS (local) or YYYYMMDD (all-day)
  const [year, month, day] = ev.event_date.split("-");
  if (ev.event_time) {
    const [hh, mm] = ev.event_time.split(":");
    const pad = (s: string) => s.padStart(2, "0");
    const start = `${year}${month}${day}T${pad(hh)}${pad(mm)}00`;
    // Default 2-hour duration
    const startDate = new Date(`${ev.event_date}T${ev.event_time}:00`);
    const endDate   = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const ey = endDate.getFullYear();
    const em = String(endDate.getMonth() + 1).padStart(2, "0");
    const ed = String(endDate.getDate()).padStart(2, "0");
    const eh = String(endDate.getHours()).padStart(2, "0");
    const en = String(endDate.getMinutes()).padStart(2, "0");
    const end = `${ey}${em}${ed}T${eh}${en}00`;
    const params = new URLSearchParams({
      action:   "TEMPLATE",
      text:     ev.title,
      dates:    `${start}/${end}`,
      details:  ev.description ?? "",
      location: ev.location ?? "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } else {
    // All-day event — next day as end (Google Calendar convention)
    const startDate = new Date(`${ev.event_date}T00:00:00`);
    const endDate   = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    const ey = endDate.getFullYear();
    const em = String(endDate.getMonth() + 1).padStart(2, "0");
    const ed = String(endDate.getDate()).padStart(2, "0");
    const start = `${year}${month}${day}`;
    const end   = `${ey}${em}${ed}`;
    const params = new URLSearchParams({
      action:   "TEMPLATE",
      text:     ev.title,
      dates:    `${start}/${end}`,
      details:  ev.description ?? "",
      location: ev.location ?? "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}


// ─── Root component ───────────────────────────────────────────────────────────

export default function CalendarClient({ events: initialEvents, isAdmin, userId }: Props) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // ── State ──────────────────────────────────────────────────────────────────
  const [view,            setView]           = useState<"grid" | "timeline">("grid");
  const [currentYear,     setCurrentYear]    = useState(today.getFullYear());
  const [currentMonth,    setCurrentMonth]   = useState(today.getMonth());
  const [selectedDate,    setSelectedDate]   = useState<string | null>(null);
  const [activeFilters,   setActiveFilters]  = useState<Set<string>>(new Set(Object.keys(EVENT_CONFIG)));
  const [events,          setEvents]         = useState<CalendarEvent[]>(initialEvents);
  const [addOpen,         setAddOpen]        = useState(false);
  const [form,            setForm]           = useState({ ...EMPTY_FORM });
  const [saving,          setSaving]         = useState(false);
  const [saveError,       setSaveError]      = useState<string | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredEvents = useMemo(
    () => events.filter((e) => activeFilters.has(e.event_type)),
    [events, activeFilters],
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filteredEvents) {
      (map[e.event_date] ??= []).push(e);
    }
    return map;
  }, [filteredEvents]);

  const gridCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay    = getFirstDayOfMonth(currentYear, currentMonth);
    const empties     = Array<null>(firstDay).fill(null);
    const days        = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
    return [...empties, ...days];
  }, [currentYear, currentMonth]);

  const phaseGroups = useMemo(
    () =>
      PHASES
        .map((p) => ({
          ...p,
          events: filteredEvents.filter((e) => e.event_date >= p.start && e.event_date <= p.end),
        }))
        .filter((p) => p.events.length > 0),
    [filteredEvents],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function toggleFilter(type: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function handleDayClick(dateStr: string) {
    if (!eventsByDate[dateStr]?.length) return;
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        title:       form.title,
        description: form.description || null,
        event_type:  form.event_type,
        event_date:  form.event_date,
        event_time:  form.event_time  || null,
        location:    form.location    || "TBD",
        created_by:  userId ?? null,
      })
      .select()
      .single();

    if (error) { setSaveError(error.message); setSaving(false); return; }
    if (data) {
      setEvents((prev) =>
        [...prev, data as CalendarEvent].sort((a, b) =>
          a.event_date.localeCompare(b.event_date),
        ),
      );
      setAddOpen(false);
      setForm({ ...EMPTY_FORM });
    }
    setSaving(false);
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: 0 }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} · FY 2026–27
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div
              className="flex rounded-xl border border-[var(--border)] overflow-hidden"
              style={{ background: "var(--bg-secondary)" }}
            >
              {(["grid", "timeline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
                  style={
                    view === v
                      ? { background: "var(--bg-tertiary)", color: "var(--text-primary)" }
                      : { color: "var(--text-tertiary)" }
                  }
                >
                  {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                  {v === "grid" ? "Grid" : "Timeline"}
                </button>
              ))}
            </div>

            {/* Add Event (admin only) */}
            {isAdmin && (
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
                style={{ background: "var(--accent-primary)" }}
              >
                <Plus size={14} />
                Add Event
              </button>
            )}
          </div>
        </div>

        {/* ── Legend / Filters ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
            const active = activeFilters.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={
                  active
                    ? { background: cfg.color + "18", color: cfg.color, borderColor: cfg.color + "55" }
                    : { background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)", opacity: 0.45 }
                }
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: active ? cfg.color : "#555" }}
                />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* ── Main view ───────────────────────────────────────────────────── */}
        {view === "grid" ? (
          <GridView
            cells={gridCells}
            eventsByDate={eventsByDate}
            currentYear={currentYear}
            currentMonth={currentMonth}
            todayStr={todayStr}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            onPrev={prevMonth}
            onNext={nextMonth}
          />
        ) : (
          <TimelineView phaseGroups={phaseGroups} />
        )}
      </div>

      {/* ── Day detail modal ────────────────────────────────────────────────── */}
      {selectedDate && (
        <Modal onClose={() => setSelectedDate(null)}>
          <div className="flex items-start justify-between mb-5">
            <h3 className="font-semibold text-lg pr-4">{formatLongDate(selectedDate)}</h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-0.5 rounded hover:text-white transition-colors flex-shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={18} />
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No events on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev) => {
                const color = EVENT_CONFIG[ev.event_type]?.color ?? "#888";
                return (
                  <article
                    key={ev.id}
                    className="rounded-xl p-4 border border-[var(--border)]"
                    style={{
                      borderLeftColor: color,
                      borderLeftWidth: 3,
                      background: "var(--bg-tertiary)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color }}
                      >
                        {EVENT_CONFIG[ev.event_type]?.label ?? ev.event_type}
                      </span>
                      {ev.event_time && (
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          · {ev.event_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {ev.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        📍 {ev.location}
                      </p>
                      <a
                        href={buildGCalUrl(ev)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors flex-shrink-0"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Add to Google Calendar
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ── Add event modal (admin) ──────────────────────────────────────────── */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)}>
          <form onSubmit={handleAddEvent}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Add Event</h3>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="p-0.5 rounded hover:text-white transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3">
              <FormInput
                placeholder="Event title *"
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm resize-none outline-none transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.event_type}
                  onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  {Object.entries(EVENT_CONFIG).map(([type, cfg]) => (
                    <option key={type} value={type}>{cfg.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", colorScheme: "dark" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                  placeholder="Time (optional)"
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", colorScheme: "dark" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <FormInput
                  placeholder="Location"
                  value={form.location}
                  onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm mt-3" style={{ color: "var(--accent-red)" }}>{saveError}</p>
            )}

            <div className="flex gap-3 mt-6 justify-end">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                style={{ background: "var(--accent-primary)" }}
              >
                {saving ? "Saving…" : "Add Event"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────────────

function GridView({
  cells, eventsByDate, currentYear, currentMonth,
  todayStr, selectedDate, onDayClick, onPrev, onNext,
}: {
  cells: (string | null)[];
  eventsByDate: Record<string, CalendarEvent[]>;
  currentYear: number;
  currentMonth: number;
  todayStr: string;
  selectedDate: string | null;
  onDayClick: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-[var(--border)] overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="font-semibold">{MONTHS[currentMonth]} {currentYear}</h3>
        <button
          onClick={onNext}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return (
              <div
                key={`empty-${idx}`}
                className="border-b border-r border-[var(--border)]"
                style={{ minHeight: "4.5rem", opacity: 0.15 }}
              />
            );
          }

          const dayEvents = eventsByDate[dateStr] ?? [];
          const day       = parseInt(dateStr.slice(8));
          const isToday   = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasEvents  = dayEvents.length > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              disabled={!hasEvents}
              className="border-b border-r border-[var(--border)] p-1.5 text-left flex flex-col transition-colors disabled:cursor-default"
              style={{
                minHeight: "4.5rem",
                background: isSelected
                  ? "rgba(10,132,255,0.08)"
                  : hasEvents
                  ? undefined
                  : undefined,
              }}
              onMouseEnter={(e) => {
                if (hasEvents) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = isSelected
                  ? "rgba(10,132,255,0.08)"
                  : "";
              }}
            >
              {/* Day number */}
              <span
                className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0"
                style={
                  isToday
                    ? { background: "var(--accent-primary)", color: "#fff", fontWeight: 700 }
                    : { color: "var(--text-secondary)" }
                }
              >
                {day}
              </span>

              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1 px-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: EVENT_CONFIG[ev.event_type]?.color ?? "#888" }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] leading-none" style={{ color: "var(--text-tertiary)" }}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Timeline view ────────────────────────────────────────────────────────────

function TimelineView({
  phaseGroups,
}: {
  phaseGroups: Array<{ label: string; events: CalendarEvent[] }>;
}) {
  if (phaseGroups.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: "var(--text-tertiary)" }}>
        No events match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {phaseGroups.map((phase) => (
        <div key={phase.label}>
          {/* Phase divider */}
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span
              className="text-xs font-semibold uppercase tracking-widest px-2 whitespace-nowrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {phase.label}
            </span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Events */}
          <div className="relative pl-8">
            {/* Vertical spine */}
            <div
              className="absolute left-[11px] top-0 bottom-0 w-px"
              style={{ background: "var(--border)" }}
            />

            <div className="space-y-3">
              {phase.events.map((ev) => {
                const color = EVENT_CONFIG[ev.event_type]?.color ?? "#888";
                return (
                  <article
                    key={ev.id}
                    className="relative rounded-xl border border-[var(--border)] p-4 hover:border-[var(--border-hover)] transition-colors"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {/* Timeline dot */}
                    <span
                      className="absolute -left-[1.15rem] top-5 w-3 h-3 rounded-full border-2 z-10"
                      style={{
                        background: color,
                        borderColor: "var(--bg-primary)",
                      }}
                    />

                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs font-semibold uppercase tracking-wide rounded px-2 py-0.5"
                            style={{ background: color + "18", color }}
                          >
                            {EVENT_CONFIG[ev.event_type]?.label ?? ev.event_type}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            📍 {ev.location}
                          </span>
                        </div>
                        <h4 className="font-semibold">{ev.title}</h4>
                        {ev.description && (
                          <p
                            className="text-sm mt-1.5 leading-relaxed"
                            style={{
                              color: "var(--text-secondary)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {ev.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(ev.event_date)}
                        </div>
                        {ev.event_time && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                            {ev.event_time.slice(0, 5)}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div
        className="relative rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--bg-secondary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FormInput({
  placeholder, value, onChange, required,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
      onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
    />
  );
}
