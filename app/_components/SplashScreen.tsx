"use client";

import { useEffect, useState } from "react";

type Phase = "p1" | "p2";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("p1");
  const [logoSrc, setLogoSrc] = useState("/logo-mark.svg");

  useEffect(() => {
    const theme = document.documentElement.dataset.theme;
    setLogoSrc(theme === "light" ? "/logo-mark-dark.svg" : "/logo-mark.svg");
  }, []);

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

      {/* ── Logo mark ──────────────────────────────────────────────────────
          Absolutely centered so it stays fixed in the viewport as it grows.
          Phase 1: fades + slides up (keyframe).
          Phase 2: transitions from 22vh → 65vh height, opacity 1 → 0.06.  */}
      <div className="spl-mark-pos">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt=""
          className="spl-mark-svg"
          aria-hidden="true"
          style={{ width: "auto" }}
        />
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
            color: "var(--text-primary)",
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
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >INVESTMENT GROUP</p>

        <p
          className="spl-t3"
          style={{
            fontFamily: "'JetBrains Mono', 'SF Mono', 'Courier New', monospace",
            fontSize: 10,
            letterSpacing: "4px",
            color: "var(--text-tertiary)",
            margin: 0,
          }}
        >LEARN · INVEST · BUILD</p>
      </div>

    </div>
  );
}
