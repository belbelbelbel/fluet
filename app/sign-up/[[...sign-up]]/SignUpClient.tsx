"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "@/components/AuthPageShell";
import { ClerkSignUpPanel } from "@/components/ClerkSignUpPanel";
import { normalizeRedirectPath } from "@/lib/auth-redirect";
import { useAuthPageBootstrap } from "@/hooks/useAuthPageBootstrap";

function SignUpForm() {
  const searchParams = useSearchParams();
  const redirectUrl = normalizeRedirectPath(searchParams.get("redirect_url"));
  useAuthPageBootstrap();

  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Start managing clients and content in minutes"
    >
      <ClerkSignUpPanel redirectUrl={redirectUrl} />
    </AuthPageShell>
  );
}

export function SignUpClient() {
  return (
    <Suspense
      fallback={
        <AuthPageShell title="Create your account" subtitle="Getting started...">
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 dark:border-slate-600 dark:border-t-slate-200 rounded-full animate-spin" />
          </div>
        </AuthPageShell>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
