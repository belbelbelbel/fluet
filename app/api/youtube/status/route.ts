/**
 * YouTube Connection Status
 * Checks if user has valid YouTube tokens
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetLinkedAccount } from "@/utils/db/actions";
import { getYouTubeTokens } from "@/utils/youtube/token-manager";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Parse query params to get client userId (same pattern as other routes)
    const { searchParams } = new URL(request.url);
    const clientUserId = searchParams.get("userId");

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        console.warn("[YouTube Status API] currentUser() failed:", userError);
      }
    }
    
    if (!clerkUserId) {
      console.warn("[YouTube Status API] No userId from auth()");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in", connected: false },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({
        connected: false,
        message: "User not found",
      });
    }

    // Get YouTube linked account (check both active and inactive to see if account exists)
    // First try to get active account
    let youtubeAccount = await GetLinkedAccount(user.id, "youtube");
    
    // If not found, check if there's an inactive account (for reconnection)
    if (!youtubeAccount) {
      const { db } = await import("@/utils/db/dbConfig");
      const { LinkedAccounts } = await import("@/utils/db/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const [inactiveAccount] = await db
        .select()
        .from(LinkedAccounts)
        .where(
          and(
            eq(LinkedAccounts.userId, user.id),
            eq(LinkedAccounts.platform, "youtube")
          )
        )
        .limit(1)
        .execute();
      
      if (inactiveAccount) {
        return NextResponse.json({
          connected: false,
          message: "YouTube account disconnected. Please reconnect.",
          accountUsername: inactiveAccount.accountUsername,
        });
      }
      
      return NextResponse.json({
        connected: false,
        message: "YouTube not connected",
      });
    }

    // Try to get valid tokens (this will auto-refresh if expired)
    // This ensures we have a valid token and the account is truly connected
    const tokens = await getYouTubeTokens(clerkUserId);
    
    // Account is connected if:
    // 1. Account exists and is active
    // 2. We can get valid tokens (refresh works)
    const isConnected = youtubeAccount.isActive && tokens !== null;

    return NextResponse.json({
      connected: isConnected,
      expired: tokens === null && youtubeAccount.isActive, // Expired but refreshable
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
