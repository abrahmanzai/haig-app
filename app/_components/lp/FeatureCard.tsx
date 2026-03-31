"use client";

import type { ElementType } from "react";

interface Props {
  icon: ElementType;
  title: string;
  body: string;
  color: string;
  glow: string;
}

export default function FeatureCard({ icon: Icon, title, body, color, glow }: Props) {
  return (
    <article
      className="group relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color + "55";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: color }}
      />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
        style={{ background: color + "18" }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <h3 className="font-semibold text-lg mb-3" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{body}</p>
    </article>
  );
}
