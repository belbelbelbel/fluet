"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Inline styles only. Must render even when UI chunks or ThemeContext fail.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "#ffffff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginBottom: "0.5rem",
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 500,
            color: "#030712",
            marginBottom: "0.75rem",
          }}
        >
          We couldn&apos;t load this page
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            marginBottom: "1.5rem",
            lineHeight: 1.6,
          }}
        >
          {error.message ||
            "An unexpected error occurred. Try again or return to your dashboard."}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              height: "2.5rem",
              padding: "0 1rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "#0f172a",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              minWidth: "10rem",
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              height: "2.5rem",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 1rem",
              borderRadius: "0.375rem",
              border: "0.5px solid #d1d5db",
              background: "#fff",
              color: "#030712",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              minWidth: "10rem",
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
