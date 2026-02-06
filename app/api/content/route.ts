import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GetUserByClerkId, GetUserGeneratedContent } from "@/utils/db/actions";

// Mark route as dynamic
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Get user ID from Clerk auth - this should work with the middleware
    let authResult;
    try {
      authResult = await auth();
    } catch (authError) {
      console.error("[Content API] auth() threw an error:", authError);
      authResult = null;
    }
    
    const clerkUserId = authResult?.userId;
    
    console.log("[Content API] Auth check:", {
      hasAuthResult: !!authResult,
      userId: clerkUserId,
      sessionId: authResult?.sessionId,
      orgId: authResult?.orgId,
    });
    
    // If no userId, try currentUser as fallback
    let finalUserId = clerkUserId;
    if (!finalUserId) {
      try {
        const user = await currentUser();
        finalUserId = user?.id || null;
        console.log("[Content API] currentUser() fallback:", { 
          userId: finalUserId,
          hasUser: !!user,
          email: user?.emailAddresses?.[0]?.emailAddress,
        });
      } catch (userError) {
        console.warn("[Content API] currentUser() failed:", userError);
        if (userError instanceof Error) {
          console.warn("[Content API] currentUser() error message:", userError.message);
        }
      }
    }

    if (!finalUserId) {
      console.error("[Content API] ❌ Authentication failed - no userId");
      console.error("[Content API] Auth result:", JSON.stringify(authResult, null, 2));
      console.error("[Content API] Request URL:", req.url);
      console.error("[Content API] Request method:", req.method);
      
      // Check if this is a browser request or API request
      const userAgent = req.headers.get('user-agent') || '';
      console.error("[Content API] User agent:", userAgent);
      
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }
    
    console.log("[Content API] ✅ Authenticated user:", finalUserId);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    let user;
    try {
      user = await GetUserByClerkId(finalUserId);
    } catch (userError) {
      console.error(`[Content API] Error getting user for Clerk ID ${finalUserId}:`, userError);
      return NextResponse.json([]);
    }

    if (!user) {
      // Return empty array instead of error if user doesn't exist yet
      // This is normal for new users who haven't generated content yet
      console.log(`[Content API] User not found in database for Clerk ID: ${finalUserId}.`);
      console.log(`[Content API] This is normal - user will be created when they generate their first content.`);
      console.log(`[Content API] Returning empty array instead of error.`);
      return NextResponse.json([]);
    }

    console.log(`[Content API] Found user in database: ID ${user.id} for Clerk ID ${finalUserId}`);

    let content;
    try {
      content = await GetUserGeneratedContent(user.id, limit);
      console.log(`[Content API] Database query returned ${content?.length || 0} items`);
    } catch (dbError) {
      console.error("[Content API] Database error fetching content:", dbError);
      if (dbError instanceof Error) {
        console.error("[Content API] Error message:", dbError.message);
        console.error("[Content API] Error stack:", dbError.stack);
      }
      // Return empty array on database error instead of crashing
      return NextResponse.json([]);
    }
    
    console.log(`[Content API] Found ${content.length} items for user ${user.id} (limit: ${limit})`);

    if (filter !== "all") {
      content = content.filter((item) => item.contentType === filter);
      console.log(`[Content API] Filtered to ${content.length} items for ${filter}`);
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

