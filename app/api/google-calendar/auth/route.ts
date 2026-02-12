import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGoogleCalendarAuthUrl } from "@/utils/google-calendar/oauth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-calendar/auth
 * Initiates Google Calendar OAuth flow
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate authorization URL
    const authUrl = getGoogleCalendarAuthUrl(userId);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google Calendar Auth] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to initiate Google Calendar authentication",
      },
      { status: 500 }
    );
  }
}
