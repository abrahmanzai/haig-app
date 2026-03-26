import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  symbol: string;
  description: string; // company name from Finnhub
  type: string;
}

// GET /api/stocks/search?q=QUERY
export async function GET(request: NextRequest) {
  // Auth — authorized or admin only
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["authorized", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Finnhub API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${apiKey}`,
      { cache: "no-store" }
    );
    const json = await res.json();

    // Finnhub returns { count, result: [{symbol, description, displaySymbol, type}] }
    // Filter to US equities only and take top 8
    const results: SearchResult[] = (json.result ?? [])
      .filter((r: SearchResult) => r.type === "Common Stock" || r.type === "ETP")
      .slice(0, 8)
      .map((r: { symbol: string; description: string; type: string }) => ({
        symbol:      r.symbol,
        description: r.description,
        type:        r.type,
      }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[stocks/search] error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
