"use client";

/**
 * Root fallback, no imports from app components. Renders when layout itself crashes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f9fafb",
          color: "#030712",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
              Application error
            </p>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 500,
                marginBottom: "0.75rem",
              }}
            >
              Revvy hit a snag
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              {error.message || "A critical error occurred. Please try again."}
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
              <a
                href="/"
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
                Back home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
