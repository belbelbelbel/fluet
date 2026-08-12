import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * The single source of identity for API routes.
 *
 * Why this exists
 * ---------------
 * Routes used to derive identity like this:
 *
 *     let clerkUserId = authResult?.userId || queryUserId || body.userId;
 *
 * which means an unauthenticated caller who supplies `?userId=<clerk id>` IS
 * that user. requireClientAccess() and resolveAgencyContext() then authorize
 * correctly against a forged identity, so tenant isolation is bypassed upstream
 * of every check. On /api/clients it was worse than a read: the GET path calls
 * CreateOrUpdateUser(), so a forged id also wrote new user rows.
 *
 * Clerk ids are not secrets — the frontend passed them in query strings, so they
 * sit in browser history, server logs, referrer headers and any analytics.
 *
 * The rule
 * --------
 * A caller-supplied userId is never an identity. It is only ever a cross-check:
 * if present and it disagrees with the real session, reject with 403.
 */

/** Resolves the real session. Never consults caller-supplied input. */
export async function resolveClerkUserId(): Promise<string | null> {
  try {
    const authResult = await auth();
    if (authResult?.userId) return authResult.userId;
  } catch {
    // auth() throws on expired/malformed tokens — fall through to currentUser().
  }
  try {
    const user = await currentUser();
    if (user?.id) return user.id;
  } catch {
    // Treated as unauthenticated.
  }
  return null;
}

export type AuthGate =
  | { ok: true; clerkUserId: string }
  | { ok: false; response: NextResponse };

/**
 * Gate an API route on a real session.
 *
 * Pass whatever userId the caller supplied (query param or body field) as
 * `claimedUserId` and it is verified against the session rather than trusted:
 *
 *     const gate = await requireUser(req.nextUrl.searchParams.get("userId"));
 *     if (!gate.ok) return gate.response;
 *     // gate.clerkUserId is now trustworthy
 *
 * For POST/PUT the body must be read by the caller first, since the request body
 * is a one-shot stream and cannot be parsed twice:
 *
 *     const body = await req.json();
 *     const gate = await requireUser(body.userId);
 */
export async function requireUser(
  claimedUserId?: string | null
): Promise<AuthGate> {
  const clerkUserId = await resolveClerkUserId();

  if (!clerkUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", details: "Please sign in." },
        { status: 401 }
      ),
    };
  }

  // A mismatch means the caller is asking to act as somebody else. 403, not 401:
  // they are authenticated, just not permitted to assume this identity.
  if (claimedUserId && claimedUserId !== clerkUserId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", details: "Identity mismatch." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, clerkUserId };
}
