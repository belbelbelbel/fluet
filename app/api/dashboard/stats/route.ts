import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { ContentAnalytics, GeneratedContent, ScheduledPosts } from "@/utils/db/schema";
import { eq, and, gte, sql, count, sum } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    // Get userId from query params first (from frontend)
    
    // Get authentication from Clerk - try multiple methods
    let userId: string | null | undefined = null;
    
    // Try auth() first
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError) {
      console.warn("[Dashboard Stats API] auth() failed:", authError);
      // Continue to try other methods
    }
    
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
    
    // Use query param as final fallback
    
    if (!userId) {
      console.warn("[Dashboard Stats API] No userId from auth() - returning default stats");
      // Return default stats instead of 401 to prevent frontend errors
      return NextResponse.json({
        totalContent: 0,
        scheduledPosts: 0,
        teamMembers: 1,
        thisWeekContent: 0,
        engagementRate: null,
        engagementMetricsAvailable: false,
        topPlatform: null,
      });
    }

    const user = await GetUserByClerkId(userId);
    if (!user || !user.id) {
      return NextResponse.json({
        totalContent: 0,
        scheduledPosts: 0,
        teamMembers: 1,
        thisWeekContent: 0,
        engagementRate: null,
        engagementMetricsAvailable: false,
        topPlatform: null,
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

    const [engagement] = await db
      .select({
        views: sum(ContentAnalytics.views),
        likes: sum(ContentAnalytics.likes),
        shares: sum(ContentAnalytics.shares),
        comments: sum(ContentAnalytics.comments),
      })
      .from(ContentAnalytics)
      .where(eq(ContentAnalytics.userId, user.id));

    const totalViews = Number(engagement?.views || 0);
    const totalLikes = Number(engagement?.likes || 0);
    const totalShares = Number(engagement?.shares || 0);
    const totalComments = Number(engagement?.comments || 0);
    const hasEngagement =
      totalViews + totalLikes + totalShares + totalComments > 0;
    const engagementRate =
      hasEngagement && totalViews > 0
        ? Math.round(
            ((totalLikes + totalShares + totalComments) / totalViews) * 100 * 10
          ) / 10
        : null;

    const response = NextResponse.json({
      totalContent,
      scheduledPosts,
      teamMembers: 1, // Will be updated when team features are implemented
      thisWeekContent,
      engagementRate,
      engagementMetricsAvailable: hasEngagement,
      totalViews: hasEngagement ? totalViews : 0,
      totalLikes: hasEngagement ? totalLikes : 0,
      topPlatform: topPlatformResult?.platform ? topPlatform : null,
    });
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error("[Dashboard Stats API] Error:", error);
    // Always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: "Failed to fetch dashboard stats",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    } catch {
      // If even JSON.stringify fails, return minimal JSON
      return new NextResponse(
        JSON.stringify({ error: "Internal server error" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}

