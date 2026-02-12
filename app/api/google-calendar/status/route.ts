import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetLinkedAccount, SaveOrUpdateLinkedAccount } from "@/utils/db/actions";
import { verifyGoogleCalendarToken } from "@/utils/google-calendar/events";
import { refreshAccessToken } from "@/utils/google-calendar/oauth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-calendar/status
 * Check if user has Google Calendar connected
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const clerkUserId: string | null | undefined = authResult?.userId ?? null;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get Google Calendar linked account
    const googleAccount = await GetLinkedAccount(user.id, "google_calendar");

    if (!googleAccount || !googleAccount.accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Google Calendar not connected",
      });
    }

    // Verify token is still valid
    let isValid = await verifyGoogleCalendarToken(googleAccount.accessToken);

    // If token is invalid and we have a refresh token, try to refresh
    if (!isValid && googleAccount.refreshToken) {
      try {
        const newTokens = await refreshAccessToken(googleAccount.refreshToken);
        
        // Update tokens in database
        await SaveOrUpdateLinkedAccount({
          userId: user.id,
          platform: "google_calendar",
          accountId: null,
          accountUsername: null,
          accessToken: newTokens.access_token,
          refreshToken: googleAccount.refreshToken, // Keep the refresh token
          tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
          isActive: true,
        });

        isValid = true;
      } catch (refreshError) {
        console.error("[Google Calendar Status] Token refresh failed:", refreshError);
        isValid = false;
      }
    }

    return NextResponse.json({
      connected: isValid,
      message: isValid ? "Google Calendar connected" : "Google Calendar token expired",
    });
  } catch (error) {
    console.error("[Google Calendar Status] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
