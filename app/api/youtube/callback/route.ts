/**
 * YouTube OAuth Callback Handler
 * Exchanges authorization code for access and refresh tokens
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, getYouTubeConfig } from "@/utils/youtube/oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Parse body first to get client userId (same pattern as other routes)
    const body = await request.json();
    const { code, userId: clientUserId } = body;

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        console.warn("[YouTube Callback] currentUser() failed:", userError);
      }
    }

    if (!clerkUserId) {
      console.warn("[YouTube Callback] No userId from auth()");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to connect YouTube" },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const config = getYouTubeConfig();
    const tokens = await exchangeCodeForTokens(code, config);

    // Get or create user in database
    const { GetUserByClerkId, SaveOrUpdateLinkedAccount } = await import("@/utils/db/actions");
    const user = await GetUserByClerkId(clerkUserId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Fetch YouTube channel information
    let accountId: string | undefined;
    let accountUsername: string | undefined;
    
    try {
      const channelResponse = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        if (channelData.items && channelData.items.length > 0) {
          const channel = channelData.items[0];
          accountId = channel.id;
          accountUsername = channel.snippet?.title || channel.snippet?.customUrl || undefined;
        }
      }
    } catch (channelError) {
      console.warn("[YouTube Callback] Failed to fetch channel info:", channelError);
      // Continue without channel info - we can fetch it later
    }

    // Store tokens in LinkedAccounts table
    await SaveOrUpdateLinkedAccount({
      userId: user.id,
      platform: "youtube",
      accountId,
      accountUsername,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "YouTube connected successfully",
      channelId: accountId,
      channelName: accountUsername,
    });
  } catch (error: unknown) {
    console.error("YouTube callback error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    // Provide more helpful error messages
    let errorMessage = error instanceof Error ? error.message : "Failed to connect YouTube";
    
    if (errorMessage.includes("linked_accounts table does not exist")) {
      errorMessage = "Database table missing. Please contact support or try again later.";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
