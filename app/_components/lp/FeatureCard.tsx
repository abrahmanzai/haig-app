"use client";

import { BookOpen, TrendingUp, BarChart2 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Learn Together",
    body: "Structured financial literacy curriculum — workshops, speaker sessions with finance professionals, and biweekly market discussions.",
    color: "#5E6AD2",
    glow: "rgba(94,106,210,0.25)",
  },
  {
    icon: TrendingUp,
    title: "Invest Together",
    body: "Research real companies, present investment pitches, vote with weighted capital units, and execute real trades in the club brokerage.",
    color: "#30d158",
    glow: "rgba(48,209,88,0.25)",
  },
  {
    icon: BarChart2,
    title: "Build Together",
    body: "Track portfolio performance against the S&P 500, manage your capital account, and build a verifiable investing track record.",
    color: "#bf5af2",
    glow: "rgba(191,90,242,0.25)",
  },
];

export default function FeaturesSection() {
  return (
    <div className="grid sm:grid-cols-3 gap-5">
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <article
            key={f.title}
            className="group relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = f.color + "55";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px ${f.glow}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div
              className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: f.color }}
            />
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
              style={{ background: f.color + "18" }}
            >
              <Icon size={22} style={{ color: f.color }} />
            </div>
            <h3 className="font-semibold text-lg mb-3" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.body}</p>
          </article>
        );
      })}
    </div>
  );
}
