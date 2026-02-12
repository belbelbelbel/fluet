/**
 * Twitter Connection Status API
 * Checks if user has an active Twitter connection
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetLinkedAccount } from "@/utils/db/actions";
import { verifyTwitterToken } from "@/utils/twitter/post-service";

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

    // Get Twitter linked account
    const twitterAccount = await GetLinkedAccount(dbUser.id, "twitter");

    if (!twitterAccount || !twitterAccount.accessToken) {
      return NextResponse.json({
        connected: false,
        message: "Twitter account not connected",
      });
    }

    // Verify token is still valid
    const isValid = await verifyTwitterToken(twitterAccount.accessToken);

    if (!isValid) {
      return NextResponse.json({
        connected: false,
        message: "Twitter token expired. Please reconnect.",
      });
    }

    return NextResponse.json({
      connected: true,
      username: twitterAccount.accountUsername || "Unknown",
      accountId: twitterAccount.accountId || null,
      message: "Twitter account is connected and active",
    });
  } catch (error: unknown) {
    console.error("Twitter status error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Failed to check Twitter status",
      },
      { status: 500 }
    );
  }
}
