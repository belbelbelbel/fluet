/**
 * YouTube Disconnect Handler
 * Disconnects user's YouTube account
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Parse body first to get client userId (same pattern as other routes)
    const body = await request.json();
    const { userId: clientUserId } = body;

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        console.warn("[YouTube Disconnect] currentUser() failed:", userError);
      }
    }

    if (!clerkUserId) {
      console.warn("[YouTube Disconnect] No userId from auth()");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to disconnect YouTube" },
        { status: 401 }
      );
    }

    // Get or create user in database
    const { GetUserByClerkId, DisconnectLinkedAccount } = await import("@/utils/db/actions");
    const user = await GetUserByClerkId(clerkUserId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Disconnect YouTube account
    await DisconnectLinkedAccount(user.id, "youtube");

    return NextResponse.json({
      success: true,
      message: "YouTube disconnected successfully",
    });
  } catch (error: any) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect YouTube" },
      { status: 500 }
    );
  }
}
