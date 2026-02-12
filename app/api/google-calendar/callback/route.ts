import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens } from "@/utils/google-calendar/oauth";
import { GetUserByClerkId, SaveOrUpdateLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-calendar/callback
 * Handles Google Calendar OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // User ID
    const error = searchParams.get("error");

    if (error) {
      console.error("[Google Calendar Callback] OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=google_calendar_auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=no_code`
      );
    }

    // Verify user is authenticated
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId || clerkUserId !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=unauthorized`
      );
    }

    // Get user from database
    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=user_not_found`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Calculate token expiration
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    // Save or update linked account
    await SaveOrUpdateLinkedAccount({
      userId: user.id,
      platform: "google_calendar",
      accountId: null, // Google Calendar doesn't need account ID
      accountUsername: null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt,
      isActive: true,
    });

    // Redirect to settings page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?success=google_calendar_connected`
    );
  } catch (error) {
    console.error("[Google Calendar Callback] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?error=google_calendar_callback_failed`
    );
  }
}
