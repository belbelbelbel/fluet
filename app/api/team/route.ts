import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

