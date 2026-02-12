/**
 * Instagram OAuth Callback Handler
 * Exchanges authorization code for access token and saves to database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  exchangeCodeForTokens,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
  getInstagramConfig,
} from "@/utils/instagram/oauth";
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
    const config = getInstagramConfig();
    const tokens = await exchangeCodeForTokens(code, config);

    // Get long-lived token (60 days instead of 1-2 hours)
    const longLivedToken = await getLongLivedToken(tokens.access_token, config);

    // Get user's Facebook Pages
    const pages = await getUserPages(longLivedToken.access_token);

    if (pages.length === 0) {
      return NextResponse.json(
        {
          error:
            "No Facebook Page found. Please create a Facebook Page and connect it to your Instagram account.",
          requiresPage: true,
        },
        { status: 400 }
      );
    }

    // Find page with Instagram Business Account
    let instagramAccount: any = null;
    let pageId: string | undefined;
    let instagramAccountId: string | undefined;
    let instagramUsername: string | undefined;

    for (const page of pages) {
      try {
        const igAccount = await getInstagramAccount(page.id, longLivedToken.access_token);
        if (igAccount.instagram_business_account) {
          instagramAccount = igAccount.instagram_business_account;
          pageId = page.id;
          instagramAccountId = instagramAccount.id;

          // Get Instagram username
          try {
            const igInfo = await fetch(
              `https://graph.facebook.com/v18.0/${instagramAccountId}?` +
              `fields=username&` +
              `access_token=${longLivedToken.access_token}`
            );
            if (igInfo.ok) {
              const igData = await igInfo.json();
              instagramUsername = igData.username;
            }
          } catch (err) {
            console.warn("[Instagram Callback] Failed to fetch username:", err);
          }

          break;
        }
      } catch (err) {
        console.warn(`[Instagram Callback] Page ${page.id} has no Instagram account:`, err);
        continue;
      }
    }

    if (!instagramAccount) {
      return NextResponse.json(
        {
          error:
            "No Instagram Business Account found. Please convert your Instagram to Business/Creator account and connect it to your Facebook Page.",
          requiresBusinessAccount: true,
        },
        { status: 400 }
      );
    }

    // Calculate token expiration (60 days for long-lived token)
    const expiresAt = new Date(Date.now() + longLivedToken.expires_in * 1000);

    // Store tokens in LinkedAccounts table
    await SaveOrUpdateLinkedAccount({
      userId: dbUser.id,
      platform: "instagram",
      accountId: instagramAccountId,
      accountUsername: instagramUsername,
      accessToken: longLivedToken.access_token,
      refreshToken: pageId || "", // Store page ID as refresh token identifier
      tokenExpiresAt: expiresAt,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Instagram connected successfully",
      accountId: instagramAccountId,
      username: instagramUsername,
      pageId,
    });
  } catch (error: unknown) {
    console.error("Instagram callback error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to connect Instagram account",
      },
      { status: 500 }
    );
  }
}
