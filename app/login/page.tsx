"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Inner form — reads searchParams ─────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(
    searchParams.get("error") === "confirmation_failed"
      ? "Email confirmation failed. Please try again or contact support."
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
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
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt="HAIG"
              width={40}
              height={40}
              className="mx-auto mb-4 opacity-90"
            />
            <h1 className="text-xl font-bold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Sign in to your HAIG account
            </p>
          </div>

          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            Need an account?{" "}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-tertiary)" }}>
          High Agency Investment Group
        </p>
      </div>
    </div>
  );
}
