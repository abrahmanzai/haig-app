"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("haig_theme") as "dark" | "light" | null;
    const initial = stored ?? "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("haig_theme", next);
  }

  const isLight = theme === "light";

  // Avoid hydration mismatch — render neutral placeholder until mounted
  if (!mounted) {
    return <div className="w-[52px] h-7 rounded-full" style={{ background: "var(--bg-tertiary)" }} />;
  }

  return (
    <button
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      onClick={toggle}
      className="relative flex items-center w-[52px] h-7 rounded-full p-0.5 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: isLight ? "var(--accent-primary)" : "var(--bg-tertiary)",
        outlineColor: "var(--accent-primary)",
      }}
    >
      {/* Track icons — rotate in/out for smooth transition */}
      <Sun
        size={12}
        className="absolute left-1.5"
        style={{
          color: "#fff",
          opacity: isLight ? 1 : 0.3,
          transform: isLight ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "opacity 300ms, transform 300ms ease-out",
        }}
      />
      <Moon
        size={12}
        className="absolute right-1.5"
        style={{
          color: isLight ? "rgba(255,255,255,0.3)" : "#fff",
          transform: isLight ? "rotate(90deg)" : "rotate(0deg)",
          transition: "opacity 300ms, transform 300ms ease-out",
        }}
      />

      {/* Thumb */}
      <span
        className="block w-6 h-6 rounded-full shadow-sm transition-transform duration-300"
        style={{
          background: "#fff",
          transform: isLight ? "translateX(24px)" : "translateX(0)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
