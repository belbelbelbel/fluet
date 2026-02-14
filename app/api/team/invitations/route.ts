import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId, GetTeamInvitationsByEmail } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Get userId from query params first (from frontend)
    const searchParams = req.nextUrl.searchParams;
    const queryUserId = searchParams.get("userId");
    
    // Get authentication from Clerk - try multiple methods
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || queryUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Team Invitations API] currentUser() failed:", userError);
      }
    }
    
    if (!clerkUserId) {
      console.warn("[Team Invitations API] No userId from auth()");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user || !user.email) {
      return NextResponse.json({ invitations: [] });
    }

    // Get all pending invitations for this user's email
    const invitations = await GetTeamInvitationsByEmail(user.email);

    return NextResponse.json({ 
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        invitedBy: inv.invitedBy,
        role: inv.role,
        status: inv.status,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        token: inv.token,
      }))
    });
  } catch (error) {
    console.error("[Team Invitations API] Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
