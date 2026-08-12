"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

interface ClerkSignInPanelProps {
  redirectUrl: string;
}

export function ClerkSignInPanel({ redirectUrl }: ClerkSignInPanelProps) {
  const safeRedirect = normalizeRedirectPath(redirectUrl);
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlowLoad(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="w-full">
      <div className="min-h-[28rem] flex items-center justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(safeRedirect)}`}
          fallbackRedirectUrl={safeRedirect}
          appearance={clerkAuthAppearance}
        />
      </div>

      {slowLoad && (
        <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-900 dark:text-amber-200">
          Sign-in is taking longer than usual — usually stale cookies.{" "}
          <Link
            href={`/clear-session?redirect_url=${encodeURIComponent(safeRedirect)}`}
            className="font-medium underline underline-offset-2"
          >
            Clear session and try again
          </Link>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground dark:text-slate-400">
        Stuck after Google sign-in?{" "}
        <Link
          href={`/clear-session?redirect_url=${encodeURIComponent(safeRedirect)}`}
          className="text-foreground dark:text-white underline underline-offset-2"
        >
          Clear session and try again
        </Link>
      </p>
    </div>
  );
}
