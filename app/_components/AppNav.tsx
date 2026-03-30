"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import SignOutButton from "./SignOutButton";
import UnreadBadge from "./UnreadBadge";
import ThemeToggle from "./ThemeToggle";
import ThemeLogo from "./ThemeLogo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: null },
  { href: "/calendar",  label: "Calendar",  roles: null },
  { href: "/pitches",   label: "Pitches",   roles: null },
  { href: "/portfolio", label: "Portfolio", roles: null },
  { href: "/research",  label: "Research",  roles: ["authorized", "admin"] },
  { href: "/messages",  label: "Messages",  roles: ["authorized", "admin"] },
  { href: "/info",      label: "Info",      roles: ["authorized", "admin"] },
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
      className="sticky top-0 z-40 border-b border-[var(--border)]"
      style={{ background: "var(--bg-nav)", backdropFilter: "blur(20px)" }}
    >
      {/* ── Main bar ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Left: brand + desktop nav links */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="mr-3 flex-shrink-0" aria-label="HAIG home">
            <ThemeLogo width={36} height={36} />
          </Link>

          {visibleLinks.map((link) => {
            const active = currentPath.startsWith(link.href);
            const isMessages = link.href === "/messages";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
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
              className="hidden sm:block px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-tertiary)",
                background: currentPath.startsWith("/admin") ? "rgba(255,214,10,0.12)" : "transparent",
              }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* Right: user name + sign out (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-2">
          {name && (
            <span className="hidden sm:block text-sm" style={{ color: "var(--text-secondary)" }}>
              {name}
            </span>
          )}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <SignOutButton />
          </div>
          <button
            className="sm:hidden p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X    size={20} style={{ color: "var(--text-primary)" }} />
              : <Menu size={20} style={{ color: "var(--text-primary)" }} />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sm:hidden border-t border-[var(--border)] px-4 py-3 space-y-1"
          style={{ background: "var(--bg-secondary)" }}
        >
          {visibleLinks.map((link) => {
            const active = currentPath.startsWith(link.href);
            const isMessages = link.href === "/messages";
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
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
              onClick={() => setMobileOpen(false)}
              className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-secondary)",
                background: currentPath.startsWith("/admin") ? "rgba(255,214,10,0.10)" : "transparent",
              }}
            >
              Admin
            </Link>
          )}

          <div className="pt-3 mt-1 border-t border-[var(--border)] flex items-center justify-between">
            {name && (
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{name}</span>
            )}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
