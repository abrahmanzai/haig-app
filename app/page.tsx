import Link from "next/link";
import SplashGate from "./_components/SplashGate";
import {
  BookOpen, TrendingUp, BarChart2,
  UserPlus, GraduationCap, Mic, ThumbsUp,
  Mail, MessageCircle, Linkedin, Github,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: "Learn Together",
    body: "Structured financial literacy curriculum — workshops, speaker sessions with finance professionals, and biweekly market discussions.",
    color: "#0a84ff",
  },
  {
    icon: TrendingUp,
    title: "Invest Together",
    body: "Research real companies, present investment pitches, vote with weighted capital units, and execute real trades in the club brokerage.",
    color: "#30d158",
  },
  {
    icon: BarChart2,
    title: "Build Together",
    body: "Track portfolio performance against the S&P 500, manage your capital account, and build a verifiable investing track record.",
    color: "#bf5af2",
  },
];

const steps = [
  {
    n: "01",
    icon: UserPlus,
    title: "Sign Up & Contribute",
    body: "Become a limited partner. Sign the partnership agreement and make your initial capital contribution.",
  },
  {
    n: "02",
    icon: GraduationCap,
    title: "Learn Together",
    body: "Attend biweekly meetings, workshops with finance professionals, and guest speaker sessions.",
  },
  {
    n: "03",
    icon: Mic,
    title: "Pitch Your Idea",
    body: "Research a stock or ETF and present your investment thesis — company overview, financials, risks, and price target.",
  },
  {
    n: "04",
    icon: ThumbsUp,
    title: "Vote & Invest",
    body: "Members vote with weighted capital units. Approved pitches are executed as real trades in the partnership account.",
  },
];

const socials = [
  { label: "Email",    href: "#",                       icon: Mail,          color: "#0a84ff" },
  { label: "Discord",  href: "#",                       icon: MessageCircle, color: "#bf5af2" },
  { label: "LinkedIn", href: "#",                       icon: Linkedin,      color: "#64d2ff" },
  { label: "GitHub",   href: "#",                       icon: Github,        color: "#8e8e93" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <SplashGate />

      {/* ═══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)]"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#hero" className="flex-shrink-0" aria-label="HAIG home">
            <svg viewBox="-46 -46 92 132" height={36} aria-hidden="true" style={{ display: "block" }}>
              <defs>
                <linearGradient id="lp-nav-g" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#0A84FF" />
                  <stop offset="100%" stopColor="#30D158" />
                </linearGradient>
              </defs>
              <rect x="-16" y="0" width="32" height="80" rx="4" fill="url(#lp-nav-g)" />
              <polygon points="-40,10 0,-40 40,10" fill="url(#lp-nav-g)" />
              <rect x="-28" y="36" width="56" height="8" rx="3" fill="url(#lp-nav-g)" opacity="0.9" />
            </svg>
          </a>

          <div className="hidden sm:flex gap-6 text-sm text-[var(--text-secondary)]">
            {[
              ["Mission",      "#mission"],
              ["How It Works", "#how"],
              ["Contact",      "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm px-3 py-1.5 rounded-lg font-semibold hover:brightness-110 transition-all"
              style={{ background: "var(--accent-primary)" }}
            >
              Join
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ padding: 0 }}>

        {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex flex-col items-center justify-center text-center px-6 pt-14"
          style={{ minHeight: "100vh" }}
        >
          {/* Glow bg */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(10,132,255,0.10) 0%, transparent 65%)" }}
            />
          </div>

<div className="relative z-10 max-w-3xl lp-hero-content">
            {/* Status badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-sm text-[var(--text-secondary)] mb-10"
              style={{ background: "rgba(44,44,46,0.6)", backdropFilter: "blur(12px)" }}
            >
              <span
                className="w-2 h-2 rounded-full bg-[var(--accent-green)]"
                style={{ boxShadow: "0 0 6px #30d158" }}
              />
              Student-Run Investment Club
            </div>

            <h1
              className="font-extrabold tracking-tight leading-none mb-5"
              style={{ fontSize: "clamp(2.6rem, 8vw, 5rem)" }}
            >
              High Agency<br />Investment Group
            </h1>

            <p
              className="font-bold mb-6"
              style={{
                fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
                background: "linear-gradient(135deg, #0a84ff 0%, #64d2ff 50%, #30d158 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Learn. Invest. Build.
            </p>

            <p
              className="text-lg mb-10 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
            >
              A student general partnership where members pool capital, research
              equities, and execute real trades together — turning financial theory
              into hands-on practice.
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/signup"
                className="rounded-xl font-semibold text-base px-8 py-3.5 hover:brightness-110 hover:scale-[1.02] transition-all"
                style={{ background: "var(--accent-primary)" }}
              >
                Become a Partner →
              </Link>
              <Link
                href="/login"
                className="rounded-xl font-semibold text-base px-8 py-3.5 border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
                style={{ background: "rgba(44,44,46,0.5)", backdropFilter: "blur(12px)" }}
              >
                Member Login
              </Link>
            </div>
          </div>


          {/* Scroll hint */}
          <a
            href="#mission"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span>Scroll</span>
            <span>↓</span>
          </a>
        </section>

        {/* ═══ MISSION ══════════════════════════════════════════════════════ */}
        <section id="mission" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--accent-primary)" }}
              >
                Our Mission
              </p>
              <h2 className="text-4xl font-bold mb-4">
                Built for High-Agency Investors
              </h2>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              >
                HAIG gives students real-world investing experience. We pool
                capital, debate ideas, and execute as a team.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                  style={{
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: f.color + "20" }}
                  >
                    <f.icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section
          id="how"
          className="py-24 px-6 border-y border-[var(--border)]"
          style={{ background: "rgba(28,28,30,0.4)" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--accent-primary)" }}
              >
                The Process
              </p>
              <h2 className="text-4xl font-bold">How It Works</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {steps.map((step) => (
                <article
                  key={step.n}
                  className="relative rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors overflow-hidden"
                  style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)" }}
                >
                  {/* Ghost step number */}
                  <div
                    className="text-7xl font-black select-none leading-none mb-3"
                    style={{ color: "rgba(255,255,255,0.04)" }}
                  >
                    {step.n}
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <step.icon size={20} style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ══════════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="py-24 px-6 border-t border-[var(--border)]"
          style={{ background: "rgba(28,28,30,0.3)" }}
        >
          <div className="max-w-xl mx-auto text-center">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--accent-primary)" }}
            >
              Connect
            </p>
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p
              className="text-lg mb-10"
              style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
            >
              Interested in joining HAIG or learning more about the club? Reach
              out through any of these channels.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="rounded-2xl p-4 border border-[var(--border)] flex flex-col items-center gap-2 hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  style={{ background: "var(--bg-glass)", backdropFilter: "blur(12px)" }}
                >
                  <s.icon size={22} style={{ color: s.color }} />
                  <span className="text-sm font-medium">{s.label}</span>
                </a>
              ))}
            </div>

            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              © 2026 High Agency Investment Group
              <br />
              <span style={{ opacity: 0.6 }}>A student-run general partnership</span>
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
