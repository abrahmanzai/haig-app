import Link from "next/link";
import SignOutButton from "./SignOutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", roles: null },
  { href: "/calendar",  label: "Calendar",  roles: null },
  { href: "/pitches",   label: "Pitches",   roles: null },
  { href: "/portfolio", label: "Portfolio", roles: null },
  { href: "/research",  label: "Research",  roles: ["authorized", "admin"] },
] as const;

interface Props {
  name?: string | null;
  role?: string | null;
  currentPath: string;
}

export default function AppNav({ name, role, currentPath }: Props) {
  return (
    <nav
      className="sticky top-0 z-40 border-b border-[var(--border)]"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: brand + links */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="mr-3 flex-shrink-0" aria-label="HAIG home">
            {/* Arrow mark only — viewBox spans local mark coords with a small pad */}
            <svg viewBox="-46 -46 92 132" height={36} aria-hidden="true" style={{ display: "block" }}>
              <defs>
                <linearGradient id="nav-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#0A84FF" />
                  <stop offset="100%" stopColor="#30D158" />
                </linearGradient>
              </defs>
              <rect x="-16" y="0" width="32" height="80" rx="4" fill="url(#nav-g)" />
              <polygon points="-40,10 0,-40 40,10" fill="url(#nav-g)" />
              <rect x="-28" y="36" width="56" height="8" rx="3" fill="url(#nav-g)" opacity="0.9" />
            </svg>
          </Link>
          {NAV_LINKS.filter((link) => !link.roles || (role && (link.roles as readonly string[]).includes(role))).map((link) => {
            const active = currentPath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="hidden sm:block px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                  background: active ? "var(--bg-tertiary)" : "transparent",
                }}
              >
                {link.label}
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

        {/* Right: user name + sign out */}
        <div className="flex items-center gap-3">
          {name && (
            <span className="hidden sm:block text-sm" style={{ color: "var(--text-secondary)" }}>
              {name}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
