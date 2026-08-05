import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { ContentAnalytics, GeneratedContent, ScheduledPosts } from "@/utils/db/schema";
import { eq, and, gte, sql, sum, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    
    if (!userId) {
      console.warn("[Analytics API] No userId from auth()");
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    const user = await GetUserByClerkId(userId);
    if (!user || !user.id) {
      return NextResponse.json({
        contentActivity: {
          totalContent: 0,
          scheduledPosts: 0,
          thisWeekContent: 0,
          topPlatform: null,
        },
        engagementMetricsAvailable: false,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        engagementRate: null,
        platformStats: [],
        recentPerformance: [],
      });
    }

    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(eq(GeneratedContent.userId, user.id));

    const [scheduledResult] = await db
      .select({ count: count() })
      .from(ScheduledPosts)
      .where(
        and(
          eq(ScheduledPosts.userId, user.id),
          eq(ScheduledPosts.posted, false)
        )
      );

    const [weekContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(
        and(
          eq(GeneratedContent.userId, user.id),
          gte(GeneratedContent.createdAt, oneWeekAgo)
        )
      );

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

    const contentActivity = {
      totalContent: totalContentResult?.count || 0,
      scheduledPosts: scheduledResult?.count || 0,
      thisWeekContent: weekContentResult?.count || 0,
      topPlatform: topPlatformResult?.platform || null,
    };

    const analytics = await db
      .select({
        views: sum(ContentAnalytics.views),
        likes: sum(ContentAnalytics.likes),
        shares: sum(ContentAnalytics.shares),
        comments: sum(ContentAnalytics.comments),
      })
      .from(ContentAnalytics)
      .where(
        and(
          eq(ContentAnalytics.userId, user.id),
          gte(ContentAnalytics.createdAt, startDate)
        )
      );

    const totalViews = Number(analytics[0]?.views || 0);
    const totalLikes = Number(analytics[0]?.likes || 0);
    const totalShares = Number(analytics[0]?.shares || 0);
    const totalComments = Number(analytics[0]?.comments || 0);

    const platformStats = await db
      .select({
        platform: ContentAnalytics.platform,
        posts: count(),
        views: sum(ContentAnalytics.views),
        engagement: sql<number>`AVG(${ContentAnalytics.engagementRate})`,
      })
      .from(ContentAnalytics)
      .where(
        and(
          eq(ContentAnalytics.userId, user.id),
          gte(ContentAnalytics.createdAt, startDate)
        )
      )
      .groupBy(ContentAnalytics.platform);

    const formattedPlatformStats = platformStats.map((stat) => ({
      platform: stat.platform,
      posts: Number(stat.posts || 0),
      views: Number(stat.views || 0),
      engagement: Math.round(Number(stat.engagement || 0) * 10) / 10,
    }));

    const hasEngagementData =
      totalViews + totalLikes + totalShares + totalComments > 0 ||
      formattedPlatformStats.some((stat) => stat.posts > 0);

    const totalEngagements = totalLikes + totalShares + totalComments;
    const engagementRate =
      hasEngagementData && totalViews > 0
        ? Math.round((totalEngagements / totalViews) * 100 * 10) / 10
        : null;

    return NextResponse.json({
      contentActivity,
      engagementMetricsAvailable: hasEngagementData,
      totalViews: hasEngagementData ? totalViews : 0,
      totalLikes: hasEngagementData ? totalLikes : 0,
      totalShares: hasEngagementData ? totalShares : 0,
      totalComments: hasEngagementData ? totalComments : 0,
      engagementRate,
      platformStats: hasEngagementData ? formattedPlatformStats : [],
      recentPerformance: [],
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
