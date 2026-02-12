/**
 * Instagram Connection Status API
 * Checks if user has an active Instagram connection
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await auth();
    const user = await currentUser();
    const searchParams = req.nextUrl.searchParams;
    const clientUserId = searchParams.get("userId");

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
      return NextResponse.json({
        connected: false,
        message: "User not found",
      });
    }

    // Get Instagram linked account
    const instagramAccount = await GetLinkedAccount(dbUser.id, "instagram");

    if (!instagramAccount || !instagramAccount.accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Instagram account not connected",
      });
    }

    // Verify token is still valid (check expiration)
    const now = new Date();
    const expiresAt = instagramAccount.tokenExpiresAt ? new Date(instagramAccount.tokenExpiresAt) : null;

    if (expiresAt && expiresAt <= now) {
      return NextResponse.json({
        connected: false,
        message: "Instagram token expired. Please reconnect.",
      });
    }

    return NextResponse.json({
      connected: true,
      username: instagramAccount.accountUsername || "Unknown",
      accountId: instagramAccount.accountId || null,
      message: "Instagram account is connected and active",
    });
  } catch (error: unknown) {
    console.error("Instagram status error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Failed to check Instagram status",
      },
      { status: 500 }
    );
  }
}
