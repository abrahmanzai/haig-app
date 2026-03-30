"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail } from "lucide-react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {submitted ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.20)" }}
              >
                <Mail size={26} style={{ color: "var(--accent-primary)" }} />
              </div>
              <h2 className="text-lg font-bold mb-2">Check your email</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", lineHeight: 1.65 }}>
                We sent a confirmation link to{" "}
                <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
                Click it to activate your account.
              </p>
              <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)", lineHeight: 1.55 }}>
                An admin will review your account for full access after you confirm.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
                style={{ color: "var(--accent-primary)" }}
              >
                ← Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="text-center mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.svg"
                  alt="HAIG"
                  width={40}
                  height={40}
                  className="mx-auto mb-4 opacity-90"
                />
                <h1 className="text-xl font-bold tracking-tight mb-1">Join HAIG</h1>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  Create your partner account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p
                    className="text-sm rounded-xl px-4 py-3"
                    role="alert"
                    style={{ background: "rgba(255,69,58,0.10)", color: "var(--accent-red)", border: "1px solid rgba(255,69,58,0.20)" }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-1"
                >
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                Already have an account?{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          High Agency Investment Group
        </p>
      </div>
    </div>
  );
}
