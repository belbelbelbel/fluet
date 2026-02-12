import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId, DisconnectLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * POST /api/google-calendar/disconnect
 * Disconnect Google Calendar account
 */
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();

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

    // Disconnect Google Calendar
    await DisconnectLinkedAccount(user.id, "google_calendar");

    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("[Google Calendar Disconnect] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
