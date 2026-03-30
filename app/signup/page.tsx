"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
        // Tell Supabase where to redirect after the confirmation link is clicked.
        // The callback route exchanges the code for a session → /dashboard.
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
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] p-8"
        style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)", boxShadow: "var(--shadow-card)" }}
      >
        {submitted ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-lg font-bold mb-2">Check your email</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account and sign in.
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              Welcome! An admin will review your account for full access after you confirm.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="text-center mb-8">
              <div className="text-2xl font-bold tracking-tight mb-1">HAIG</div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Create your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
              />

              {error && (
                <p className="text-sm rounded-lg px-3 py-2" style={{ background: "rgba(255,69,58,0.12)", color: "var(--accent-red)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-50 hover:brightness-110 transition-all mt-1"
                style={{ background: "var(--accent-primary)" }}
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--accent-primary)" }}>
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
