/**
 * Instagram Disconnect API
 * Deactivates Instagram connection for user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, DisconnectLinkedAccount } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await auth();
    const user = await currentUser();
    const body = await req.json().catch(() => ({}));
    const clientUserId = body.userId;

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

    // Disconnect Instagram account
    await DisconnectLinkedAccount(dbUser.id, "instagram");

    return NextResponse.json({
      success: true,
      message: "Instagram account disconnected successfully",
    });
  } catch (error: unknown) {
    console.error("Instagram disconnect error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to disconnect Instagram account",
      },
      { status: 500 }
    );
  }
}
