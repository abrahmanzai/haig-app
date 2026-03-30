"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "0.75rem",
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          maxWidth: "28rem",
          lineHeight: 1.6,
        }}
      >
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          padding: "0.625rem 1.5rem",
          borderRadius: "0.75rem",
          border: "1px solid var(--border)",
          background: "var(--accent-primary)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
