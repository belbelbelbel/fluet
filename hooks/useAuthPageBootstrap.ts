"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeRedirectPath } from "@/lib/auth-redirect";

/**
 * Runs once on sign-in/sign-up when middleware sends the user here.
 * Clerk's protect() can send a full URL — rewrite the address bar to path-only
 * so the value stays consistent with what we hand the Clerk component.
 *
 * Do NOT clear cookies here. __clerk_db_jwt is the dev browser token that
 * authenticates every Frontend API call on a pk_test_ instance; deleting it
 * while Clerk boots causes an endless token-refresh loop and a blank OAuth
 * callback. Use signOut() for a real reset.
 */
export function useAuthPageBootstrap() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const rawRedirect = searchParams.get("redirect_url");
    if (
      !rawRedirect ||
      !(rawRedirect.startsWith("http://") || rawRedirect.startsWith("https://"))
    ) {
      return;
    }

    const params = new URLSearchParams({
      redirect_url: normalizeRedirectPath(rawRedirect),
    });
    router.replace(`${window.location.pathname}?${params.toString()}`);
  }, [searchParams, router]);
}
