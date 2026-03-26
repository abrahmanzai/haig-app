"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Check, Pencil } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  capital_contribution: number | null;
  voting_units: number | null;
  joined_at: string | null;
}

interface CalEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string;
}

interface Props {
  members: Member[];
  events: CalEvent[];
  adminId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin",      color: "#ffd60a" },
  authorized: { label: "Authorized", color: "#30d158" },
  member:     { label: "Member",     color: "#0a84ff" },
};

const EVENT_TYPES = ["founding","meeting","workshop","speaker","social","deadline","review"];

const EVENT_COLORS: Record<string, string> = {
  founding: "#ffd60a", meeting: "#0a84ff", workshop: "#30d158",
  speaker: "#bf5af2", social: "#ff9f0a", deadline: "#ff453a", review: "#64d2ff",
};

function usd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const EMPTY_EVENT_FORM = {
  title: "", description: "", event_type: "meeting",
  event_date: "", event_time: "", location: "",
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminClient({ members: initialMembers, events: initialEvents, adminId }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [events,  setEvents]  = useState<CalEvent[]>(initialEvents);

  // ── Member editing state ────────────────────────────────────────────────────
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<{ role: string; capital: string }>({ role: "", capital: "" });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError]   = useState<string | null>(null);

  // ── Event form state ────────────────────────────────────────────────────────
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventForm, setEventForm]       = useState({ ...EMPTY_EVENT_FORM });
  const [eventSaving, setEventSaving]   = useState(false);
  const [eventError, setEventError]     = useState<string | null>(null);

  // ── Member handlers ─────────────────────────────────────────────────────────

  function startEditMember(m: Member) {
    setEditingMember(m.id);
    setMemberForm({ role: m.role, capital: String(m.capital_contribution ?? 0) });
    setMemberError(null);
  }

  async function saveMember(id: string) {
    setMemberSaving(true);
    setMemberError(null);

    const original = members.find((m) => m.id === id)!;
    const body: Record<string, unknown> = {};
    if (memberForm.role !== original.role) body.role = memberForm.role;
    const newCapital = parseFloat(memberForm.capital);
    if (!isNaN(newCapital) && newCapital !== (original.capital_contribution ?? 0)) {
      body.capital_contribution = newCapital;
    }

    if (Object.keys(body).length === 0) {
      setEditingMember(null);
      setMemberSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json();
      setMemberError(json.error ?? "Update failed");
      setMemberSaving(false);
      return;
    }

    const { member } = await res.json();
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...member } : m)));
    setEditingMember(null);
    setMemberSaving(false);
    router.refresh();
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    setEventSaving(true);
    setEventError(null);

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventForm),
    });

    if (!res.ok) {
      const json = await res.json();
      setEventError(json.error ?? "Failed to create event");
      setEventSaving(false);
      return;
    }

    const { event } = await res.json();
    setEvents((prev) =>
      [...prev, event].sort((a, b) => a.event_date.localeCompare(b.event_date))
    );
    setAddEventOpen(false);
    setEventForm({ ...EMPTY_EVENT_FORM });
    setEventSaving(false);
    router.refresh();
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      router.refresh();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Members table ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold">Members</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Click the pencil icon to edit role or capital contribution
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Name", "Email", "Role", "Capital", "Voting Units", "Joined", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isEditing = editingMember === member.id;
                const roleCfg   = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;

                return (
                  <tr
                    key={member.id}
                    className="border-b border-[var(--border)] last:border-0"
                    style={isEditing ? { background: "rgba(10,132,255,0.05)" } : undefined}
                  >
                    <td className="px-6 py-4 font-medium">{member.full_name}</td>
                    <td className="px-6 py-4" style={{ color: "var(--text-secondary)" }}>
                      {member.email}
                    </td>

                    {/* Role cell */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={memberForm.role}
                          onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}
                          className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm outline-none"
                          style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                        >
                          {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
                            <option key={r} value={r}>{cfg.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="text-xs font-semibold rounded-full px-2.5 py-1"
                          style={{ background: roleCfg.color + "20", color: roleCfg.color }}
                        >
                          {roleCfg.label}
                        </span>
                      )}
                    </td>

                    {/* Capital cell */}
                    <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={memberForm.capital}
                          onChange={(e) => setMemberForm((f) => ({ ...f, capital: e.target.value }))}
                          className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm w-28 outline-none tabular-nums"
                          style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                        />
                      ) : (
                        usd(member.capital_contribution ?? 0)
                      )}
                    </td>

                    <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {(member.voting_units ?? 0).toFixed(4)}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--text-tertiary)" }}>
                      {member.joined_at ? fmtDate(member.joined_at.split("T")[0]) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveMember(member.id)}
                            disabled={memberSaving}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ background: "rgba(48,209,88,0.15)", color: "#30d158" }}
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(255,69,58,0.12)", color: "#ff453a" }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        // Don't allow editing yourself to avoid accidental lockout
                        member.id !== adminId && (
                          <button
                            onClick={() => startEditMember(member)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{ color: "var(--text-tertiary)" }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {memberError && (
          <p className="px-6 py-3 text-sm" style={{ color: "var(--accent-red)" }}>
            {memberError}
          </p>
        )}
      </div>

      {/* ── Events panel ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold">Events</h2>
          <button
            onClick={() => { setAddEventOpen(true); setEventError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus size={12} />
            Add Event
          </button>
        </div>

        {events.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            No events yet.
          </p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {events.map((ev) => {
              const color = EVENT_COLORS[ev.event_type] ?? "#888";
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{ev.title}</span>
                    <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
                      {fmtDate(ev.event_date)} · {ev.location}
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold rounded px-1.5 py-0.5 capitalize flex-shrink-0"
                    style={{ background: color + "18", color }}
                  >
                    {ev.event_type}
                  </span>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-1.5 rounded-lg transition-colors ml-1 flex-shrink-0"
                    style={{ color: "var(--text-tertiary)" }}
                    title="Delete event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add event modal ─────────────────────────────────────────────────── */}
      {addEventOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setAddEventOpen(false)}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }} />
          <div
            className="relative rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-2xl"
            style={{ background: "var(--bg-secondary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Add Event</h3>
              <button
                onClick={() => setAddEventOpen(false)}
                className="p-0.5 rounded hover:text-white transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="grid gap-3">
              <input
                type="text"
                required
                placeholder="Event title *"
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
              <textarea
                placeholder="Description (optional)"
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm resize-none outline-none"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_type: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t} style={{ textTransform: "capitalize" }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", colorScheme: "dark" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={eventForm.event_time}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_time: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", colorScheme: "dark" }}
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                />
              </div>

              {eventError && (
                <p className="text-sm" style={{ color: "var(--accent-red)" }}>{eventError}</p>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setAddEventOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eventSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ background: "var(--accent-primary)" }}
                >
                  {eventSaving ? "Saving…" : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
