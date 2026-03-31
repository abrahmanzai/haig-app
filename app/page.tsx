export const dynamic = "force-dynamic";

import Link from "next/link";
import SplashGate from "./_components/SplashGate";
import ThemeToggle from "./_components/ThemeToggle";
import ThemeLogo from "./_components/ThemeLogo";
import HeroWords from "./_components/HeroWords";
import FeaturesSection from "./_components/lp/FeatureCard";
import EventCard from "./_components/lp/EventCard";
import EmailCta from "./_components/lp/EmailCta";
import { createClient } from "@/lib/supabase/server";
import {
  Calendar, TrendingUp, BarChart2,
  UserPlus, GraduationCap, Mic, ThumbsUp,
  ArrowRight, Users, DollarSign, ChevronRight,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const steps = [
  {
    n: "01",
    icon: UserPlus,
    title: "Get Invited & Onboard",
    body: "Membership is by invitation through existing member relationships. Once admitted, complete your onboarding paperwork and join the club.",
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

const stats = [
  { label: "AUM",          value: "$24K+",  icon: DollarSign },
  { label: "Members",      value: "12",     icon: Users },
  { label: "Pitches Voted", value: "8",     icon: TrendingUp },
  { label: "Founded",      value: "2025",   icon: BarChart2 },
];

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
    <div style={{ minHeight: "100vh", background: "#050506" }}>
      <SplashGate />

      {/* ═══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b"
        style={{
          background: "rgba(5,5,6,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#hero" className="flex items-center gap-2.5 flex-shrink-0" aria-label="HAIG home">
            <ThemeLogo width={32} height={32} />
            <span className="hidden sm:block text-sm font-bold tracking-widest uppercase" style={{ color: "var(--text-secondary)", letterSpacing: "0.12em" }}>
              HAIG
            </span>
          </a>

          <div className="hidden sm:flex gap-6 text-sm">
            {[["Mission","#mission"],["Events","#events"],["How It Works","#how"],["Contact","#contact"]].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:text-white"
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
              className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "var(--text-secondary)" }}
            >
              Member Login
            </Link>
            <a
              href="#contact"
              className="text-sm px-4 py-1.5 rounded-lg font-semibold text-white transition-all hover:brightness-110 hover:scale-[1.02]"
              style={{ background: "var(--accent-primary)" }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </nav>

      <main style={{ padding: 0, marginLeft: 0 }}>

        {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative flex flex-col items-center justify-center text-center overflow-hidden pt-14"
          style={{ minHeight: "100vh", background: "#050506" }}
        >
          {/* Animated dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(94,106,210,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(94,106,210,0.08) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              maskImage: "radial-gradient(ellipse 70% 65% at 50% 0%, #000 60%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 0%, #000 60%, transparent 100%)",
            }}
          />

          {/* Aurora blob 1 — top right */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              top: "-10%",
              right: "-5%",
              width: "600px",
              height: "600px",
              background: "radial-gradient(circle, rgba(94,106,210,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
              animation: "aurora-drift-1 20s ease-in-out infinite",
            }}
          />

          {/* Aurora blob 2 — bottom left */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              bottom: "5%",
              left: "-10%",
              width: "500px",
              height: "500px",
              background: "radial-gradient(circle, rgba(191,90,242,0.12) 0%, transparent 70%)",
              filter: "blur(60px)",
              animation: "aurora-drift-2 26s ease-in-out infinite",
            }}
          />

          {/* Center glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 55% 55% at 50% 45%, rgba(94,106,210,0.10) 0%, transparent 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 max-w-4xl px-6 flex flex-col items-center">

            {/* Eyebrow badge */}
            <div className="lp-fade-up lp-fade-up-1 mb-8 flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(94,106,210,0.08)",
                borderColor: "rgba(94,106,210,0.25)",
                color: "#5E6AD2",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#30d158",
                  animation: "pulse-dot 1.8s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              Student Investment Club · Est. 2025
            </div>

            {/* H1 */}
            <h1
              className="lp-fade-up lp-fade-up-2 font-extrabold tracking-tight leading-[1.02] mb-4"
              style={{
                fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
                color: "#EDEDEF",
                letterSpacing: "-0.03em",
              }}
            >
              High Agency<br />Investment Group
            </h1>

            {/* Cycling gradient tagline */}
            <div
              className="lp-fade-up lp-fade-up-3 font-bold mb-6"
              style={{
                fontSize: "clamp(1.4rem, 4vw, 2.2rem)",
                background: "linear-gradient(135deg, #5E6AD2 0%, #64d2ff 50%, #30d158 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                minHeight: "1.4em",
              }}
            >
              <HeroWords />
            </div>

            {/* Description */}
            <p
              className="lp-fade-up lp-fade-up-3 text-lg max-w-xl mx-auto mb-10"
              style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}
            >
              A student general partnership where members pool capital, research
              equities, and execute real trades together — turning financial theory
              into hands-on practice.
            </p>

            {/* CTAs */}
            <div className="lp-fade-up lp-fade-up-4 flex gap-3 justify-center flex-wrap mb-16">
              <a
                href="#contact"
                className="group relative flex items-center gap-2 rounded-xl font-semibold text-base px-8 py-3.5 text-white overflow-hidden transition-all hover:scale-[1.02]"
                style={{ background: "var(--accent-primary)" }}
              >
                {/* shimmer */}
                <span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)",
                    animation: "shimmer-x 2.5s ease infinite",
                  }}
                />
                Get in Touch
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl font-semibold text-base px-8 py-3.5 border transition-all hover:bg-white/5 hover:scale-[1.02]"
                style={{
                  borderColor: "rgba(255,255,255,0.14)",
                  color: "var(--text-primary)",
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(12px)",
                }}
              >
                Member Login
                <ChevronRight size={16} style={{ color: "var(--text-secondary)" }} />
              </Link>
            </div>

            {/* Stats bar */}
            <div
              className="lp-fade-up lp-fade-up-5 w-full max-w-2xl grid grid-cols-2 sm:grid-cols-4 divide-x rounded-2xl overflow-hidden border"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center py-5 px-3 gap-1" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="text-2xl font-bold geist-mono" style={{ color: "var(--accent-primary)" }}>{s.value}</span>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <a
            href="#mission"
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-opacity hover:opacity-60"
            style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px" }}
          >
            <span>scroll</span>
            <span style={{ animation: "fade-up-in 1.5s ease-in-out infinite alternate" }}>↓</span>
          </a>
        </section>

        {/* ═══ MISSION ══════════════════════════════════════════════════════ */}
        <section id="mission" className="py-28 px-6" style={{ background: "#050506" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary)" }}>
                Our Mission
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Built for High-Agency Investors
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                HAIG gives students real-world investing experience. We pool capital, debate ideas, and execute as a team.
              </p>
            </div>

            <FeaturesSection />
          </div>
        </section>

        {/* ═══ UPCOMING EVENTS ══════════════════════════════════════════════ */}
        <section
          id="events"
          className="py-28 px-6 border-y"
          style={{ background: "#0a0a0e", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary)" }}>
                What&apos;s Coming
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Upcoming Events
              </h2>
              <p className="text-lg" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                Open to current members. Meetings are held bi-weekly.
              </p>
            </div>

            {upcomingEvents.length === 0 ? (
              <div
                className="rounded-2xl border p-12 text-center"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <Calendar size={32} className="mx-auto mb-4" style={{ color: "var(--text-secondary)" }} />
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No upcoming events scheduled</p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Check back soon — we meet bi-weekly.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map((ev) => (
                  <EventCard key={ev.id} {...ev} color="" />
                ))}
              </div>
            )}

            <p className="text-center mt-8 text-sm" style={{ color: "var(--text-secondary)" }}>
              Already a member?{" "}
              <Link href="/login" className="hover:underline" style={{ color: "var(--accent-primary)" }}>
                Log in to RSVP →
              </Link>
            </p>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section id="how" className="py-28 px-6" style={{ background: "#050506" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary)" }}>
                The Process
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                How It Works
              </h2>
            </div>

            {/* Steps grid with connector line on desktop */}
            <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Connector line — desktop only */}
              <div
                className="hidden lg:block absolute top-[2.1rem] left-[12.5%] right-[12.5%] h-px"
                style={{ background: "linear-gradient(to right, transparent, rgba(94,106,210,0.4) 20%, rgba(94,106,210,0.4) 80%, transparent)" }}
              />

              {steps.map((step, i) => (
                <article
                  key={step.n}
                  className="relative flex flex-col rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:border-[rgba(94,106,210,0.3)]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {/* Step circle (sits on the connector line) */}
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center mb-5 flex-shrink-0 relative z-10"
                    style={{
                      background: "#050506",
                      borderColor: "rgba(94,106,210,0.5)",
                    }}
                  >
                    <step.icon size={17} style={{ color: "#5E6AD2" }} />
                  </div>

                  {/* Ghost step number */}
                  <div
                    className="text-6xl font-black leading-none mb-3 select-none geist-mono"
                    style={{ color: "rgba(255,255,255,0.04)" }}
                  >
                    {step.n}
                  </div>

                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FOUNDING PARTNERS ════════════════════════════════════════════ */}
        <section className="py-28 px-6" style={{ background: "#0a0a0e" }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent-primary)" }}>
                Leadership
              </p>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Founding Partners
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { initials: "WH", name: "William Headlee",         role: "President",      color: "#5E6AD2", active: true  },
                { initials: "AH", name: "Abdul Hameed Rahmanzai",  role: "Vice President", color: "#5E6AD2", active: true  },
                { initials: "+",  name: "Open Position",            role: "Treasurer",      color: "#6B7280", active: false },
                { initials: "D",  name: "Dawson Gibbons",           role: "Secretary",      color: "#30d158", active: true  },
              ].map((f) => (
                <article
                  key={f.name}
                  className="relative rounded-2xl p-6 border flex flex-col items-center text-center transition-all hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    opacity: f.active ? 1 : 0.55,
                  }}
                >
                  {/* Avatar with outer ring */}
                  <div
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-lg font-black"
                    style={{
                      background: f.color + "18",
                      color: f.color,
                      boxShadow: f.active ? `0 0 0 1px ${f.color}30` : "none",
                    }}
                  >
                    {f.initials}
                  </div>
                  <p className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: f.color }}>{f.role}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CONTACT CTA ══════════════════════════════════════════════════ */}
        <section id="contact" className="py-28 px-6 relative overflow-hidden" style={{ background: "#050506" }}>
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(94,106,210,0.12) 0%, transparent 70%)",
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(to right, rgba(94,106,210,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(94,106,210,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(94,106,210,0.08)", borderColor: "rgba(94,106,210,0.25)", color: "#5E6AD2" }}
            >
              Connect
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold mb-5 tracking-tight" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Interested in Joining?
            </h2>
            <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Membership is by invitation. If you&apos;re serious about learning to invest and want real hands-on experience, reach out — we&apos;d love to connect.
            </p>

            {/* Email CTA */}
            <EmailCta />

            {/* Divider */}
            <div className="w-px h-12 mx-auto mb-10" style={{ background: "rgba(255,255,255,0.1)" }} />

            <p className="text-sm" style={{ color: "rgba(138,143,152,0.6)" }}>
              © 2026 High Agency Investment Group
              <br />
              <span>A student-run general partnership</span>
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
