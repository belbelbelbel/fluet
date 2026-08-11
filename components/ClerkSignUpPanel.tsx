"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

interface ClerkSignUpPanelProps {
  redirectUrl: string;
}

export function ClerkSignUpPanel({ redirectUrl }: ClerkSignUpPanelProps) {
  const safeRedirect = normalizeRedirectPath(redirectUrl);

  return (
    <div className="w-full">
      <div className="min-h-[28rem] flex items-center justify-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl={`/sign-in?redirect_url=${encodeURIComponent(safeRedirect)}`}
          fallbackRedirectUrl={safeRedirect}
          appearance={clerkAuthAppearance}
        />
      </div>
      <p className="mt-4 text-center text-xs text-gray-500 dark:text-slate-400">
        Stuck after Google sign-in?{" "}
        <Link
          href={`/clear-session?redirect_url=${encodeURIComponent(safeRedirect)}`}
          className="text-gray-900 dark:text-white underline underline-offset-2"
        >
          Clear session and try again
        </Link>
      </p>
    </div>
  );
}
