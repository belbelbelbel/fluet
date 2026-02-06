/**
 * YouTube OAuth Callback Handler
 * Exchanges authorization code for access and refresh tokens
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, getYouTubeConfig } from "@/utils/youtube/oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { code } = await request.json();
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
    const user = await GetUserByClerkId(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in LinkedAccounts table
    await SaveOrUpdateLinkedAccount({
      userId: user.id,
      platform: "youtube",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: expiresAt,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "YouTube connected successfully",
    });
  } catch (error: any) {
    console.error("YouTube callback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect YouTube" },
      { status: 500 }
    );
  }
}
