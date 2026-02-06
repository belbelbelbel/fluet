import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      console.warn("[Team API] No userId from auth()");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const user = await GetUserByClerkId(userId);
    if (!user || !user.id) {
      return NextResponse.json({ members: [] });
    }

    // For now, return the current user as the only team member
    // This will be expanded when team schema is added
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

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

