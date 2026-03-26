"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRightLeft, DollarSign, X } from "lucide-react";

// ── Shared modal wrapper ─────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] p-6 space-y-5"
        style={{ background: "var(--bg-secondary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-[var(--bg-tertiary)] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Input helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]";
const inputStyle = { background: "var(--bg-tertiary)", color: "var(--text-primary)" };

// ── Add Holding modal ─────────────────────────────────────────────────────────

function AddHoldingModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: "",
    ticker: "",
    shares: "",
    avg_cost_basis: "",
    current_price: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: form.company_name,
        ticker: form.ticker.toUpperCase(),
        shares: Number(form.shares),
        avg_cost_basis: Number(form.avg_cost_basis),
        current_price: form.current_price ? Number(form.current_price) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Add Holding" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name">
            <input
              required className={inputCls} style={inputStyle}
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              placeholder="Apple Inc."
            />
          </Field>
          <Field label="Ticker">
            <input
              required className={inputCls} style={inputStyle}
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              placeholder="AAPL"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Shares">
            <input
              required type="number" step="any" min="0.0001" className={inputCls} style={inputStyle}
              value={form.shares}
              onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
              placeholder="100"
            />
          </Field>
          <Field label="Avg Cost Basis ($)">
            <input
              required type="number" step="any" min="0" className={inputCls} style={inputStyle}
              value={form.avg_cost_basis}
              onChange={(e) => setForm((f) => ({ ...f, avg_cost_basis: e.target.value }))}
              placeholder="150.00"
            />
          </Field>
        </div>
        <Field label="Current Price ($) — optional">
          <input
            type="number" step="any" min="0" className={inputCls} style={inputStyle}
            value={form.current_price}
            onChange={(e) => setForm((f) => ({ ...f, current_price: e.target.value }))}
            placeholder="Leave blank to use cost basis"
          />
        </Field>
        {error && (
          <p className="text-sm rounded-xl p-3" style={{ background: "rgba(255,69,58,0.10)", color: "#ff453a" }}>
            {error}
          </p>
        )}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}
        >
          {loading ? "Saving…" : "Add Holding"}
        </button>
      </form>
    </Modal>
  );
}

// ── Log Trade modal ───────────────────────────────────────────────────────────

function LogTradeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    company_name: "",
    ticker: "",
    trade_type: "buy",
    shares: "",
    price_per_share: "",
    trade_date: today,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: form.company_name,
        ticker: form.ticker.toUpperCase(),
        trade_type: form.trade_type,
        shares: Number(form.shares),
        price_per_share: Number(form.price_per_share),
        trade_date: form.trade_date,
        notes: form.notes || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Log Trade" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name">
            <input
              required className={inputCls} style={inputStyle}
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              placeholder="Apple Inc."
            />
          </Field>
          <Field label="Ticker">
            <input
              required className={inputCls} style={inputStyle}
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              placeholder="AAPL"
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Type">
            <select
              className={inputCls} style={inputStyle}
              value={form.trade_type}
              onChange={(e) => setForm((f) => ({ ...f, trade_type: e.target.value }))}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </Field>
          <Field label="Shares">
            <input
              required type="number" step="any" min="0.0001" className={inputCls} style={inputStyle}
              value={form.shares}
              onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
              placeholder="100"
            />
          </Field>
          <Field label="Price ($)">
            <input
              required type="number" step="any" min="0" className={inputCls} style={inputStyle}
              value={form.price_per_share}
              onChange={(e) => setForm((f) => ({ ...f, price_per_share: e.target.value }))}
              placeholder="150.00"
            />
          </Field>
        </div>
        <Field label="Trade Date">
          <input
            required type="date" className={inputCls} style={inputStyle}
            value={form.trade_date}
            onChange={(e) => setForm((f) => ({ ...f, trade_date: e.target.value }))}
          />
        </Field>
        <Field label="Notes — optional">
          <textarea
            rows={2} className={inputCls} style={inputStyle}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional trade notes…"
          />
        </Field>
        {error && (
          <p className="text-sm rounded-xl p-3" style={{ background: "rgba(255,69,58,0.10)", color: "#ff453a" }}>
            {error}
          </p>
        )}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: form.trade_type === "buy" ? "var(--accent-green)" : "var(--accent-red)" }}
        >
          {loading ? "Saving…" : `Log ${form.trade_type === "buy" ? "Buy" : "Sell"}`}
        </button>
      </form>
    </Modal>
  );
}

// ── Update Cash modal ─────────────────────────────────────────────────────────

function UpdateCashModal({
  initialCash,
  initialInvested,
  onClose,
}: {
  initialCash: number;
  initialInvested: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [cash,     setCash]     = useState(String(initialCash));
  const [invested, setInvested] = useState(String(initialInvested));
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/financials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cash_on_hand: Number(cash),
        total_invested: Number(invested),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Update Financials" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Cash on Hand ($)">
          <input
            required type="number" step="any" min="0" className={inputCls} style={inputStyle}
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </Field>
        <Field label="Total Invested ($)">
          <input
            required type="number" step="any" min="0" className={inputCls} style={inputStyle}
            value={invested}
            onChange={(e) => setInvested(e.target.value)}
          />
        </Field>
        {error && (
          <p className="text-sm rounded-xl p-3" style={{ background: "rgba(255,69,58,0.10)", color: "#ff453a" }}>
            {error}
          </p>
        )}
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-40"
          style={{ background: "var(--accent-gold)", color: "#000" }}
        >
          {loading ? "Saving…" : "Update Financials"}
        </button>
      </form>
    </Modal>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PortfolioAdminControls({
  cashOnHand,
  totalInvested,
}: {
  cashOnHand: number;
  totalInvested: number;
}) {
  const [modal, setModal] = useState<"holding" | "trade" | "cash" | null>(null);

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setModal("holding")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
          style={{ color: "var(--accent-green)" }}
        >
          <Plus size={15} />
          Add Holding
        </button>
        <button
          onClick={() => setModal("trade")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
          style={{ color: "var(--accent-primary)" }}
        >
          <ArrowRightLeft size={15} />
          Log Trade
        </button>
        <button
          onClick={() => setModal("cash")}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
          style={{ color: "var(--accent-gold)" }}
        >
          <DollarSign size={15} />
          Update Cash
        </button>
      </div>

      {modal === "holding" && <AddHoldingModal onClose={() => setModal(null)} />}
      {modal === "trade"   && <LogTradeModal   onClose={() => setModal(null)} />}
      {modal === "cash"    && (
        <UpdateCashModal
          initialCash={cashOnHand}
          initialInvested={totalInvested}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
