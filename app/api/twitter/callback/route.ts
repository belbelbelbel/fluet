/**
 * Twitter OAuth Callback Handler
 * Exchanges authorization code for access token and saves to database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { exchangeCodeForTokens, getTwitterConfig } from "@/utils/twitter/oauth";
import { GetUserByClerkId, SaveOrUpdateLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { code, userId: clientUserId } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authResult = await auth();
    const user = await currentUser();
    const clerkUserId: string | null | undefined = authResult?.userId || user?.id || clientUserId;

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await GetUserByClerkId(clerkUserId);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Exchange code for tokens
    const config = getTwitterConfig();
    const tokens = await exchangeCodeForTokens(code, config);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Fetch Twitter user info
    let accountId: string | undefined;
    let accountUsername: string | undefined;

    try {
      const userResponse = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.data) {
          accountId = userData.data.id;
          accountUsername = userData.data.username;
        }
      }
    } catch (userError) {
      console.warn("[Twitter Callback] Failed to fetch user info:", userError);
      // Continue without user info - we can fetch it later
    }

    // Store tokens in LinkedAccounts table
    await SaveOrUpdateLinkedAccount({
      userId: dbUser.id,
      platform: "twitter",
      accountId,
      accountUsername,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      tokenExpiresAt: expiresAt,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Twitter connected successfully",
      accountId,
      username: accountUsername,
    });
  } catch (error: unknown) {
    console.error("Twitter callback error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to connect Twitter account",
      },
      { status: 500 }
    );
  }
}
