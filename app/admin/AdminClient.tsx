"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Check, Pencil } from "lucide-react";
import { formatDate } from "@/lib/date";

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

interface Holding {
  id: string;
  company_name: string;
  ticker: string;
  shares: number;
  avg_cost_basis: number;
  current_price: number | null;
}

interface Trade {
  id: string;
  company_name: string;
  ticker: string;
  trade_type: string;
  shares: number;
  price_per_share: number;
  trade_date: string;
  notes: string | null;
}

interface Financials {
  cash_on_hand: number;
  total_invested: number;
}

interface Props {
  members: Member[];
  events: CalEvent[];
  holdings: Holding[];
  trades: Trade[];
  financials: Financials | null;
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

// ─── Event idea bank (reference only — not in the database) ──────────────────

const EVENT_IDEAS: { title: string; type: string; description: string }[] = [
  { type: "founding", title: "Founding Meeting",                          description: "Sign partnership agreement. Elect Authorized Trader. Set initial capital contribution expectations. Establish communication channels." },
  { type: "deadline", title: "Fiscal Year Begins",                        description: "Official start of FY1. Capital accounts open." },
  { type: "meeting",  title: "Kickoff Meeting: Club Vision & Bylaws",     description: "Walk through the partnership agreement together. Q&A on voting, contributions, dissociation rules. Set meeting cadence." },
  { type: "workshop", title: "Workshop: Brokerage Accounts 101",          description: "How to open a brokerage account. Difference between taxable, Roth IRA, traditional IRA. Live demo of placing a trade." },
  { type: "meeting",  title: "Meeting: Index Funds & ETFs Deep Dive",     description: "What are index funds? SPY, VOO, VTI, SCHD comparisons. Dollar-cost averaging strategy. First pitch practice round (informal)." },
  { type: "speaker",  title: "Speaker: Local Financial Advisor or CFA",   description: "Invite a financial professional to speak on portfolio construction and risk management. Q&A session." },
  { type: "deadline", title: "Deadline: Initial Capital Contributions",    description: "All founding members submit initial capital contributions. Treasurer records capital accounts." },
  { type: "meeting",  title: "Meeting: Reading Financial Statements",      description: "How to read a 10-K, income statement, balance sheet, cash flow. Practice with a real company." },
  { type: "workshop", title: "Workshop: Stock Screeners & Research Tools", description: "Hands-on with Finviz, TradingView, SEC EDGAR. How to filter for value, growth, dividend stocks." },
  { type: "meeting",  title: "First Investment Pitch Night",               description: "Members present stock/ETF pitches (5-10 min each). Thesis, financials, risks, price target. Vote on top picks." },
  { type: "speaker",  title: "Speaker: Entrepreneurship & Investing",      description: "Invite a local entrepreneur to discuss building wealth through business ownership and market investing." },
  { type: "review",   title: "Mid-Year Portfolio Review",                  description: "Review current holdings and performance. Discuss rebalancing. Open floor for new pitches or exits." },
  { type: "social",   title: "Social: Investing Movie Night",              description: "Watch The Big Short or Margin Call together. Discussion afterward on lessons and market psychology." },
  { type: "meeting",  title: "Fall Kickoff & New Member Orientation",      description: "Present club mission, partnership agreement overview, how to join. Recruit new members." },
  { type: "workshop", title: "Workshop: Compound Interest & Time Value",   description: "The math behind financial freedom. Compound interest calculators, retirement projections." },
  { type: "meeting",  title: "Investment Pitch Night #2",                  description: "Second round of formal pitches. Vote on new allocations. Review prior investments." },
  { type: "speaker",  title: "Speaker: Real Estate Investing",             description: "Discuss REITs, rental properties, and real estate as a portfolio diversifier." },
  { type: "workshop", title: "Workshop: Risk Management & Diversification", description: "Position sizing, asset allocation models, correlation. Why diverse perspectives improve decisions." },
  { type: "meeting",  title: "Meeting: Tax Implications of Investing",     description: "Capital gains (short vs. long term), tax-loss harvesting, K-1 forms for partnerships." },
  { type: "social",   title: "Social: Club Outing",                        description: "Team-building outing. Discuss investing philosophy and club goals in a relaxed setting." },
  { type: "review",   title: "End-of-Year Portfolio Review",               description: "Full portfolio performance review. Compare against S&P 500 benchmark. Discuss wins, losses, lessons." },
  { type: "workshop", title: "Workshop: Goal Setting & Personal Finance",  description: "Each member sets personal financial goals. Budgeting, emergency funds, debt payoff strategies." },
  { type: "meeting",  title: "Spring Kickoff & Recruitment Drive",         description: "New semester, new members. Re-introduce club mission. Partnership agreement signing for new partners." },
  { type: "meeting",  title: "Investment Pitch Night #3",                  description: "Fresh pitches for the new year. Sector rotation discussion. Vote on allocations." },
  { type: "speaker",  title: "Speaker: Careers in Finance",                description: "Discuss career paths: investment banking, asset management, fintech, financial planning." },
  { type: "workshop", title: "Workshop: Options & Derivatives Intro",      description: "Basics of options (calls, puts, covered calls). Educational only — not for club capital." },
  { type: "review",   title: "Annual General Meeting & Year Wrap-Up",      description: "Full-year performance report. Vote on leadership for next FY. Set goals and contribution levels." },
  { type: "deadline", title: "Fiscal Year End",                            description: "Close FY books. Treasurer finalizes capital account statements for all partners." },
];

const EMPTY_EVENT_FORM = {
  title: "", description: "", event_type: "meeting",
  event_date: "", event_time: "", location: "",
};

const EMPTY_HOLDING_FORM = {
  company_name: "", ticker: "", shares: "", avg_cost_basis: "",
};

const EMPTY_TRADE_FORM = {
  company_name: "", ticker: "", trade_type: "buy",
  shares: "", price_per_share: "", trade_date: "", notes: "",
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminClient({
  members: initialMembers,
  events: initialEvents,
  holdings: initialHoldings,
  trades: initialTrades,
  financials: initialFinancials,
  adminId,
}: Props) {
  const router = useRouter();

  // ── Member state ────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<{ role: string; capital: string }>({ role: "", capital: "" });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberError, setMemberError]   = useState<string | null>(null);

  // ── Event state ─────────────────────────────────────────────────────────────
  const [events, setEvents]         = useState<CalEvent[]>(initialEvents);
  const [ideasOpen, setIdeasOpen]   = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventForm, setEventForm]   = useState({ ...EMPTY_EVENT_FORM });
  const [eventSaving, setEventSaving] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // ── Holdings state ──────────────────────────────────────────────────────────
  const [holdings, setHoldings]           = useState<Holding[]>(initialHoldings);
  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [holdingForm, setHoldingForm]     = useState({ ...EMPTY_HOLDING_FORM });
  const [holdingSaving, setHoldingSaving] = useState(false);
  const [holdingError, setHoldingError]   = useState<string | null>(null);
  const [editingHolding, setEditingHolding] = useState<string | null>(null);
  const [holdingEditForm, setHoldingEditForm] = useState({ shares: "", avg_cost_basis: "" });

  // ── Trades state ────────────────────────────────────────────────────────────
  const [trades, setTrades]           = useState<Trade[]>(initialTrades);
  const [addTradeOpen, setAddTradeOpen] = useState(false);
  const [tradeForm, setTradeForm]     = useState({ ...EMPTY_TRADE_FORM });
  const [tradeSaving, setTradeSaving] = useState(false);
  const [tradeError, setTradeError]   = useState<string | null>(null);

  // ── Financials state ─────────────────────────────────────────────────────────
  const [financials, setFinancials]         = useState<Financials | null>(initialFinancials);
  const [editingFinancials, setEditingFinancials] = useState(false);
  const [financialsForm, setFinancialsForm] = useState({
    cash_on_hand:   String(initialFinancials?.cash_on_hand   ?? 0),
    total_invested: String(initialFinancials?.total_invested ?? 0),
  });
  const [financialsSaving, setFinancialsSaving] = useState(false);
  const [financialsError, setFinancialsError]   = useState<string | null>(null);

  // ── Member handlers ──────────────────────────────────────────────────────────

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

  // ── Event handlers ───────────────────────────────────────────────────────────

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

  // ── Holdings handlers ────────────────────────────────────────────────────────

  function startEditHolding(h: Holding) {
    setEditingHolding(h.id);
    setHoldingEditForm({ shares: String(h.shares), avg_cost_basis: String(h.avg_cost_basis) });
  }

  async function saveHolding(id: string) {
    setHoldingSaving(true);
    setHoldingError(null);

    const original = holdings.find((h) => h.id === id)!;
    const body: Record<string, unknown> = {};
    const newShares = parseFloat(holdingEditForm.shares);
    const newCost   = parseFloat(holdingEditForm.avg_cost_basis);
    if (!isNaN(newShares) && newShares !== original.shares) body.shares = newShares;
    if (!isNaN(newCost)   && newCost   !== original.avg_cost_basis) body.avg_cost_basis = newCost;

    if (Object.keys(body).length === 0) {
      setEditingHolding(null);
      setHoldingSaving(false);
      return;
    }

    const res = await fetch(`/api/admin/holdings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json();
      setHoldingError(json.error ?? "Update failed");
      setHoldingSaving(false);
      return;
    }

    const { holding } = await res.json();
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...holding } : h)));
    setEditingHolding(null);
    setHoldingSaving(false);
    router.refresh();
  }

  async function handleAddHolding(e: React.FormEvent) {
    e.preventDefault();
    setHoldingSaving(true);
    setHoldingError(null);

    const res = await fetch("/api/admin/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holdingForm),
    });

    if (!res.ok) {
      const json = await res.json();
      setHoldingError(json.error ?? "Failed to add holding");
      setHoldingSaving(false);
      return;
    }

    const { holding } = await res.json();
    setHoldings((prev) =>
      [...prev, holding].sort((a, b) => a.ticker.localeCompare(b.ticker))
    );
    setAddHoldingOpen(false);
    setHoldingForm({ ...EMPTY_HOLDING_FORM });
    setHoldingSaving(false);
    router.refresh();
  }

  async function handleDeleteHolding(id: string) {
    if (!confirm("Remove this holding from the portfolio?")) return;
    const res = await fetch(`/api/admin/holdings/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setHoldings((prev) => prev.filter((h) => h.id !== id));
      router.refresh();
    }
  }

  // ── Trades handlers ──────────────────────────────────────────────────────────

  async function handleAddTrade(e: React.FormEvent) {
    e.preventDefault();
    setTradeSaving(true);
    setTradeError(null);

    const res = await fetch("/api/admin/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeForm),
    });

    if (!res.ok) {
      const json = await res.json();
      setTradeError(json.error ?? "Failed to record trade");
      setTradeSaving(false);
      return;
    }

    const { trade } = await res.json();
    setTrades((prev) =>
      [trade, ...prev].sort((a, b) => b.trade_date.localeCompare(a.trade_date))
    );
    setAddTradeOpen(false);
    setTradeForm({ ...EMPTY_TRADE_FORM });
    setTradeSaving(false);
    router.refresh();
  }

