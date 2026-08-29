"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * Completes the OAuth handshake. Must not touch cookies. Clerk reads the
 * pending sign-in attempt from __client and authenticates the Frontend API
 * call with the __clerk_db_jwt dev browser token.
 */
export default function SignInSSOCallbackPage() {
  return (
    <>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
      <div id="clerk-captcha" />
    </>
  );
}
