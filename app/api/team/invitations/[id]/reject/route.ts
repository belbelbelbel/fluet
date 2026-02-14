import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { TeamInvitations } from "@/utils/db/schema";
import { eq, and } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get userId from request body first (from frontend)
    let bodyUserId: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body === 'object' && body.userId) {
        bodyUserId = body.userId;
      }
    } catch (error) {
      // Body might be empty or invalid JSON, that's okay - we'll use other auth methods
      console.log("[Reject Invitation] Could not parse request body, using other auth methods");
    }
    
    // Get authentication from Clerk - try multiple methods
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || bodyUserId || null;
    
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Reject Invitation] currentUser() failed:", userError);
      }
    }
    
    if (!clerkUserId) {
      console.warn("[Reject Invitation] No userId from any auth method");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const invitationId = parseInt(params.id);
    if (isNaN(invitationId)) {
      return NextResponse.json(
        { error: "Invalid invitation ID" },
        { status: 400 }
      );
    }

    // Get the invitation
    const [invitation] = await db
      .select()
      .from(TeamInvitations)
      .where(
        and(
          eq(TeamInvitations.id, invitationId),
          eq(TeamInvitations.status, "pending")
        )
      )
      .limit(1)
      .execute();

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or already processed" },
        { status: 404 }
      );
    }

    // Check if invitation is for this user's email
    if (invitation.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    // Update invitation status
    await db
      .update(TeamInvitations)
      .set({ status: "rejected" })
      .where(eq(TeamInvitations.id, invitationId))
      .execute();

    console.log(`[Reject Invitation] ✅ User ${user.id} rejected invitation ${invitationId}`);

    return NextResponse.json({
      success: true,
      message: "Invitation rejected successfully",
    });
  } catch (error) {
    console.error("[Reject Invitation] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to reject invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
