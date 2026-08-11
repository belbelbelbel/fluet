/**
 * Client Analytics API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ContentAnalytics, ScheduledPosts } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and, gte, sql, sum, count, inArray, desc } from "drizzle-orm";
import { requireClientAccess } from "@/lib/team-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/analytics
 * Get analytics data for a client
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const access = await requireClientAccess(clerkUserId, clientId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    const now = new Date();
    let startDate = new Date();
    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      startDate = new Date(0);
    }

    const posts = await db
      .select()
      .from(ScheduledPosts)
      .where(
        and(
          eq(ScheduledPosts.clientId, clientId),
          gte(ScheduledPosts.createdAt, startDate)
        )
      )
      .execute();

    const totalPosts = posts.length;
    const postedPosts = posts.filter((p) => p.posted);
    const postIds = posts.map((p) => p.id);

    const postsThisMonth = posts.filter((p) => {
      const postDate = new Date(p.createdAt);
      return (
        postDate.getMonth() === now.getMonth() &&
        postDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    const postsLastMonth = posts.filter((p) => {
      const postDate = new Date(p.createdAt);
      return (
        postDate.getMonth() === lastMonth.getMonth() &&
        postDate.getFullYear() === lastMonth.getFullYear()
      );
    }).length;

    const platformCounts = posts.reduce<Record<string, number>>((acc, post) => {
      const key = post.platform || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topPlatform =
      Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      null;

    // Engagement from ContentAnalytics linked to this client's scheduled posts
    let totalViews = 0;
    let totalLikes = 0;
    let totalShares = 0;
    let totalComments = 0;
    let avgEngagementRate: number | null = null;
    let topPerformingPost: {
      id: number;
      platform: string;
      content: string;
      engagementRate: number;
    } | null = null;
    const engagementByPlatform: Record<
      string,
      { engagement: number; rateSum: number; count: number }
    > = {};

    if (postIds.length > 0) {
      const [totals] = await db
        .select({
          views: sum(ContentAnalytics.views),
          likes: sum(ContentAnalytics.likes),
          shares: sum(ContentAnalytics.shares),
          comments: sum(ContentAnalytics.comments),
          avgRate: sql<number>`AVG(${ContentAnalytics.engagementRate})`,
        })
        .from(ContentAnalytics)
        .where(inArray(ContentAnalytics.scheduledPostId, postIds));

      totalViews = Number(totals?.views || 0);
      totalLikes = Number(totals?.likes || 0);
      totalShares = Number(totals?.shares || 0);
      totalComments = Number(totals?.comments || 0);
      const avg = Number(totals?.avgRate || 0);
      avgEngagementRate = avg > 0 ? Math.round(avg * 10) / 10 : null;

      const byPlatform = await db
        .select({
          platform: ContentAnalytics.platform,
          likes: sum(ContentAnalytics.likes),
          shares: sum(ContentAnalytics.shares),
          comments: sum(ContentAnalytics.comments),
          avgRate: sql<number>`AVG(${ContentAnalytics.engagementRate})`,
          rows: count(),
        })
        .from(ContentAnalytics)
        .where(inArray(ContentAnalytics.scheduledPostId, postIds))
        .groupBy(ContentAnalytics.platform);

      for (const row of byPlatform) {
        engagementByPlatform[row.platform] = {
          engagement:
            Number(row.likes || 0) +
            Number(row.shares || 0) +
            Number(row.comments || 0),
          rateSum: Number(row.avgRate || 0),
          count: Number(row.rows || 0),
        };
      }

      const [top] = await db
        .select({
          scheduledPostId: ContentAnalytics.scheduledPostId,
          platform: ContentAnalytics.platform,
          engagementRate: ContentAnalytics.engagementRate,
        })
        .from(ContentAnalytics)
        .where(inArray(ContentAnalytics.scheduledPostId, postIds))
        .orderBy(desc(ContentAnalytics.engagementRate))
        .limit(1);

      if (top?.scheduledPostId) {
        const source = posts.find((p) => p.id === top.scheduledPostId);
        if (source) {
          topPerformingPost = {
            id: source.id,
            platform: top.platform || source.platform,
            content: source.content.slice(0, 160),
            engagementRate: Number(top.engagementRate || 0),
          };
        }
      }
    }

    const totalEngagement = totalLikes + totalShares + totalComments;
    const hasEngagement =
      totalViews + totalEngagement > 0 || avgEngagementRate != null;

    const analytics = {
      totalPosts,
      postedPosts: postedPosts.length,
      postsThisMonth,
      postsLastMonth,
      topPlatform,
      engagementMetricsAvailable: hasEngagement,
      totalViews: hasEngagement ? totalViews : 0,
      totalLikes: hasEngagement ? totalLikes : 0,
      totalShares: hasEngagement ? totalShares : 0,
      totalComments: hasEngagement ? totalComments : 0,
      totalEngagement: hasEngagement ? totalEngagement : null,
      averageEngagementRate: hasEngagement ? avgEngagementRate : null,
      engagementGrowth: null as number | null,
      topPerformingPost: hasEngagement ? topPerformingPost : null,
      platformBreakdown: Object.entries(platformCounts).map(
        ([platform, postCount]) => {
          const eng = engagementByPlatform[platform];
          return {
            platform,
            posts: postCount,
            engagement: eng ? eng.engagement : null,
            engagementRate: eng
              ? Math.round(eng.rateSum * 10) / 10
              : null,
          };
        }
      ),
      monthlyTrend: [] as Array<{
        month: string;
        posts: number;
        engagement: number | null;
      }>,
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("[Analytics API] GET Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
