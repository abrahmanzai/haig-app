"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import type { StockData } from "@/app/api/stocks/[ticker]/route";
import type { SearchResult } from "@/app/api/stocks/search/route";

// ── Helpers ──────────────────────────────────────────────────────────────────

function usd(n: number | null, decimals = 2) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pct(n: number | null) {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

function bigNum(n: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "B";
  if (n >= 1_000)     return "$" + (n / 1_000).toFixed(2) + "M";
  return "$" + n.toFixed(2) + "M";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResearchClient() {
  const router = useRouter();

  const [query,       setQuery]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [stock,       setStock]       = useState<StockData | null>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [sugLoading,  setSugLoading]  = useState(false);
  const [showSug,     setShowSug]     = useState(false);
  const [activeSug,   setActiveSug]   = useState(-1);

  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autocomplete: debounced fetch ─────────────────────────────────────────

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) { setSuggestions([]); setShowSug(false); return; }
    setSugLoading(true);
    try {
      const res  = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (res.ok) {
        setSuggestions(json.results ?? []);
        setShowSug((json.results ?? []).length > 0);
      }
    } catch {
      // silently ignore suggestion errors
    } finally {
      setSugLoading(false);
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    setActiveSug(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current    && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSug(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Stock data fetch ──────────────────────────────────────────────────────

  async function search(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setError(null);
    setStock(null);
    setShowSug(false);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/stocks/${encodeURIComponent(t)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: StockData = await res.json();
      if (data.quote.price == null && data.profile.name == null) {
        setError(`No data found for "${t}". Check the ticker symbol.`);
      } else {
        setStock(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch stock data.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    search(query);
  }

  function handleSuggestionClick(result: SearchResult) {
    setQuery(result.symbol);
    setSuggestions([]);
    setShowSug(false);
    search(result.symbol);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSug((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSug((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeSug >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSug]);
    } else if (e.key === "Escape") {
      setShowSug(false);
      setActiveSug(-1);
    }
  }

  // ── Pitch This Stock ─────────────────────────────────────────────────────

  function goToPitchForm() {
    if (!stock) return;
    const params = new URLSearchParams();
    params.set("ticker",  stock.ticker);
    if (stock.profile.name) params.set("company", stock.profile.name);
    if (stock.quote.price != null) params.set("price", String(stock.quote.price));
    router.push(`/pitches/new?${params.toString()}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const change    = stock?.quote.change ?? 0;
  const isUp      = change > 0;
  const isDown    = change < 0;
  const priceColor = isUp ? "var(--accent-green)" : isDown ? "var(--accent-red)" : "var(--text-secondary)";
  const ChangeIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Stock Research</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Look up any stock — live quote, company profile, and key metrics.
        </p>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
            placeholder="Enter ticker or company name (e.g. AAPL)"
            className="w-full rounded-xl border border-[var(--border)] pl-9 pr-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-primary)]"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={showSug}
          />

          {/* ── Autocomplete dropdown ─────────────────────────────────── */}
          {showSug && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-[var(--border)] overflow-hidden z-50"
              style={{ background: "var(--bg-secondary)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
              role="listbox"
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
                  role="option"
                  aria-selected={i === activeSug}
                  onMouseDown={() => handleSuggestionClick(result)}
                  onMouseEnter={() => setActiveSug(i)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: i === activeSug ? "var(--bg-tertiary)" : "transparent",
                  }}
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

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "var(--accent-primary)" }}
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </form>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div
          className="rounded-xl border px-5 py-4 text-sm"
          style={{
            borderColor: "rgba(255,69,58,0.3)",
            background: "rgba(255,69,58,0.08)",
            color: "var(--accent-red)",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border)] p-6 animate-pulse space-y-3"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="h-4 w-1/3 rounded" style={{ background: "var(--bg-tertiary)" }} />
              <div className="h-8 w-1/2 rounded" style={{ background: "var(--bg-tertiary)" }} />
              <div className="h-3 w-2/3 rounded" style={{ background: "var(--bg-tertiary)" }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {stock && !loading && (
        <div className="space-y-5">

          {/* Company header card */}
          <div
            className="rounded-2xl border border-[var(--border)] p-6"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {stock.profile.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stock.profile.logo}
                    alt={stock.profile.name ?? stock.ticker}
                    className="w-14 h-14 rounded-xl object-contain"
                    style={{ background: "var(--bg-tertiary)", padding: 6 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-black" style={{ color: "var(--accent-primary)" }}>
                      {stock.ticker}
                    </span>
                    {stock.profile.exchange && (
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                      >
                        {stock.profile.exchange}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold">{stock.profile.name ?? "—"}</p>
                  {(stock.profile.sector || stock.profile.industry) && (
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {[stock.profile.sector, stock.profile.industry].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Pitch This Stock button */}
                <button
                  onClick={goToPitchForm}
                  className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2.5 font-semibold transition-all hover:brightness-110"
                  style={{ background: "rgba(48,209,88,0.15)", color: "var(--accent-green)" }}
                >
                  <FileText size={14} />
                  Pitch This Stock
                </button>

                {stock.profile.website && (
                  <a
                    href={stock.profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2.5 border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <ExternalLink size={14} />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Price cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Current price */}
            <div
              className="rounded-2xl border border-[var(--border)] p-5"
              style={{ background: "var(--bg-secondary)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                Current Price
              </p>
              <p className="text-3xl font-black tabular-nums" style={{ color: priceColor }}>
                {usd(stock.quote.price)}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <ChangeIcon size={14} style={{ color: priceColor }} />
                <span className="text-sm font-semibold tabular-nums" style={{ color: priceColor }}>
                  {change >= 0 ? "+" : ""}{usd(stock.quote.change)} ({pct(stock.quote.changePct)})
                </span>
              </div>
            </div>

            {[
              { label: "Open",     value: usd(stock.quote.open) },
              { label: "Day High", value: usd(stock.quote.high) },
              { label: "Day Low",  value: usd(stock.quote.low)  },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border)] p-5"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
                  {stat.label}
                </p>
                <p className="text-xl font-bold tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Two-column: Profile + Financials */}
          <div className="grid sm:grid-cols-2 gap-5">

            {/* Company profile */}
            <div
              className="rounded-2xl border border-[var(--border)] p-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <h2 className="font-semibold mb-5">Company Profile</h2>
              <dl className="space-y-3">
                {[
                  { label: "Market Cap", value: bigNum(stock.profile.marketCap) },
                  { label: "Sector",     value: stock.profile.sector   ?? "—" },
                  { label: "Industry",   value: stock.profile.industry ?? "—" },
                  { label: "Exchange",   value: stock.profile.exchange ?? "—" },
                  { label: "Currency",   value: stock.profile.currency ?? "—" },
                  { label: "Prev Close", value: usd(stock.quote.prevClose) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center gap-4">
                    <dt className="text-sm" style={{ color: "var(--text-tertiary)" }}>{label}</dt>
                    <dd className="text-sm font-semibold text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Key metrics */}
            <div
              className="rounded-2xl border border-[var(--border)] p-6"
              style={{ background: "var(--bg-secondary)" }}
            >
              <h2 className="font-semibold mb-5">Key Metrics</h2>
              <dl className="space-y-3">
                {[
                  { label: "52-Week High",    value: usd(stock.financials.week52High) },
                  { label: "52-Week Low",     value: usd(stock.financials.week52Low) },
                  { label: "P/E Ratio (TTM)", value: stock.financials.pe  != null ? stock.financials.pe.toFixed(2)  : "—" },
                  { label: "EPS (Annual)",    value: stock.financials.eps != null ? usd(stock.financials.eps) : "—" },
                  { label: "Dividend Yield",  value: stock.financials.dividendYield != null ? pct(stock.financials.dividendYield) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center gap-4">
                    <dt className="text-sm" style={{ color: "var(--text-tertiary)" }}>{label}</dt>
                    <dd className="text-sm font-semibold text-right">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* 52-week range bar */}
              {stock.financials.week52High != null && stock.financials.week52Low != null && stock.quote.price != null && (
                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                    <span>{usd(stock.financials.week52Low)}</span>
                    <span>52-Week Range</span>
                    <span>{usd(stock.financials.week52High)}</span>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                    {(() => {
                      const lo  = stock.financials.week52Low!;
                      const hi  = stock.financials.week52High!;
                      const cur = stock.quote.price!;
                      const pos = Math.max(0, Math.min(100, ((cur - lo) / (hi - lo)) * 100));
                      return (
                        <>
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ width: `${pos}%`, background: "var(--accent-primary)" }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                            style={{ left: `calc(${pos}% - 6px)`, background: "var(--accent-primary)" }}
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!stock && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "var(--bg-secondary)" }}
          >
            <Search size={28} style={{ color: "var(--text-tertiary)" }} />
          </div>
          <p className="text-lg font-semibold mb-1">Search for a stock</p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Type a ticker or company name — suggestions appear as you type.
          </p>
        </div>
      )}
    </div>
  );
}
