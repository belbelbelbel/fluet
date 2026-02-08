import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, GetUserGeneratedContent } from "@/utils/db/actions";

// Mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Parse query params first to get client userId (same pattern as generate API)
    const { searchParams } = new URL(req.url);
    const clientUserId = searchParams.get("userId");
    const filter = searchParams.get("filter") || "all";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || clientUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback (same as generate)
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id || null;
      } catch (userError) {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json([]);
    }
    
    let user;
    try {
      user = await GetUserByClerkId(clerkUserId);
      if (!user) {
        return NextResponse.json([]);
      }
    } catch (userError) {
      console.error(`[Content API] ❌ Error getting user:`, userError);
      if (userError instanceof Error) {
        console.error(`[Content API] Error message: ${userError.message}`);
        console.error(`[Content API] Error stack: ${userError.stack}`);
      }
      return NextResponse.json([]);
    }

    let content;
    try {
      content = await GetUserGeneratedContent(user.id, limit);
    } catch (dbError) {
      console.error("[Content API] ❌ Database error fetching content:", dbError);
      if (dbError instanceof Error) {
        console.error("[Content API] Error message:", dbError.message);
        console.error("[Content API] Error stack:", dbError.stack);
      }
      // Return empty array on database error instead of crashing
      return NextResponse.json([]);
    }
    
    if (filter !== "all") {
      content = content.filter((item) => item.contentType === filter);
    }

    // Ensure we respect the limit even after filtering
    if (limit && content.length > limit) {
      content = content.slice(0, limit);
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

