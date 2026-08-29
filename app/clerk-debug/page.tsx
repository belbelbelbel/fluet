"use client";

/**
 * TEMPORARY diagnostic page. Safe to delete.
 * Reports whether Clerk's script/API can actually be reached from THIS browser.
 * Visit http://localhost:3000/clerk-debug and screenshot the result.
 */

import { useEffect, useState } from "react";

type Row = { label: string; value: string; ok: boolean | null };

function fapiDomain(): string {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  try {
    return atob(pk.replace(/^pk_(test|live)_/, "")).replace(/\$$/, "");
  } catch {
    return "(could not decode publishable key)";
  }
}

export default function ClerkDebugPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const caught: string[] = [];
    const onErr = (e: ErrorEvent) =>
      caught.push(`${e.message} @ ${e.filename || "?"}`);
    window.addEventListener("error", onErr, true);

    const domain = fapiDomain();

    const run = async () => {
      const out: Row[] = [];
      const push = (label: string, value: string, ok: boolean | null) =>
        out.push({ label, value, ok });

      push("Clerk FAPI domain", domain, null);

      // 1. Did Clerk's script tag get injected into the DOM?
      const tag = document.querySelector<HTMLScriptElement>(
        "script[data-clerk-js-script]"
      );
      push("Clerk <script> tag in DOM", tag ? "yes" : "NO", !!tag);
      if (tag) push("  script src", tag.src, null);

      // 2. Can we reach the Clerk API at all? A blocker fails this outright.
      try {
        const res = await fetch(
          `https://${domain}/v1/environment?__clerk_api_version=2025-04-10&_clerk_js_version=5.0.0`,
          { mode: "cors" }
        );
        // 401 is expected here (no dev-browser token on a bare fetch) and still
        // proves the domain is reachable. Only a thrown error means blocked.
        push(
          "fetch Clerk API",
          `HTTP ${res.status}${res.status === 401 ? " (reachable, expected)" : ""}`,
          true
        );
      } catch (e) {
        push(
          "fetch Clerk API",
          `BLOCKED / FAILED. ${(e as Error).message}`,
          false
        );
      }

      // 3. Can a <script> from Clerk's domain actually execute?
      const scriptOk = await new Promise<boolean>((resolve) => {
        const s = document.createElement("script");
        s.src = `https://${domain}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`;
        s.crossOrigin = "anonymous";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
        setTimeout(() => resolve(false), 15000);
      });
      push(
        "load clerk.browser.js",
        scriptOk ? "loaded" : "BLOCKED / FAILED",
        scriptOk
      );

      // 4. Clerk runtime state
      const C = (window as unknown as { Clerk?: Record<string, unknown> }).Clerk;
      push("window.Clerk", typeof C, typeof C === "object");
      push("Clerk.loaded", String(C?.loaded ?? "n/a"), C?.loaded === true);
      push("Clerk.version", String(C?.version ?? "n/a"), null);

      // The decisive rows: if Clerk thinks a session exists, <SignIn> renders
      // nothing at all, which looks identical to "the form is broken".
      const session = C?.session as { id?: string; status?: string } | undefined;
      const user = C?.user as { primaryEmailAddress?: { emailAddress?: string } } | undefined;
      push("Clerk.session", session ? `EXISTS (status: ${session.status ?? "?"})` : "none", null);
      push(
        "Clerk.user",
        user?.primaryEmailAddress?.emailAddress ?? (user ? "(signed in)" : "none"),
        null
      );
      push(
        "→ diagnosis",
        session
          ? "Signed in client-side. This is why no form renders. Click Sign out below."
          : "No client session, form should render.",
        session ? false : true
      );
      push(
        "Clerk elements rendered",
        String(document.querySelectorAll("[class*='cl-']").length),
        null
      );
      push("Clerk cookies", (document.cookie.match(/__[a-z_]+/g) || []).join(", ") || "(none)", null);

      setRows(out);
      setErrors(caught);
    };

    const t = setTimeout(run, 6000);
    return () => {
      clearTimeout(t);
      window.removeEventListener("error", onErr, true);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-mono">
      <h1 className="text-2xl font-bold mb-2">Clerk connectivity check</h1>
      <p className="text-slate-400 mb-6">
        {rows.length === 0
          ? "Running tests… (takes about 6 seconds)"
          : "Screenshot this whole page."}
      </p>

      <div className="space-y-1 max-w-4xl">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap gap-3 items-baseline border-b border-slate-700 py-2"
          >
            <span className="w-8 text-lg">
              {r.ok === null ? "•" : r.ok ? "✅" : "❌"}
            </span>
            <span className="w-64 text-slate-400">{r.label}</span>
            <span
              className={`flex-1 break-all ${
                r.ok === false ? "text-red-400 font-bold" : "text-slate-100"
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          const C = (window as unknown as { Clerk?: { signOut?: () => Promise<void> } }).Clerk;
          try {
            await C?.signOut?.();
          } catch {
            /* fall through to reload regardless */
          }
          window.location.replace("/sign-in");
        }}
        className="mt-8 rounded-lg bg-white px-6 py-3 text-base font-bold text-slate-900 hover:bg-slate-200"
      >
        Sign out and go to sign-in
      </button>

      {errors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-red-400 mb-2">
            Errors caught on this page
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-red-300">
            {errors.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
