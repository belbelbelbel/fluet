"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "@/components/AuthPageShell";
import { ClerkSignInPanel } from "@/components/ClerkSignInPanel";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { useAuthPageBootstrap } from "@/hooks/useAuthPageBootstrap";

function SignInForm() {
  const searchParams = useSearchParams();
  const redirectUrl = normalizeRedirectPath(searchParams.get("redirect_url"));
  useAuthPageBootstrap();

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard"
    >
      <ClerkSignInPanel redirectUrl={redirectUrl} />
    </AuthPageShell>
  );
}

export function SignInClient() {
  return (
    <Suspense
      fallback={
        <AuthPageShell title="Welcome back" subtitle="Sign in to continue">
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 dark:border-slate-600 dark:border-t-slate-200 rounded-full animate-spin" />
          </div>
        </AuthPageShell>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
