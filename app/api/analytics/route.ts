import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import { GeneratedContent, ContentAnalytics } from "@/utils/db/schema";
import { eq, and, gte, sql, sum, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    const user = await GetUserByClerkId(userId);
    if (!user || !user.id) {
      return NextResponse.json({
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        engagementRate: 0,
        platformStats: [],
        recentPerformance: [],
      });
    }

    // Calculate date range
    const now = new Date();
    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get analytics data
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

    // Calculate engagement rate
    const totalEngagements = totalLikes + totalShares + totalComments;
    const engagementRate = totalViews > 0 
      ? Math.round((totalEngagements / totalViews) * 100 * 10) / 10 
      : 0;

    // Get platform stats
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

    // Mock recent performance (replace with real data later)
    const recentPerformance = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split("T")[0],
        views: Math.floor(Math.random() * 1000) + 100,
        engagement: Math.floor(Math.random() * 10) + 3,
      };
    });

    return NextResponse.json({
      totalViews,
      totalLikes,
      totalShares,
      totalComments,
      engagementRate,
      platformStats: formattedPlatformStats.length > 0 
        ? formattedPlatformStats 
        : [
            { platform: "Twitter", posts: 0, views: 0, engagement: 0 },
            { platform: "Instagram", posts: 0, views: 0, engagement: 0 },
            { platform: "LinkedIn", posts: 0, views: 0, engagement: 0 },
          ],
      recentPerformance,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

