import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, GetUserGeneratedContent } from "@/utils/db/actions";

// Mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Try multiple methods to get the user ID
    const authResult = await auth();
    let clerkUserId = authResult?.userId;
    
    // If auth() didn't work, try currentUser()
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        console.warn("currentUser() failed:", userError);
      }
    }
    
    const { searchParams } = new URL(req.url);
    
    // Also check query params as fallback (for testing)
    if (!clerkUserId) {
      const userIdParam = searchParams.get("userId");
      if (userIdParam) {
        clerkUserId = userIdParam;
        console.log("Using userId from query params:", clerkUserId);
      }
    }

    if (!clerkUserId) {
      console.error("[Content API] No userId found - auth failed");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }
    
    console.log("[Content API] Authenticated user:", clerkUserId);

    const filter = searchParams.get("filter") || "all";

    const user = await GetUserByClerkId(clerkUserId);

    if (!user) {
      // Return empty array instead of error if user doesn't exist yet
      console.warn(`User not found for Clerk ID: ${clerkUserId}`);
      return NextResponse.json([]);
    }

    let content = await GetUserGeneratedContent(user.id, 100);
    
    console.log(`[Content API] Found ${content.length} items for user ${user.id}`);

    if (filter !== "all") {
      content = content.filter((item) => item.contentType === filter);
      console.log(`[Content API] Filtered to ${content.length} items for ${filter}`);
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch content", details: errorMessage },
      { status: 500 }
    );
  }
}

