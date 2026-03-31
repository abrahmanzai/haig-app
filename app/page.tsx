export const dynamic = "force-dynamic";

import Link from "next/link";
import SplashGate from "./_components/SplashGate";
import ScrollReveal from "./_components/ScrollReveal";
import ThemeToggle from "./_components/ThemeToggle";
import ThemeLogo from "./_components/ThemeLogo";
import { createClient } from "@/lib/supabase/server";
import { Calendar } from "lucide-react";
import {
  BookOpen, TrendingUp, BarChart2,
  UserPlus, GraduationCap, Mic, ThumbsUp,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: "Learn Together",
    body: "Structured financial literacy curriculum — workshops, speaker sessions with finance professionals, and biweekly market discussions.",
    color: "var(--accent-primary)",
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
    title: "Get Invited & Onboard",
    body: "Membership is by referral from an existing member. Reach out via the contact section below — we'll connect you with someone who can vouch for you.",
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
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_type, event_date, location, description")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(5);

  const upcomingEvents = events ?? [];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Logo watermark — home page only */}
      <div
        className="hero-watermark fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg"      alt="" className="wm-dark"  style={{ height: "65vh", width: "auto" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark-dark.svg" alt="" className="wm-light" style={{ height: "65vh", width: "auto" }} />
      </div>
      <SplashGate />
      <ScrollReveal />

      {/* ═══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)]"
        style={{ background: "var(--bg-nav)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#hero" className="flex-shrink-0" aria-label="HAIG home">
            <ThemeLogo width={36} height={36} />
          </a>

          <div className="hidden sm:flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            {[
              ["Mission",        "#mission"],
              ["Events",         "#events"],
              ["How It Works",   "#how"],
              ["Contact",        "#contact"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Member Login
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ padding: 0, marginLeft: 0 }}>

        {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex flex-col items-center justify-center text-center px-6 pt-14"
          style={{ minHeight: "100vh" }}
        >
          {/* Multi-layer glow bg for depth */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {/* Primary glow — indigo */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(94,106,210,0.18) 0%, transparent 60%)" }}
            />
            {/* Secondary glow — teal, offset */}
            <div
              className="absolute top-[38%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(100,210,255,0.08) 0%, transparent 65%)" }}
            />
            {/* Tertiary glow — green, offset */}
            <div
              className="absolute top-[58%] left-[35%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 65%)" }}
            />
          </div>

          <div className="relative z-10 max-w-3xl lp-hero-content">
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
                background: "linear-gradient(135deg, var(--accent-primary) 0%, #64d2ff 50%, #30d158 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Learn. Invest. Build.
            </p>

            <p
              className="text-lg mb-10 max-w-lg mx-auto"
              style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
            >
              HAIG (High Agency Investment Group) is a student general partnership
              where members pool capital, research equities, and execute real trades
              together.
            </p>

            <div className="flex gap-3 justify-center flex-wrap">
              {/* Primary CTA */}
              <a
                href="#contact"
                className="cta-primary rounded-xl font-bold text-base px-8 py-3.5 text-white transition-all"
                style={{ background: "var(--accent-primary)" }}
              >
                Get in Touch →
              </a>
              {/* Secondary CTA — visually subordinate */}
              <Link
                href="/login"
                className="rounded-xl text-sm font-medium px-7 py-3.5 border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                Member Login
              </Link>
            </div>
            <p className="mt-5 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Membership by invitation only · student-run general partnership
            </p>
          </div>

          {/* Scroll hint — fades out after 3 s */}
          <a
            href="#mission"
            className="scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span>Scroll</span>
            <span>↓</span>
          </a>
        </section>

        {/* ═══ MISSION ══════════════════════════════════════════════════════ */}
        <section id="mission" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 reveal-up">
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
                We give students real-world investing experience by pooling
                capital, debating ideas, and executing trades as a team.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="reveal-up rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                  style={{
                    background: "var(--bg-glass)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "var(--shadow-card)",
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

        {/* ═══ UPCOMING EVENTS ══════════════════════════════════════════════ */}
        <section
          id="events"
          className="py-24 px-6 border-y border-[var(--border)]"
          style={{ background: "rgba(94,106,210,0.03)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14 reveal-up">
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--accent-primary)" }}
              >
                What&apos;s Coming
              </p>
              <h2 className="text-4xl font-bold mb-4">Upcoming Events</h2>
              <p
                className="text-lg max-w-2xl mx-auto"
                style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
              >
                Open to current members. Meetings are held bi-weekly.
              </p>
            </div>

            {upcomingEvents.length === 0 ? (
              <div
                className="rounded-2xl border border-[var(--border)] p-10 text-center"
                style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)" }}
              >
                <Calendar size={32} className="mx-auto mb-4" style={{ color: "var(--text-tertiary)" }} />
                <p className="font-semibold mb-1">No upcoming events scheduled</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Check back soon — we meet bi-weekly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((ev) => {
                  const color = EVENT_COLORS[ev.event_type] ?? "#888";
                  return (
                    <div
                      key={ev.id}
                      className="rounded-2xl border border-[var(--border)] p-5 flex items-start gap-4 hover:border-[var(--border-hover)] transition-colors"
                      style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)" }}
                    >
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: color + "20" }}
                      >
                        <Calendar size={20} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold leading-snug">{ev.title}</p>
                          <span
                            className="text-xs font-semibold rounded-lg px-2 py-0.5 capitalize flex-shrink-0"
                            style={{ background: color + "20", color }}
                          >
                            {ev.event_type}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {formatEventDate(ev.event_date)}
                          {ev.location && ev.location !== "TBD" && (
                            <> &middot; {ev.location}</>
                          )}
                        </p>
                        {ev.description && (
                          <p className="text-sm mt-1.5" style={{ color: "var(--text-tertiary)" }}>
                            {ev.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {upcomingEvents.length > 0 && upcomingEvents.length < 3 && (
              <p className="text-center mt-4 text-sm" style={{ color: "var(--text-tertiary)" }}>
                More events coming soon — we meet bi-weekly.
              </p>
            )}

            <p className="text-center mt-6 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Already a member?{" "}
              <Link href="/login" className="hover:underline" style={{ color: "var(--accent-primary)" }}>
                Log in to RSVP →
              </Link>
            </p>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section
          id="how"
          className="py-24 px-6"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 reveal-up">
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
                  className="reveal-up relative rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors overflow-hidden"
                  style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)" }}
                >
                  {/* Ghost step number */}
                  <div
                    className="text-7xl font-black select-none leading-none mb-3"
                    style={{ color: "var(--ghost-text)" }}
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

        {/* ═══ FOUNDING PARTNERS ════════════════════════════════════════════ */}
        <section id="leaders" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 reveal-up">
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--accent-primary)" }}
              >
                Leadership
              </p>
              <h2 className="text-4xl font-bold">Founding Partners</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {[
                { initials: "WH", name: "William Headlee",         role: "President"      },
                { initials: "AH", name: "Abdul Hameed Rahmanzai",  role: "Vice President" },
                { initials: "DG", name: "Dawson Gibbons",          role: "Secretary"      },
              ].map((person) => (
                <article
                  key={person.name}
                  className="rounded-2xl p-6 border border-[var(--border)] flex flex-col items-center text-center"
                  style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-xl font-black"
                    style={{ background: "rgba(94,106,210,0.15)", color: "var(--accent-primary)" }}
                  >
                    {person.initials}
                  </div>
                  <p className="font-semibold text-base mb-1">{person.name}</p>
                  <p className="text-sm" style={{ color: "var(--accent-primary)" }}>{person.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ══════════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="py-24 px-6 border-t border-[var(--border)]"
          style={{ background: "var(--bg-secondary)" }}
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
              Want to learn more about our work or connect with the team? Reach
              out through any of these channels.
            </p>

            <a
              href="mailto:highagencyinvesting@gmail.com"
              className="inline-block text-lg sm:text-xl font-medium tracking-wide mb-12 transition-colors hover:opacity-80"
              style={{ color: "var(--accent-primary)" }}
            >
              highagencyinvesting@gmail.com
            </a>

            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              2026 High Agency Investment Group
              <br />
              <span style={{ color: "var(--text-tertiary)" }}>A student-run general partnership</span>
            </p>
          </div>
        </section>

        {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer
          className="border-t border-[var(--border)] py-10 px-6"
          style={{ background: "var(--bg-primary)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <ThemeLogo width={24} height={24} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                High Agency Investment Group
              </span>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm" style={{ color: "var(--text-tertiary)" }}>
              {[
                ["Mission",      "#mission"],
                ["Events",       "#events"],
                ["How It Works", "#how"],
                ["Leadership",   "#leaders"],
                ["Contact",      "#contact"],
              ].map(([label, href]) => (
                <a key={label} href={href} className="hover:underline transition-colors">
                  {label}
                </a>
              ))}
              <Link href="/login" className="hover:underline transition-colors" style={{ color: "var(--accent-primary)" }}>
                Member Login
              </Link>
            </nav>

            <p className="text-xs text-center sm:text-right" style={{ color: "var(--text-tertiary)" }}>
              © 2026 High Agency Investment Group<br />
              A student-run general partnership
            </p>
          </div>
        </footer>

      </main>
    </div>
  );
}
