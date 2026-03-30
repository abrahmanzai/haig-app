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
    <form onSubmit={handleSubmit} className="grid gap-3">
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
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        className="w-full rounded-lg border border-[var(--border)] p-3 text-sm outline-none transition-colors"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")}
        onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--border)")}
      />

      {error && (
        <p
          className="text-sm rounded-lg px-3 py-2"
          style={{ background: "rgba(255,69,58,0.12)", color: "var(--accent-red)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-50 hover:brightness-110 transition-all mt-1"
        style={{ background: "var(--accent-primary)" }}
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
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] p-8"
        style={{ background: "var(--bg-glass)", backdropFilter: "blur(20px)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight mb-1">HAIG</div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to your account
          </p>
        </div>

        <Suspense fallback={<div className="h-48" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Need an account?{" "}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--accent-primary)" }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