  async function handleDeleteTrade(id: string) {
    if (!confirm("Delete this trade record?")) return;
    const res = await fetch(`/api/admin/trades/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    }
  }

  // ── Financials handlers ──────────────────────────────────────────────────────

  function startEditFinancials() {
    setFinancialsForm({
      cash_on_hand:   String(financials?.cash_on_hand   ?? 0),
      total_invested: String(financials?.total_invested ?? 0),
    });
    setFinancialsError(null);
    setEditingFinancials(true);
  }

  async function saveFinancials(e: React.FormEvent) {
    e.preventDefault();
    setFinancialsSaving(true);
    setFinancialsError(null);

    const res = await fetch("/api/admin/financials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cash_on_hand:   parseFloat(financialsForm.cash_on_hand),
        total_invested: parseFloat(financialsForm.total_invested),
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      setFinancialsError(json.error ?? "Update failed");
      setFinancialsSaving(false);
      return;
    }

    const { financials: updated } = await res.json();
    setFinancials(updated);
    setEditingFinancials(false);
    setFinancialsSaving(false);
    router.refresh();
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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
                      {member.joined_at ? formatDate(member.joined_at) : "—"}
                    </td>

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

      {/* ── Club Financials ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] p-6"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Club Financials</h2>
          {!editingFinancials && (
            <button
              onClick={startEditFinancials}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
              style={{ color: "var(--text-tertiary)" }}
              title="Edit financials"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {editingFinancials ? (
          <form onSubmit={saveFinancials} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Cash on Hand
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={financialsForm.cash_on_hand}
                onChange={(e) => setFinancialsForm((f) => ({ ...f, cash_on_hand: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                Total Invested
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={financialsForm.total_invested}
                onChange={(e) => setFinancialsForm((f) => ({ ...f, total_invested: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />
            </div>
            {financialsError && (
              <p className="sm:col-span-2 text-sm" style={{ color: "var(--accent-red)" }}>{financialsError}</p>
            )}
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditingFinancials(false)}
                className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={financialsSaving}
                className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                style={{ background: "var(--accent-primary)", color: "#fff" }}
              >
                {financialsSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Cash on Hand",   value: usd(financials?.cash_on_hand   ?? 0), color: "var(--accent-green)"   },
              { label: "Total Invested", value: usd(financials?.total_invested ?? 0), color: "var(--text-primary)"   },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>
                  {row.label}
                </p>
                <p className="font-semibold" style={{ color: row.color }}>{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Holdings table ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Holdings</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Click the pencil icon to update shares or cost basis
            </p>
          </div>
          <button
            onClick={() => { setAddHoldingOpen(true); setHoldingError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus size={12} />
            Add Holding
          </button>
        </div>

        {holdings.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            No holdings yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Ticker", "Company", "Shares", "Avg Cost", ""].map((h) => (
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
                {holdings.map((holding) => {
                  const isEditing = editingHolding === holding.id;
                  return (
                    <tr
                      key={holding.id}
                      className="border-b border-[var(--border)] last:border-0"
                      style={isEditing ? { background: "rgba(10,132,255,0.05)" } : undefined}
                    >
                      <td className="px-6 py-4 font-bold" style={{ color: "var(--accent-primary)" }}>
                        {holding.ticker}
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--text-primary)" }}>
                        {holding.company_name}
                      </td>
                      <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0.000001"
                            step="0.000001"
                            value={holdingEditForm.shares}
                            onChange={(e) => setHoldingEditForm((f) => ({ ...f, shares: e.target.value }))}
                            className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm w-28 outline-none tabular-nums"
                            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                          />
                        ) : (
                          holding.shares
                        )}
                      </td>
                      <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={holdingEditForm.avg_cost_basis}
                            onChange={(e) => setHoldingEditForm((f) => ({ ...f, avg_cost_basis: e.target.value }))}
                            className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm w-28 outline-none tabular-nums"
                            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                          />
                        ) : (
                          usd(holding.avg_cost_basis)
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveHolding(holding.id)}
                              disabled={holdingSaving}
                              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ background: "rgba(48,209,88,0.15)", color: "#30d158" }}
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingHolding(null)}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ background: "rgba(255,69,58,0.12)", color: "#ff453a" }}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditHolding(holding)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                              style={{ color: "var(--text-tertiary)" }}
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                              style={{ color: "var(--text-tertiary)" }}
                              title="Remove holding"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {holdingError && (
          <p className="px-6 py-3 text-sm" style={{ color: "var(--accent-red)" }}>
            {holdingError}
          </p>
        )}
      </div>

      {/* ── Trades log ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Trade Log</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Full history — appears on the Portfolio page
            </p>
          </div>
          <button
            onClick={() => { setAddTradeOpen(true); setTradeError(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 transition-all"
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus size={12} />
            Record Trade
          </button>
        </div>

        {trades.length === 0 ? (
          <p className="px-6 py-8 text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            No trades recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Date", "Type", "Ticker", "Company", "Shares", "Price", "Total", ""].map((h) => (
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
                {trades.map((trade) => {
                  const isBuy  = trade.trade_type === "buy";
                  const total  = trade.shares * trade.price_per_share;
                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="px-6 py-4" style={{ color: "var(--text-secondary)" }}>
                        {formatDate(trade.trade_date)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-semibold uppercase rounded px-2 py-0.5"
                          style={{
                            background: isBuy ? "rgba(48,209,88,0.15)" : "rgba(255,69,58,0.15)",
                            color: isBuy ? "#30d158" : "#ff453a",
                          }}
                        >
                          {trade.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold" style={{ color: "var(--accent-primary)" }}>
                        {trade.ticker}
                      </td>
                      <td className="px-6 py-4" style={{ color: "var(--text-primary)" }}>
                        {trade.company_name}
                      </td>
                      <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {trade.shares}
                      </td>
                      <td className="px-6 py-4 tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {usd(trade.price_per_share)}
                      </td>
                      <td className="px-6 py-4 tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                        {usd(total)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                          style={{ color: "var(--text-tertiary)" }}
                          title="Delete trade"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            style={{ background: "var(--accent-primary)", color: "#fff" }}
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
              const color = EVENT_COLORS[ev.event_type] ?? "var(--text-secondary)";
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
                      {formatDate(ev.event_date)} · {ev.location}
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

      {/* ── Event idea bank ────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
      >
        <button
          onClick={() => setIdeasOpen((o) => !o)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors text-left"
        >
          <div>
            <h2 className="font-semibold">Event Idea Bank</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {EVENT_IDEAS.length} suggested events — click to expand and use as inspiration
            </p>
          </div>
          <span style={{ color: "var(--text-tertiary)", fontSize: 18, lineHeight: 1 }}>
            {ideasOpen ? "−" : "+"}
          </span>
        </button>

        {ideasOpen && (
          <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {EVENT_IDEAS.map((idea, i) => {
              const color = EVENT_COLORS[idea.type] ?? "var(--text-secondary)";
              return (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <span
                    className="w-2 h-2 rounded-full mt-[5px] flex-shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{idea.title}</span>
                      <span
                        className="text-xs font-semibold rounded px-1.5 py-0.5 capitalize flex-shrink-0"
                        style={{ background: color + "18", color }}
                      >
                        {idea.type}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                      {idea.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Holding modal ───────────────────────────────────────────────── */}
      {addHoldingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setAddHoldingOpen(false)}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "var(--bg-modal-backdrop)" }} />
          <div
            className="relative rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-2xl"
            style={{ background: "var(--bg-secondary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Add Holding</h3>
              <button
                onClick={() => setAddHoldingOpen(false)}
                className="p-0.5 rounded hover:text-white transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHolding} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Ticker (e.g. AAPL) *"
                  value={holdingForm.ticker}
                  onChange={(e) => setHoldingForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none uppercase"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                />
                <input
                  type="text"
                  required
                  placeholder="Company name *"
                  value={holdingForm.company_name}
                  onChange={(e) => setHoldingForm((f) => ({ ...f, company_name: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Shares *</label>
                  <input
                    type="number"
                    required
                    min="0.000001"
                    step="0.000001"
                    placeholder="0.000000"
                    value={holdingForm.shares}
                    onChange={(e) => setHoldingForm((f) => ({ ...f, shares: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Avg Cost Basis *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={holdingForm.avg_cost_basis}
                    onChange={(e) => setHoldingForm((f) => ({ ...f, avg_cost_basis: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {holdingError && (
                <p className="text-sm" style={{ color: "var(--accent-red)" }}>{holdingError}</p>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setAddHoldingOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holdingSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ background: "var(--accent-primary)", color: "#fff" }}
                >
                  {holdingSaving ? "Saving…" : "Add Holding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Record Trade modal ──────────────────────────────────────────────── */}
      {addTradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setAddTradeOpen(false)}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "var(--bg-modal-backdrop)" }} />
          <div
            className="relative rounded-2xl border border-[var(--border)] p-6 w-full max-w-md shadow-2xl"
            style={{ background: "var(--bg-secondary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Record Trade</h3>
              <button
                onClick={() => setAddTradeOpen(false)}
                className="p-0.5 rounded hover:text-white transition-colors"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTrade} className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Ticker *"
                  value={tradeForm.ticker}
                  onChange={(e) => setTradeForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none uppercase"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                />
                <input
                  type="text"
                  required
                  placeholder="Company name *"
                  value={tradeForm.company_name}
                  onChange={(e) => setTradeForm((f) => ({ ...f, company_name: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={tradeForm.trade_type}
                  onChange={(e) => setTradeForm((f) => ({ ...f, trade_type: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <input
                  type="date"
                  required
                  value={tradeForm.trade_date}
                  onChange={(e) => setTradeForm((f) => ({ ...f, trade_date: e.target.value }))}
                  className="rounded-lg border border-[var(--border)] p-3 text-sm outline-none"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", colorScheme: "dark" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Shares *</label>
                  <input
                    type="number"
                    required
                    min="0.000001"
                    step="0.000001"
                    placeholder="0.000000"
                    value={tradeForm.shares}
                    onChange={(e) => setTradeForm((f) => ({ ...f, shares: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Price per Share *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={tradeForm.price_per_share}
                    onChange={(e) => setTradeForm((f) => ({ ...f, price_per_share: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none tabular-nums"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={tradeForm.notes}
                onChange={(e) => setTradeForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm resize-none outline-none"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              />

              {tradeError && (
                <p className="text-sm" style={{ color: "var(--accent-red)" }}>{tradeError}</p>
              )}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setAddTradeOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tradeSaving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
                  style={{ background: "var(--accent-primary)", color: "#fff" }}
                >
                  {tradeSaving ? "Saving…" : "Record Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Event modal ─────────────────────────────────────────────────── */}
      {addEventOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setAddEventOpen(false)}
        >
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "var(--bg-modal-backdrop)" }} />
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
                  style={{ background: "var(--accent-primary)", color: "#fff" }}
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
