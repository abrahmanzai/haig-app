import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── In-process 5-minute cache ────────────────────────────────────────────────

interface CacheEntry {
  data: StockData;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Types ────────────────────────────────────────────────────────────────────

export interface StockData {
  ticker: string;
  quote: {
    price: number | null;
    change: number | null;
    changePct: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    prevClose: number | null;
  };
  profile: {
    name: string | null;
    marketCap: number | null;
    sector: string | null;
    industry: string | null;
    logo: string | null;
    website: string | null;
    exchange: string | null;
    currency: string | null;
  };
  financials: {
    week52High: number | null;
    week52Low: number | null;
    pe: number | null;
    eps: number | null;
    dividendYield: number | null;
  };
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  // Auth — authorized or admin only
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["authorized", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ticker = params.ticker.toUpperCase();
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Finnhub API key not configured" }, { status: 500 });
  }

  // Check cache
  const cached = cache.get(ticker);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  try {
    const base = "https://finnhub.io/api/v1";
    const [quoteRes, profileRes, metricsRes] = await Promise.all([
      fetch(`${base}/quote?symbol=${ticker}&token=${apiKey}`, { cache: "no-store" }),
      fetch(`${base}/stock/profile2?symbol=${ticker}&token=${apiKey}`, { cache: "no-store" }),
      fetch(`${base}/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`, { cache: "no-store" }),
    ]);

    const [quoteJson, profileJson, metricsJson] = await Promise.all([
      quoteRes.json(),
      profileRes.json(),
      metricsRes.json(),
    ]);

    const m = metricsJson?.metric ?? {};

    const data: StockData = {
      ticker,
      quote: {
        price:     quoteJson.c   ?? null,
        change:    quoteJson.d   ?? null,
        changePct: quoteJson.dp  ?? null,
        open:      quoteJson.o   ?? null,
        high:      quoteJson.h   ?? null,
        low:       quoteJson.l   ?? null,
        prevClose: quoteJson.pc  ?? null,
      },
      profile: {
        name:      profileJson.name       ?? null,
        marketCap: profileJson.marketCapitalization ?? null,
        sector:    profileJson.finnhubIndustry      ?? null,
        industry:  profileJson.ggroup     ?? null,
        logo:      profileJson.logo       ?? null,
        website:   profileJson.weburl     ?? null,
        exchange:  profileJson.exchange   ?? null,
        currency:  profileJson.currency   ?? null,
      },
      financials: {
        week52High:    m["52WeekHigh"]    ?? null,
        week52Low:     m["52WeekLow"]     ?? null,
        pe:            m["peBasicExclExtraTTM"] ?? null,
        eps:           m["epsBasicExclExtraAnnual"] ?? null,
        dividendYield: m["dividendYieldIndicatedAnnual"] ?? null,
      },
    };

    // Store in cache
    cache.set(ticker, { data, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(data);
  } catch (err) {
    console.error("[stocks API] error:", err);
    return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
  }
}
