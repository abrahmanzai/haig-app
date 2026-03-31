"use client";

import { Mail, ExternalLink } from "lucide-react";

export default function EmailCta() {
  return (
    <a
      href="mailto:highagencyinvesting@gmail.com"
      className="group inline-flex items-center gap-3 text-lg font-semibold mb-10 px-8 py-4 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: "rgba(94,106,210,0.1)",
        borderColor: "rgba(94,106,210,0.3)",
        color: "#5E6AD2",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(94,106,210,0.18)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,106,210,0.5)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 40px rgba(94,106,210,0.25)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(94,106,210,0.1)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,106,210,0.3)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <Mail size={20} />
      highagencyinvesting@gmail.com
      <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}
