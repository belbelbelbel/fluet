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
        console.log("[Content API] currentUser() fallback result:", { userId: clerkUserId });
      } catch (userError) {
        console.warn("[Content API] currentUser() failed:", userError);
      }
    }

    // Log authentication status for debugging
    if (!clerkUserId) {
      console.warn("[Content API] ⚠️ No userId found - auth failed, trying fallbacks");
      console.warn("[Content API] Auth result:", { hasAuthResult: !!authResult, userId: authResult?.userId });
      console.warn("[Content API] Client userId from query:", clientUserId);
    }

    if (!clerkUserId) {
      console.warn("[Content API] ⚠️ No userId - returning empty array");
      return NextResponse.json([]);
    }
    
    console.log("[Content API] ✅ Authenticated Clerk user ID:", clerkUserId);

    let user;
    try {
      console.log(`[Content API] Looking up user with Clerk ID: ${clerkUserId}`);
      user = await GetUserByClerkId(clerkUserId);
      if (!user) {
        console.log(`[Content API] ⚠️ User not found in database for Clerk ID: ${clerkUserId}`);
        console.log(`[Content API] This might mean:`);
        console.log(`  1. User was created with a different Clerk ID`);
        console.log(`  2. User needs to generate content first to be created`);
        console.log(`  3. Database lookup is failing`);
        return NextResponse.json([]);
      }
      console.log(`[Content API] ✅ Found user: DB ID ${user.id}, Email: ${user.email}, Clerk ID: ${user.stripecustomerId}`);
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
      console.log(`[Content API] Querying content for user ID: ${user.id} (limit: ${limit})`);
      console.log(`[Content API] User details - ID: ${user.id}, Email: ${user.email}, Clerk ID: ${user.stripecustomerId}`);
      
      content = await GetUserGeneratedContent(user.id, limit);
      console.log(`[Content API] ✅ Database query successful - returned ${content?.length || 0} items`);
      
      if (content && content.length > 0) {
        console.log(`[Content API] ✅ Found ${content.length} content items!`);
        console.log(`[Content API] Sample content IDs:`, content.slice(0, 3).map(c => c.id));
        console.log(`[Content API] Content types:`, content.slice(0, 3).map(c => c.contentType));
      } else {
        console.log(`[Content API] ⚠️ No content found for user ID ${user.id}`);
        console.log(`[Content API] This could mean:`);
        console.log(`  1. User hasn't generated any content yet`);
        console.log(`  2. Content was generated but saved with a different user ID`);
        console.log(`  3. Content exists but query is failing`);
        console.log(`[Content API] ⚠️ If you see content in the database, check if the userId matches: ${user.id}`);
      }
    } catch (dbError) {
      console.error("[Content API] ❌ Database error fetching content:", dbError);
      if (dbError instanceof Error) {
        console.error("[Content API] Error message:", dbError.message);
        console.error("[Content API] Error stack:", dbError.stack);
      }
      // Return empty array on database error instead of crashing
      return NextResponse.json([]);
    }
    
    console.log(`[Content API] ✅ Returning ${content.length} items for user ${user.id}`);

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

