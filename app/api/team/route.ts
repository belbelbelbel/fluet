import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get authentication from Clerk - try multiple methods
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Team API] currentUser() failed:", userError);
      }
    }
    
    if (!clerkUserId) {
      console.warn("[Team API] No userId from auth()");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user || !user.id) {
      return NextResponse.json({ members: [] });
    }

    // Always include the current user as the owner/admin
    // This will be expanded when team schema is added to include other members
    const members = [
      {
        id: user.id,
        name: user.name || "User",
        email: user.email,
        role: "owner" as const,
        joinedAt: user.timestamp?.toISOString() || new Date().toISOString(),
        contentGenerated: 0,
      },
    ];

    // TODO: When TeamMembers table is implemented, fetch additional members:
    // const teamMembers = await GetTeamMembers(user.id);
    // members.push(...teamMembers);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("[Team API] Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

