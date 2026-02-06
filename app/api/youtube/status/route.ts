/**
 * YouTube Connection Status
 * Checks if user has valid YouTube tokens
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const authResult = await auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      console.warn("[YouTube Status API] No userId from auth()");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in", connected: false },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await GetUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({
        connected: false,
        message: "User not found",
      });
    }

    // Get YouTube linked account
    const youtubeAccount = await GetLinkedAccount(user.id, "youtube");
    
    if (!youtubeAccount) {
      return NextResponse.json({
        connected: false,
        message: "YouTube not connected",
      });
    }

    // Check if token is expired
    const isExpired = youtubeAccount.tokenExpiresAt 
      ? new Date(youtubeAccount.tokenExpiresAt) < new Date()
      : false;

    return NextResponse.json({
      connected: !isExpired && youtubeAccount.isActive,
      expired: isExpired,
      accountUsername: youtubeAccount.accountUsername,
    });
  } catch (error: any) {
    console.error("YouTube status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check YouTube status" },
      { status: 500 }
    );
  }
}
