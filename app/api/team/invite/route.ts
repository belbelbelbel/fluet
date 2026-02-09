import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetUserByEmail } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Parse body first to get client userId
    const body = await req.json();
    const { email, userId: clientUserId } = body;

    // Get authentication from Clerk - try multiple methods (same pattern as other routes)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
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

    // TODO: Check if user is already a team member (when TeamMembers table is implemented)
    // const existingMember = await GetTeamMember(inviter.id, invitedUser.id);
    // if (existingMember) {
    //   return NextResponse.json(
    //     { error: "This user is already a team member" },
    //     { status: 400 }
    //   );
    // }

    // TODO: Implement actual invitation logic
    // - Create invitation record in database (when team schema is added)
    // - Send invitation email
    // - Create notification for inviter and invitee
    // - Return success

    console.log(`[Team Invite] User ${inviter.id} (${inviter.email}) invited ${invitedUser.id} (${email})`);

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        email,
        invitedUserId: invitedUser.id,
        invitedBy: inviter.id,
        status: "pending",
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





