"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu, X,
  LayoutDashboard, Calendar, TrendingUp, BarChart2,
  FlaskConical, MessageSquare, Info, ShieldCheck,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import UnreadBadge from "./UnreadBadge";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: null },
  { href: "/calendar",  label: "Calendar",  icon: Calendar,         roles: null },
  { href: "/pitches",   label: "Pitches",   icon: TrendingUp,       roles: null },
  { href: "/portfolio", label: "Portfolio", icon: BarChart2,         roles: null },
  { href: "/research",  label: "Research",  icon: FlaskConical,      roles: ["authorized", "admin"] },
  { href: "/messages",  label: "Messages",  icon: MessageSquare,     roles: ["authorized", "admin"] },
  { href: "/info",      label: "Info",      icon: Info,              roles: ["authorized", "admin"] },
] as const;

interface Props {
  name?: string | null;
  role?: string | null;
  currentPath: string;
}

export default function AppNav({ name, role, currentPath }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.roles || (role && (link.roles as readonly string[]).includes(role))
  );

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: "rgba(5, 5, 6, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Left: logo + desktop links */}
        <div className="flex items-center gap-0.5">
          <Link
            href="/dashboard"
            className="mr-4 flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
            aria-label="HAIG home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="HAIG" width={30} height={30} style={{ display: "block" }} />
          </Link>

          {visibleLinks.map((link) => {
            const active = currentPath.startsWith(link.href);
            const isMessages = link.href === "/messages";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  background: active ? "var(--bg-tertiary)" : "transparent",
                }}
              >
                {link.label}
                {isMessages && <UnreadBadge />}
              </Link>
            );
          })}

          {role === "admin" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-tertiary)",
                background: currentPath.startsWith("/admin") ? "var(--accent-gold-dim)" : "transparent",
              }}
            >
              <ShieldCheck size={13} />
              Admin
            </Link>
          )}
        </div>

        {/* Right: name chip + sign out + hamburger */}
        <div className="flex items-center gap-2">
          {name && (
            <span
              className="hidden sm:block text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                color: "var(--text-secondary)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
              }}
            >
              {name}
            </span>
          )}
          <div className="hidden sm:block">
            <SignOutButton />
          </div>
          <button
            className="sm:hidden p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sm:hidden px-4 py-3 space-y-1"
          style={{ background: "rgba(5, 5, 6, 0.98)", borderTop: "1px solid var(--border)" }}
        >
          {visibleLinks.map((link) => {
            const active = currentPath.startsWith(link.href);
            const isMessages = link.href === "/messages";
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "var(--bg-tertiary)" : "transparent",
                }}
              >
                <Icon size={16} style={{ opacity: active ? 1 : 0.55 }} />
                {link.label}
                {isMessages && <UnreadBadge />}
              </Link>
            );
          })}

          {role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-secondary)",
                background: currentPath.startsWith("/admin") ? "var(--accent-gold-dim)" : "transparent",
              }}
            >
              <ShieldCheck size={16} style={{ opacity: 0.8 }} />
              Admin
            </Link>
          )}

          <div
            className="pt-3 mt-2 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {name && (
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {name}
              </span>
            )}
            <SignOutButton />
          </div>
        </div>
      )}
    </nav>
  );
}
