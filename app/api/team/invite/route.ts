import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetUserByEmail, CreateTeamInvitation } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Parse body first to get client userId
    const body = await req.json();
    const { email, userId: clientUserId } = body;

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("currentUser() failed:", userError);
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Get current user (inviter) from database
    const inviter = await GetUserByClerkId(clerkUserId);
    if (!inviter) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Normalize emails for comparison
    const normalizedInviterEmail = inviter.email.toLowerCase().trim();
    const normalizedInviteEmail = email.toLowerCase().trim();

    // Check if user is trying to invite themselves
    if (normalizedInviterEmail === normalizedInviteEmail) {
      return NextResponse.json(
        { error: "You cannot invite yourself to the team. You are already the team owner." },
        { status: 400 }
      );
    }

    // Check if the email belongs to a registered user
    const invitedUser = await GetUserByEmail(email);
    if (!invitedUser) {
      return NextResponse.json(
        { error: `The email "${email}" is not registered in the app. Only registered users can be invited to the team.` },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email
    const { GetTeamInvitationsByEmail } = await import("@/utils/db/actions");
    const existingInvitations = await GetTeamInvitationsByEmail(email);
    const pendingInvitation = existingInvitations.find(
      (inv) => inv.status === "pending" && inv.invitedBy === inviter.id
    );
    
    if (pendingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email address" },
        { status: 400 }
      );
    }

    // Create invitation record in database
    const invitation = await CreateTeamInvitation(
      inviter.id,
      email,
      "member" // Default role
    );

    console.log(`[Team Invite] ✅ Invitation created: User ${inviter.id} (${inviter.email}) invited ${invitedUser.id} (${email})`);

    // TODO: Send invitation email
    // TODO: Create notification for invitee

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email,
        invitedUserId: invitedUser.id,
        invitedBy: inviter.id,
        status: invitation.status,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("[Team Invite] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}





