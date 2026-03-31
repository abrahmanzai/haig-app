"use client";

import { useState, useEffect } from "react";

const WORDS = ["Learn.", "Invest.", "Build."];

export default function HeroWords() {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % WORDS.length);
        setLeaving(false);
      }, 280);
    }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <span
      style={{
        display: "inline-block",
        transition: "opacity 0.28s ease, transform 0.28s ease",
        opacity: leaving ? 0 : 1,
        transform: leaving ? "translateY(-14px)" : "translateY(0)",
      }}
    >
      {WORDS[idx]}
    </span>
  );
}
