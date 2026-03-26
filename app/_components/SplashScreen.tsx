"use client";

import { useEffect, useRef } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => wrapRef.current?.classList.add("spl-exit"), 3000);
    const t2 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div ref={wrapRef} className="spl-wrap">
      <svg
        viewBox="0 0 680 340"
        aria-label="High Agency Investment Group"
        className="spl-svg"
        role="img"
      >
        <defs>
          <linearGradient id="spl-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#0A84FF" />
            <stop offset="100%" stopColor="#30D158" />
          </linearGradient>
        </defs>

        {/* All three mark shapes use the original coordinate system */}
        <g transform="translate(340,100)">
          {/* ── 1. Pillar: scales up from its bottom edge (delay 0s, 0.4s) ── */}
          <rect
            className="spl-pillar"
            x="-16" y="0" width="32" height="80" rx="4"
            fill="url(#spl-g)"
          />

          {/* ── 2. Chevron: expands from center outward (delay 0.4s, 0.3s) ── */}
          <polygon
            className="spl-chev"
            points="-40,10 0,-40 40,10"
            fill="url(#spl-g)"
          />

          {/* ── 3. H crossbar: fades in (delay 0.7s, 0.2s) ── */}
          <rect
            className="spl-cross"
            x="-28" y="36" width="56" height="8" rx="3"
            fill="url(#spl-g)" opacity="0.9"
          />
        </g>

        {/* ── 4. HIGH AGENCY (delay 0.9s, 0.3s) ── */}
        <text
          className="spl-t1"
          x="340" y="220"
          textAnchor="middle"
          fontFamily="'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="32" fontWeight="700"
          fill="white"
          style={{ letterSpacing: "3px" }}
        >HIGH AGENCY</text>

        {/* ── 5. INVESTMENT GROUP (delay 1.2s, 0.3s) ── */}
        <text
          className="spl-t2"
          x="340" y="256"
          textAnchor="middle"
          fontFamily="'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="16" fontWeight="500"
          fill="#8E8E93"
          style={{ letterSpacing: "8px" }}
        >INVESTMENT GROUP</text>

        {/* ── 6. LEARN · INVEST · BUILD (delay 1.5s, 0.3s) ── */}
        <text
          className="spl-t3"
          x="340" y="300"
          textAnchor="middle"
          fontFamily="'JetBrains Mono', 'SF Mono', 'Courier New', monospace"
          fontSize="11"
          fill="#636366"
          style={{ letterSpacing: "4px" }}
        >LEARN · INVEST · BUILD</text>
      </svg>
    </div>
  );
}
