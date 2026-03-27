"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Download, ExternalLink } from "lucide-react";

interface MeetingMinute {
  id: string;
  meeting_number: number;
  title: string;
  content: string;
  meeting_date: string;
}

interface PartnershipDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  document_date: string | null;
}

interface Props {
  minutes: MeetingMinute[];
  documents: PartnershipDocument[];
  isAdmin: boolean;
}

type Tab = "minutes" | "agreements";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function MinuteCard({ minute }: { minute: MeetingMinute }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl border border-[var(--border)] overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--bg-tertiary)]"
      >
        <div className="flex items-center gap-3">
          <FileText size={18} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {minute.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {formatDate(minute.meeting_date)}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        )}
      </button>

      {open && (
        <div
          className="px-5 pb-5 border-t border-[var(--border)]"
          style={{ borderColor: "var(--border)" }}
        >
          <pre
            className="mt-4 text-sm whitespace-pre-wrap leading-relaxed font-sans"
            style={{ color: "var(--text-secondary)" }}
          >
            {minute.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function DocumentCard({ doc }: { doc: PartnershipDocument }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] px-5 py-4 flex items-start justify-between gap-4"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <FileText
          size={18}
          style={{ color: "var(--accent-green)", flexShrink: 0, marginTop: 2 }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {doc.title}
          </p>
          {doc.description && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {doc.description}
            </p>
          )}
          {doc.document_date && (
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {formatDate(doc.document_date)}
            </p>
          )}
        </div>
      </div>

      {doc.file_url ? (
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
        >
          <Download size={13} />
          Download
        </a>
      ) : (
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs flex-shrink-0"
          style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
        >
          <ExternalLink size={13} />
          Pending upload
        </span>
      )}
    </div>
  );
}

export default function InfoClient({ minutes, documents, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>("minutes");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Club Info
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Meeting minutes and partnership agreements for authorized members.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
        style={{ background: "var(--bg-secondary)" }}
      >
        {(["minutes", "agreements"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize"
            style={{
              background: tab === t ? "var(--bg-tertiary)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {t === "minutes" ? "Meeting Minutes" : "Partnership Agreements"}
          </button>
        ))}
      </div>

      {/* Meeting Minutes */}
      {tab === "minutes" && (
        <div className="flex flex-col gap-3">
          {minutes.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
              No meeting minutes yet.
            </p>
          ) : (
            minutes.map((m) => <MinuteCard key={m.id} minute={m} />)
          )}
        </div>
      )}

      {/* Partnership Agreements */}
      {tab === "agreements" && (
        <div className="flex flex-col gap-3">
          {documents.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
              No documents yet.
            </p>
          ) : (
            documents.map((d) => <DocumentCard key={d.id} doc={d} />)
          )}
          {isAdmin && (
            <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
              To add document download links, upload PDFs to Supabase Storage and update the{" "}
              <code className="font-mono">file_url</code> field in the{" "}
              <code className="font-mono">partnership_documents</code> table.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
