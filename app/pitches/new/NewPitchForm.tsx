"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SearchResult } from "@/app/api/stocks/search/route";

const VOTE_THRESHOLDS = [
  { value: "simple",                       label: "Simple majority (>50%)" },
  { value: "supermajority_two_thirds",     label: "Supermajority (>66.7%)" },
  { value: "supermajority_three_quarters", label: "Supermajority (>75%)" },
];

const PITCH_TYPES = [
  { value: "buy",  label: "BUY",  color: "#30d158" },
  { value: "sell", label: "SELL", color: "#ff453a" },
  { value: "hold", label: "HOLD", color: "#ff9f0a" },
] as const;

interface Props {
  userId: string;
  prefill?: {
    ticker?: string;
    company_name?: string;
    current_price?: string;
  };
}

export default function NewPitchForm({ userId, prefill }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    company_name:   prefill?.company_name  ?? "",
    ticker:         prefill?.ticker        ?? "",
    pitch_type:     "buy",
    thesis:         "",
    financials:     "",
    risks:          "",
    price_target:   "",
    current_price:  prefill?.current_price ?? "",
    vote_threshold: "simple",
  });
  const [submitting, setSub]        = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fetchingPrice, setFP]      = useState(false);
  const [priceError, setPriceErr]   = useState<string | null>(null);

  // ── Autocomplete state ────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [sugLoading,  setSugLoading]  = useState(false);
  const [showSug,     setShowSug]     = useState(false);
  const [activeSug,   setActiveSug]   = useState(-1);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const tickerRef    = useRef<HTMLInputElement>(null);
  const companyRef   = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 1) { setSuggestions([]); setShowSug(false); return; }
    setSugLoading(true);
    try {
      const res  = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (res.ok) {
        setSuggestions(json.results ?? []);
        setShowSug((json.results ?? []).length > 0);
      }
    } catch { /* silently ignore */ }
    finally { setSugLoading(false); }
  }, []);

  function handleFieldChange(field: "ticker" | "company_name", value: string) {
    const normalized = field === "ticker" ? value.toUpperCase() : value;
    setForm((f) => ({ ...f, [field]: normalized }));
    setActiveSug(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  }

  async function handleSuggestionSelect(result: SearchResult) {
    setForm((f) => ({ ...f, ticker: result.symbol, company_name: result.description }));
    setSuggestions([]);
    setShowSug(false);
    setActiveSug(-1);
    // Auto-fetch live price
    setFP(true);
    setPriceErr(null);
    try {
      const res  = await fetch(`/api/portfolio/prices?tickers=${result.symbol}`);
      const json = await res.json();
      const price = json.prices?.[result.symbol];
      if (price && price > 0) {
        setForm((f) => ({ ...f, current_price: String(price) }));
      }
    } catch { /* price fetch failure is non-fatal */ }
    finally { setFP(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSug((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSug((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeSug >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSug]);
    } else if (e.key === "Escape") {
      setShowSug(false);
      setActiveSug(-1);
    }
  }

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        tickerRef.current   && !tickerRef.current.contains(target)   &&
        companyRef.current  && !companyRef.current.contains(target)
      ) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Existing manual price fetch ───────────────────────────────────────────

  async function autofillPrice() {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker) { setPriceErr("Enter a ticker first"); return; }
    setFP(true);
    setPriceErr(null);
    try {
      const res  = await fetch(`/api/portfolio/prices?tickers=${ticker}`);
      const json = await res.json();
      const price = json.prices?.[ticker];
      if (price && price > 0) {
        setForm((f) => ({ ...f, current_price: String(price) }));
      } else {
        setPriceErr("No price found for " + ticker);
      }
    } catch {
      setPriceErr("Failed to fetch price");
    }
    setFP(false);
  }

  function set<K extends keyof typeof form>(key: K) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSub(true);
    setError(null);

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("pitches")
      .insert({
        submitted_by:   userId,
        company_name:   form.company_name.trim(),
        ticker:         form.ticker.trim().toUpperCase(),
        pitch_type:     form.pitch_type,
        thesis:         form.thesis.trim(),
        financials:     form.financials.trim() || null,
        risks:          form.risks.trim() || null,
        price_target:   form.price_target  ? parseFloat(form.price_target)  : null,
        current_price:  form.current_price ? parseFloat(form.current_price) : null,
        vote_threshold: form.vote_threshold,
        status:         "pending",
      })
      .select("id")
      .single();

    if (err) { setError(err.message); setSub(false); return; }
    router.push(`/pitches/${data.id}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] p-6 space-y-5"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* ── Company + Ticker (with shared autocomplete dropdown) ── */}
      <div className="relative">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company Name *">
            <input
              ref={companyRef}
              placeholder="e.g. Apple Inc."
              value={form.company_name}
              onChange={(e) => handleFieldChange("company_name", e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
              required
              autoComplete="off"
              className="w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none transition-colors"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
              onBlurCapture={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label="Ticker *">
            <input
              ref={tickerRef}
              placeholder="e.g. AAPL"
              value={form.ticker}
              onChange={(e) => handleFieldChange("ticker", e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
              required
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none transition-colors"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
              onBlurCapture={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>

        {/* Dropdown */}
        {(showSug || sugLoading) && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[var(--border)] overflow-hidden z-50"
            style={{ background: "var(--bg-secondary)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          >
            {sugLoading && (
              <div className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Searching…
              </div>
            )}
            {!sugLoading && suggestions.map((result, i) => (
              <button
                key={result.symbol}
                type="button"
                onMouseDown={() => handleSuggestionSelect(result)}
                onMouseEnter={() => setActiveSug(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: i === activeSug ? "var(--bg-tertiary)" : "transparent" }}
              >
                <span
                  className="text-sm font-bold w-16 flex-shrink-0 tabular-nums"
                  style={{ color: "var(--accent-primary)" }}
                >
                  {result.symbol}
                </span>
                <span
                  className="text-sm truncate"
                  style={{ color: i === activeSug ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {result.description}
                </span>
                <span
                  className="ml-auto text-xs flex-shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                >
                  {result.type === "ETP" ? "ETF" : "Stock"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pitch type */}
      <Field label="Pitch Type *">
        <div className="flex gap-3">
          {PITCH_TYPES.map(({ value, label, color }) => {
            const active = form.pitch_type === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => set("pitch_type")(value)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase border transition-all"
                style={
                  active
                    ? { background: color + "20", color, borderColor: color + "60" }
                    : { background: "transparent", color: "var(--text-tertiary)", borderColor: "var(--border)" }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Thesis */}
      <Field label="Investment Thesis *">
        <Textarea
          placeholder="Why do you recommend this trade? Include your core argument, catalysts, and time horizon."
          value={form.thesis}
          onChange={(e) => set("thesis")(e.target.value)}
          rows={5}
          required
        />
      </Field>

      {/* Financials + Risks */}
      <Field label="Key Financials (optional)">
        <Textarea
          placeholder="Revenue, P/E, EPS growth, debt levels, margins, etc."
          value={form.financials}
          onChange={(e) => set("financials")(e.target.value)}
          rows={3}
        />
      </Field>
      <Field label="Key Risks (optional)">
        <Textarea
          placeholder="What could go wrong? Competition, macro headwinds, execution risk, valuation, etc."
          value={form.risks}
          onChange={(e) => set("risks")(e.target.value)}
          rows={3}
        />
      </Field>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Price ($)">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={fetchingPrice ? "Fetching…" : "0.00"}
              value={form.current_price}
              onChange={(e) => set("current_price")(e.target.value)}
              step="0.01"
              min="0"
            />
            <button
              type="button"
              onClick={autofillPrice}
              disabled={fetchingPrice}
              title="Auto-fill from Finnhub"
              className="flex-shrink-0 px-3 rounded-xl border border-[var(--border)] text-xs font-semibold disabled:opacity-50 hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{ color: "var(--accent-primary)" }}
            >
              {fetchingPrice ? "…" : "Live"}
            </button>
          </div>
          {priceError && (
            <p className="text-xs mt-1" style={{ color: "#ff453a" }}>{priceError}</p>
          )}
        </Field>
        <Field label="Price Target ($)">
          <Input
            type="number"
            placeholder="0.00"
            value={form.price_target}
            onChange={(e) => set("price_target")(e.target.value)}
            step="0.01"
            min="0"
          />
        </Field>
      </div>

      {error && (
        <p
          className="text-sm rounded-xl p-3"
          style={{ background: "rgba(255,69,58,0.10)", color: "#ff453a" }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
          style={{ background: "var(--accent-primary)" }}
        >
          {submitting ? "Submitting…" : "Submit Pitch"}
        </button>
      </div>
    </form>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      onFocus={(e) => { props.onFocus?.(e); (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)"; }}
      onBlur={(e)  => { props.onBlur?.(e);  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-[var(--border)] p-3 text-sm resize-none outline-none transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      onFocus={(e) => { props.onFocus?.(e); (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)"; }}
      onBlur={(e)  => { props.onBlur?.(e);  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    />
  );
}
