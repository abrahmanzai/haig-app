"use client";

import { ChevronRight } from "lucide-react";

interface Props {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
  description: string | null;
  color: string;
}

const EVENT_COLORS: Record<string, string> = {
  founding: "#ffd60a",
  meeting:  "#5E6AD2",
  workshop: "#30d158",
  speaker:  "#bf5af2",
  social:   "#ff9f0a",
  deadline: "#ff453a",
  review:   "#64d2ff",
};

function formatEventDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function EventCard({ title, event_type, event_date, location, description }: Props) {
  const color = EVENT_COLORS[event_type] ?? "#888";
  const d     = new Date(event_date + "T12:00:00");
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day   = d.getDate();

  return (
    <div
      className="group rounded-2xl border p-5 flex items-start gap-5 transition-all hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color + "44";
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${color}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl flex-shrink-0 border"
        style={{ background: color + "12", borderColor: color + "30" }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{month}</span>
        <span className="text-xl font-black leading-none geist-mono" style={{ color: "var(--text-primary)" }}>{day}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{title}</p>
          <span
            className="text-[10px] font-semibold rounded-full px-2 py-0.5 capitalize"
            style={{ background: color + "20", color }}
          >
            {event_type}
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatEventDate(event_date)}
          {location && location !== "TBD" && <> &middot; {location}</>}
        </p>
        {description && (
          <p className="text-sm mt-1" style={{ color: "rgba(138,143,152,0.7)" }}>{description}</p>
        )}
      </div>

      <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" style={{ color: "var(--text-secondary)" }} />
    </div>
  );
}
