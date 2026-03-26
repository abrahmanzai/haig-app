"use client";

import { useEffect, useState } from "react";

type Phase = "p1" | "p2";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("p1");

  useEffect(() => {
    // Phase 2 starts at 2.5s — texts fade, mark grows + fades, bg dissolves
    const t1 = setTimeout(() => setPhase("p2"), 2500);
    // All CSS transitions complete by ~4.6s; call onDone with a small buffer
    const t2 = setTimeout(onDone, 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const p2 = phase === "p2";

  return (
    <div className={`spl-wrap${p2 ? " spl-p2" : ""}`}>

      {/* ── Arrow mark ─────────────────────────────────────────────────────
          Absolutely centered so it stays fixed in the viewport as it grows.
          Phase 1: fades + slides up (keyframe).
          Phase 2: transitions from 22vh → 65vh height, opacity 1 → 0.06.  */}
      <div className="spl-mark-pos">
        <svg
          viewBox="-46 -46 92 132"
          className="spl-mark-svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spl-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#30D158" />
            </linearGradient>
          </defs>
          <rect    x="-16" y="0"  width="32" height="80" rx="4" fill="url(#spl-g)" />
          <polygon points="-40,10 0,-40 40,10"                   fill="url(#spl-g)" />
          <rect    x="-28" y="36" width="56" height="8"  rx="3" fill="url(#spl-g)" opacity="0.9" />
        </svg>
      </div>

      {/* ── Texts ──────────────────────────────────────────────────────────
          Positioned just below the mark.
          Phase 1: each line fades + slides in sequentially (keyframes).
          Phase 2: entire block transitions to opacity 0.                   */}
      <div className="spl-texts">
        <p
          className="spl-t1"
          style={{
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "3px",
            color: "#ffffff",
            margin: 0,
          }}
        >HIGH AGENCY</p>

        <p
          className="spl-t2"
          style={{
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "8px",
            color: "#8E8E93",
            margin: 0,
          }}
        >INVESTMENT GROUP</p>

        <p
          className="spl-t3"
          style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Courier New', monospace",
            fontSize: 10,
            letterSpacing: "4px",
            color: "#636366",
            margin: 0,
          }}
        >LEARN · INVEST · BUILD</p>
      </div>

    </div>
  );
}
