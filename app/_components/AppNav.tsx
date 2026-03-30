"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Menu, X, LayoutDashboard, Calendar, TrendingUp,
  PieChart, BookOpen, MessageSquare, Info, ShieldCheck,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import UnreadBadge from "./UnreadBadge";
import ThemeToggle from "./ThemeToggle";
import ThemeLogo from "./ThemeLogo";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: null },
  { href: "/calendar",  label: "Calendar",  icon: Calendar,         roles: null },
  { href: "/pitches",   label: "Pitches",   icon: TrendingUp,       roles: null },
  { href: "/portfolio", label: "Portfolio", icon: PieChart,         roles: null },
  { href: "/research",  label: "Research",  icon: BookOpen,         roles: ["authorized", "admin"] },
  { href: "/messages",  label: "Messages",  icon: MessageSquare,    roles: ["authorized", "admin"] },
  { href: "/info",      label: "Info",      icon: Info,             roles: ["authorized", "admin"] },
] as const;

interface Props {
  name?: string | null;
  role?: string | null;
  currentPath: string;
}

const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 64;

export default function AppNav({ name, role, currentPath }: Props) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [collapsed,  setCollapsed]    = useState(false);

  // Sync collapsed state with localStorage and CSS variable (no flash — layout.tsx sets var synchronously)
  useEffect(() => {
    const saved = localStorage.getItem("haig_sidebar_collapsed") === "1";
    setCollapsed(saved);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        next ? `${COLLAPSED_WIDTH}px` : `${EXPANDED_WIDTH}px`
      );
      localStorage.setItem("haig_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }, []);

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.roles || (role && (link.roles as readonly string[]).includes(role))
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden sm:flex fixed left-0 top-0 h-screen flex-col z-40"
        style={{
          width: sidebarWidth,
          transition: "width 0.2s ease",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center h-16 flex-shrink-0 border-b overflow-hidden"
          style={{
            borderColor: "var(--border)",
            padding: collapsed ? "0 18px" : "0 24px",
            transition: "padding 0.2s ease",
          }}
        >
          <div
            className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), #3a4182)" }}
          >
            <ThemeLogo width={18} height={18} />
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden whitespace-nowrap">
              <p className="text-sm font-black leading-tight" style={{ color: "var(--accent-primary)" }}>
                HAIG Capital
              </p>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-secondary)" }}>
                Investment Group
              </p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {visibleLinks.map((link) => {
            const active = currentPath.startsWith(link.href);
            const Icon = link.icon;
            const isMessages = link.href === "/messages";
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className="flex items-center gap-3 py-2 rounded-md text-sm transition-all"
                style={{
                  color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                  background: active ? "rgba(94,106,210,0.08)" : "transparent",
                  fontWeight: active ? 700 : 400,
                  padding: collapsed ? "8px 14px" : "8px 12px",
                  justifyContent: collapsed ? "center" : undefined,
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.75} className="flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{link.label}</span>
                    {isMessages && <UnreadBadge />}
                  </>
                )}
              </Link>
            );
          })}

          {role === "admin" && (
            <Link
              href="/admin"
              title={collapsed ? "Admin" : undefined}
              className="flex items-center gap-3 py-2 rounded-md text-sm transition-all"
              style={{
                color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-secondary)",
                background: currentPath.startsWith("/admin") ? "rgba(255,214,10,0.08)" : "transparent",
                fontWeight: currentPath.startsWith("/admin") ? 700 : 400,
                padding: collapsed ? "8px 14px" : "8px 12px",
                justifyContent: collapsed ? "center" : undefined,
              }}
            >
              <ShieldCheck size={18} strokeWidth={currentPath.startsWith("/admin") ? 2.5 : 1.75} className="flex-shrink-0" />
              {!collapsed && <span>Admin</span>}
            </Link>
          )}
        </nav>

        {/* Bottom: user info + collapse toggle */}
        <div className="border-t" style={{ borderColor: "var(--border)" }}>
          {!collapsed && name && (
            <div className="flex items-center gap-2.5 px-4 py-3">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(94,106,210,0.15)", color: "var(--accent-primary)" }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {name}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                  {role === "admin" ? "Admin" : role === "authorized" ? "Authorized" : "Member"}
                </p>
              </div>
              <ThemeToggle />
            </div>
          )}
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center py-2.5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* ── Desktop top header ──────────────────────────────────────────── */}
      <header
        className="hidden sm:flex fixed top-0 right-0 h-16 z-30 items-center justify-end px-8 border-b"
        style={{
          left: sidebarWidth,
          transition: "left 0.2s ease",
          background: "var(--bg-nav)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          {collapsed && <ThemeToggle />}
          {name && (
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{name}</span>
          )}
          <SignOutButton />
        </div>
      </header>

      {/* ── Desktop spacer — pushes content below fixed top header ─────── */}
      <div
        className="hidden sm:block h-16"
        style={{ marginLeft: sidebarWidth, transition: "margin-left 0.2s ease" }}
      />

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <nav
        className="sm:hidden sticky top-0 z-40 border-b border-[var(--border)]"
        style={{ background: "var(--bg-nav)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="HAIG home">
            <ThemeLogo width={28} height={28} />
            <span className="font-bold text-sm" style={{ color: "var(--accent-primary)" }}>HAIG</span>
          </Link>
          <button
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
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

        {/* Mobile drawer */}
        {mobileOpen && (
          <div
            className="border-t border-[var(--border)] px-4 py-3 space-y-1"
            style={{ background: "var(--bg-secondary)" }}
          >
            {visibleLinks.map((link) => {
              const active = currentPath.startsWith(link.href);
              const Icon = link.icon;
              const isMessages = link.href === "/messages";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={{
                    color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    background: active ? "rgba(94,106,210,0.08)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={16} />
                  {link.label}
                  {isMessages && <UnreadBadge />}
                </Link>
              );
            })}

            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  color: currentPath.startsWith("/admin") ? "var(--accent-gold)" : "var(--text-secondary)",
                  background: currentPath.startsWith("/admin") ? "rgba(255,214,10,0.08)" : "transparent",
                }}
              >
                <ShieldCheck size={16} />
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
    </>
  );
}
