import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent, ScheduledPosts } from "@/utils/db/schema";
import { eq, and, gte, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET(req: Request) {
  try {
    // Get userId from query params first (from frontend)
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get("userId");
    
    // Get authentication from Clerk - try multiple methods
    const authResult = await auth();
    let userId: string | null | undefined = authResult?.userId || queryUserId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!userId) {
      try {
        const { currentUser } = await import("@clerk/nextjs/server");
        const user = await currentUser();
        userId = user?.id ?? null;
      } catch (userError) {
        console.warn("[Dashboard Stats API] currentUser() failed:", userError);
      }
    }
    
    if (!userId) {
      console.warn("[Dashboard Stats API] No userId from auth() - returning default stats");
      // Return default stats instead of 401 to prevent frontend errors
      return NextResponse.json({
        totalContent: 0,
        scheduledPosts: 0,
        teamMembers: 1,
        thisWeekContent: 0,
        engagementRate: 0,
        topPlatform: "Twitter",
      });
    }

    const user = await GetUserByClerkId(userId);
    if (!user || !user.id) {
      return NextResponse.json({
        totalContent: 0,
        scheduledPosts: 0,
        teamMembers: 1,
        thisWeekContent: 0,
        engagementRate: 0,
        topPlatform: "Twitter",
      });
    }

    // Get total content count
    const [totalContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(eq(GeneratedContent.userId, user.id));

    const totalContent = totalContentResult?.count || 0;

    // Get scheduled posts count
    const [scheduledResult] = await db
      .select({ count: count() })
      .from(ScheduledPosts)
      .where(
        and(
          eq(ScheduledPosts.userId, user.id),
          eq(ScheduledPosts.posted, false)
        )
      );

    const scheduledPosts = scheduledResult?.count || 0;

    // Get this week's content
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [weekContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(
        and(
          eq(GeneratedContent.userId, user.id),
          gte(GeneratedContent.createdAt, oneWeekAgo)
        )
      );

    const thisWeekContent = weekContentResult?.count || 0;

    // Get top platform (simplified - can be enhanced)
    const [topPlatformResult] = await db
      .select({
        platform: GeneratedContent.contentType,
        count: count(),
      })
      .from(GeneratedContent)
      .where(eq(GeneratedContent.userId, user.id))
      .groupBy(GeneratedContent.contentType)
      .orderBy(sql`count DESC`)
      .limit(1);

    const topPlatform = topPlatformResult?.platform || "Twitter";

    // Mock engagement rate (replace with real analytics later)
    const engagementRate = totalContent > 0 ? Math.floor(Math.random() * 10) + 5 : 0;

    const response = NextResponse.json({
      totalContent,
      scheduledPosts,
      teamMembers: 1, // Will be updated when team features are implemented
      thisWeekContent,
      engagementRate,
      topPlatform,
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

