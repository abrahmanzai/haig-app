"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RefreshPricesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
      setLastUpdated(
        new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      );
    });
  }

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs geist-mono" style={{ color: "var(--text-tertiary)" }}>
          Updated {lastUpdated}
        </span>
      )}
      <button
        onClick={refresh}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40"
        style={{ color: "var(--accent-primary)" }}
        title="Refresh live prices from Finnhub"
      >
        <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
        {isPending ? "Refreshing…" : "Refresh Prices"}
      </button>
    </div>
  );
}
