"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";
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

const STEPS = [
  { num: 1, label: "Stock" },
  { num: 2, label: "Thesis" },
  { num: 3, label: "Pricing" },
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
  const [step, setStep] = useState(1);

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

  // ── Step validation ────────────────────────────────────────────────────────

  function canAdvance(): boolean {
    if (step === 1) return !!form.ticker.trim() && !!form.company_name.trim();
    if (step === 2) return form.thesis.trim().length >= 10;
    return true;
  }

  function handleNext() {
    if (canAdvance()) setStep((s) => Math.min(s + 1, 3) as 1 | 2 | 3);
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

  const pitchTypeConfig = PITCH_TYPES.find((t) => t.value === form.pitch_type);
  const thresholdLabel  = VOTE_THRESHOLDS.find((t) => t.value === form.vote_threshold)?.label;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl border border-[var(--border)]"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* ── Step indicator ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 px-6 pt-6 pb-5 border-b border-[var(--border)]"
      >
        {STEPS.map((s, idx) => {
          const done   = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} className="flex items-center flex-1">
              {/* Step pill */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 text-xs font-bold"
                  style={
                    done
                      ? { background: "var(--accent-green)", color: "#fff" }
                      : active
                      ? { background: "var(--accent-primary)", color: "#fff" }
                      : { background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                  }
                >
                  {done ? <Check size={14} strokeWidth={2.5} /> : s.num}
                </div>
                <span
                  className="text-xs font-semibold hidden sm:block"
                  style={{ color: active ? "var(--text-primary)" : "var(--text-tertiary)" }}
                >
                  {s.label}
                </span>
              </div>
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-3 transition-colors duration-300"
                  style={{ background: done ? "var(--accent-green)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-6">

        {/* ── Step 1: Stock Selection ───────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                Stock Selection
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Search for the company or enter a ticker manually.
              </p>
            </div>

            {/* Company + Ticker with shared autocomplete dropdown */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name *" htmlFor="pitch-company">
                  <input
                    id="pitch-company"
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
                <Field label="Ticker *" htmlFor="pitch-ticker">
                  <input
                    id="pitch-ticker"
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
                  style={{ background: "var(--bg-secondary)", boxShadow: "var(--shadow-card)" }}
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
            <Field label="Pitch Type *" htmlFor="">
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
          </div>
        )}

        {/* ── Step 2: Investment Thesis ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                Investment Thesis
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Make the case. Be specific — what's the catalyst and time horizon?
              </p>
            </div>

            <Field label={`Investment Thesis * (${form.thesis.length} chars)`} htmlFor="pitch-thesis">
              <Textarea
                id="pitch-thesis"
                placeholder="Why do you recommend this trade? Include your core argument, catalysts, and time horizon."
                value={form.thesis}
                onChange={(e) => set("thesis")(e.target.value)}
                rows={5}
                required
              />
              {form.thesis.length > 0 && form.thesis.length < 10 && (
                <p className="text-xs mt-1" style={{ color: "var(--accent-orange)" }}>
                  Minimum 10 characters required
                </p>
              )}
            </Field>

            <Field label={`Key Financials (optional) — ${form.financials.length} chars`} htmlFor="pitch-financials">
              <Textarea
                id="pitch-financials"
                placeholder="Revenue, P/E, EPS growth, debt levels, margins, etc."
                value={form.financials}
                onChange={(e) => set("financials")(e.target.value)}
                rows={3}
              />
            </Field>

            <Field label={`Key Risks (optional) — ${form.risks.length} chars`} htmlFor="pitch-risks">
              <Textarea
                id="pitch-risks"
                placeholder="What could go wrong? Competition, macro headwinds, execution risk, valuation, etc."
                value={form.risks}
                onChange={(e) => set("risks")(e.target.value)}
                rows={3}
              />
            </Field>
          </div>
        )}

        {/* ── Step 3: Price Target & Voting ────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                Price Target &amp; Voting
              </h2>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Set your target and choose the passing threshold.
              </p>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current Price ($)" htmlFor="pitch-cur-price">
                <div className="flex gap-2">
                  <Input
                    id="pitch-cur-price"
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
                  <p className="text-xs mt-1" style={{ color: "var(--accent-red)" }}>{priceError}</p>
                )}
              </Field>
              <Field label="Price Target ($)" htmlFor="pitch-target">
                <Input
                  id="pitch-target"
                  type="number"
                  placeholder="0.00"
                  value={form.price_target}
                  onChange={(e) => set("price_target")(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </Field>
            </div>

            {/* Vote threshold */}
            <Field label="Vote Threshold" htmlFor="pitch-threshold">
              <div className="flex flex-col gap-2">
                {VOTE_THRESHOLDS.map(({ value, label }) => {
                  const active = form.vote_threshold === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("vote_threshold")(value)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all"
                      style={
                        active
                          ? { background: "rgba(94,106,210,0.12)", borderColor: "rgba(94,106,210,0.5)", color: "var(--text-primary)" }
                          : { background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }
                      }
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: active ? "var(--accent-primary)" : "var(--border)" }}
                      >
                        {active && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-primary)" }} />}
                      </div>
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Summary preview */}
            <div
              className="rounded-xl p-4 border space-y-2"
              style={{ background: "var(--bg-tertiary)", borderColor: "var(--border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                Pitch Summary
              </p>
              <SummaryRow label="Stock" value={`${form.ticker} — ${form.company_name}`} />
              <SummaryRow
                label="Type"
                value={pitchTypeConfig?.label ?? form.pitch_type.toUpperCase()}
                valueColor={pitchTypeConfig?.color}
              />
              {form.current_price && <SummaryRow label="Current Price" value={`$${form.current_price}`} />}
              {form.price_target  && <SummaryRow label="Price Target"  value={`$${form.price_target}`} />}
              <SummaryRow label="Threshold" value={thresholdLabel ?? form.vote_threshold} />
              <SummaryRow label="Thesis" value={form.thesis.length > 80 ? form.thesis.slice(0, 80) + "…" : form.thesis} />
            </div>

            {error && (
              <p
                className="text-sm rounded-xl p-3"
                style={{ background: "rgba(255,69,58,0.10)", color: "var(--accent-red)" }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        {/* ── Step navigation ──────────────────────────────────────────── */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-[var(--border)]">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3)}
              className="px-5 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:brightness-110 transition-all"
              style={{ background: "var(--accent-primary)" }}
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:brightness-110 transition-all"
              style={{ background: "var(--accent-primary)" }}
            >
              {submitting ? "Submitting…" : "Submit Pitch"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </label>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function Input({ id, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      {...props}
      className="w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      onFocus={(e) => { props.onFocus?.(e); (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)"; }}
      onBlur={(e)  => { props.onBlur?.(e);  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    />
  );
}

function Textarea({ id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      {...props}
      className="w-full rounded-xl border border-[var(--border)] p-3 text-sm resize-none outline-none transition-colors"
      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
      onFocus={(e) => { props.onFocus?.(e); (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)"; }}
      onBlur={(e)  => { props.onBlur?.(e);  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    />
  );
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-right font-medium" style={{ color: valueColor ?? "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
