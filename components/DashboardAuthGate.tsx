"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { authPath } from "@/lib/auth-redirect";

interface DashboardAuthGateProps {
  children: React.ReactNode;
}

function currentReturnPath(pathname: string | null): string {
  if (typeof window === "undefined") return pathname || "/dashboard";
  return `${pathname || "/dashboard"}${window.location.search || ""}`;
}

/**
 * Wait for Clerk, then either render the dashboard or send expired /
 * signed-out users straight to sign-in, no messaging.
 */
export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const pathname = usePathname();

  // Session expired / signed out → login
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && userId) return;
    window.location.replace(authPath("sign-in", currentReturnPath(pathname)));
  }, [isLoaded, isSignedIn, userId, pathname]);

  // Clerk stuck → clear cookies then login
  useEffect(() => {
    if (isLoaded) return;
    const t = window.setTimeout(() => {
      window.location.replace(
        `/clear-session?redirect_url=${encodeURIComponent(
          currentReturnPath(pathname)
        )}`
      );
    }, 2500);
    return () => window.clearTimeout(t);
  }, [isLoaded, pathname]);

  if (!isLoaded || !isSignedIn || !userId) {
    return <div className="min-h-[40vh] bg-background" aria-hidden />;
  }

  return <>{children}</>;
}
