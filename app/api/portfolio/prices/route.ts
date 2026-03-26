export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// GET /api/portfolio/prices?tickers=AAPL,VOO,SCHD
// Returns { prices: { AAPL: 213.50, VOO: 512.00, ... } }
// Calls Finnhub server-side — API key never reaches the client.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("tickers") ?? "";
  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FINNHUB_API_KEY not configured" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    tickers.map((ticker) =>
      fetch(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
        { next: { revalidate: 60 } } // cache each price for 60 s
      )
        .then((r) => r.json())
        .then((data) => ({ ticker, price: data.c as number }))
    )
  );

  const prices: Record<string, number | null> = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      prices[result.value.ticker] = result.value.price ?? null;
    }
  }

  return NextResponse.json({ prices });
}
