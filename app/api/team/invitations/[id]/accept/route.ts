import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { TeamInvitations, AgencyTeamMembers } from "@/utils/db/schema";
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
      console.log("[Accept Invitation] Could not parse request body, using other auth methods");
    }
    
    // Get authentication from Clerk - try multiple methods
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || bodyUserId || null;
    
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Accept Invitation] currentUser() failed:", userError);
      }
    }
    
    if (!clerkUserId) {
      console.warn("[Accept Invitation] No userId from any auth method");
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

    // Check if invitation has expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      await db
        .update(TeamInvitations)
        .set({ status: "expired" })
        .where(eq(TeamInvitations.id, invitationId))
        .execute();
      
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user is already a team member
    const [existingMember] = await db
      .select()
      .from(AgencyTeamMembers)
      .where(
        and(
          eq(AgencyTeamMembers.userId, user.id),
          eq(AgencyTeamMembers.agencyId, invitation.invitedBy)
        )
      )
      .limit(1)
      .execute();

    if (!existingMember) {
      // Create team member relationship
      await db
        .insert(AgencyTeamMembers)
        .values({
          userId: user.id,
          agencyId: invitation.invitedBy,
          role: invitation.role || "member",
          invitedBy: invitation.invitedBy,
          status: "active",
          joinedAt: new Date(),
        })
        .execute();
    } else {
      // Update existing member to active if they were pending
      await db
        .update(AgencyTeamMembers)
        .set({
          status: "active",
          joinedAt: new Date(),
        })
        .where(
          and(
            eq(AgencyTeamMembers.userId, user.id),
            eq(AgencyTeamMembers.agencyId, invitation.invitedBy)
          )
        )
        .execute();
    }

    // Update invitation status
    await db
      .update(TeamInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(TeamInvitations.id, invitationId))
      .execute();

    console.log(`[Accept Invitation] ✅ User ${user.id} accepted invitation ${invitationId}`);

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("[Accept Invitation] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to accept invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
