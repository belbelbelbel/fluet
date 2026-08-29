import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { db } from "@/utils/db/dbConfig";
import {
  ContentAnalytics,
  GeneratedContent,
  ScheduledPosts,
  Tasks,
} from "@/utils/db/schema";
import { eq, and, gte, sql, sum, count, inArray } from "drizzle-orm";
import { resolveAgencyContext, getAccessibleClients } from "@/lib/team-access";

export const dynamic = "force-dynamic";

function emptySeries(days: number) {
  const series: { date: string; generated: number; scheduled: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    series.push({
      date: d.toISOString().slice(0, 10),
      generated: 0,
      scheduled: 0,
    });
  }
  return series;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";
    const daysAgo = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const user = await GetUserByClerkId(userId);
    if (!user?.id) {
      return NextResponse.json({
        contentActivity: {
          totalContent: 0,
          scheduledPosts: 0,
          thisWeekContent: 0,
          topPlatform: null,
          tasksOpen: 0,
        },
        contentVolume: emptySeries(daysAgo),
        engagementMetricsAvailable: false,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        engagementRate: null,
        platformStats: [],
        activityPlatformStats: [],
        recentPerformance: [],
      });
    }

    const ctx = await resolveAgencyContext(userId);
    const accessibleClients = ctx ? await getAccessibleClients(ctx) : [];
    const clientIds = accessibleClients.map((c) => c.id);

    // Scope: own content + content for accessible clients (agency rollup prototype)
    const contentScope =
      clientIds.length > 0
        ? orUserOrClients(user.id, clientIds)
        : eq(GeneratedContent.userId, user.id);

    const [totalContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(and(contentScope, gte(GeneratedContent.createdAt, startDate)));

    const scheduleScope =
      clientIds.length > 0
        ? orScheduleUserOrClients(user.id, clientIds)
        : eq(ScheduledPosts.userId, user.id);

    const [scheduledResult] = await db
      .select({ count: count() })
      .from(ScheduledPosts)
      .where(
        and(
          scheduleScope,
          eq(ScheduledPosts.posted, false),
          gte(ScheduledPosts.scheduledFor, startDate)
        )
      );

    const [weekContentResult] = await db
      .select({ count: count() })
      .from(GeneratedContent)
      .where(
        and(contentScope, gte(GeneratedContent.createdAt, oneWeekAgo))
      );

    const [topPlatformResult] = await db
      .select({
        platform: GeneratedContent.contentType,
        count: count(),
      })
      .from(GeneratedContent)
      .where(and(contentScope, gte(GeneratedContent.createdAt, startDate)))
      .groupBy(GeneratedContent.contentType)
      .orderBy(sql`count DESC`)
      .limit(1);

    let tasksOpen = 0;
    if (clientIds.length > 0) {
      const [taskResult] = await db
        .select({ count: count() })
        .from(Tasks)
        .where(
          and(
            inArray(Tasks.clientId, clientIds),
            sql`${Tasks.status} != 'completed'`
          )
        );
      tasksOpen = taskResult?.count || 0;
    }

    // Daily volume series (real activity)
    const volume = emptySeries(daysAgo);
    const volumeMap = new Map(volume.map((v) => [v.date, v]));

    const generatedRows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${GeneratedContent.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(GeneratedContent)
      .where(and(contentScope, gte(GeneratedContent.createdAt, startDate)))
      .groupBy(sql`date_trunc('day', ${GeneratedContent.createdAt})`);

    for (const row of generatedRows) {
      const key = String(row.day).slice(0, 10);
      const bucket = volumeMap.get(key);
      if (bucket) bucket.generated = Number(row.count || 0);
    }

    const scheduledRows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${ScheduledPosts.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(ScheduledPosts)
      .where(and(scheduleScope, gte(ScheduledPosts.createdAt, startDate)))
      .groupBy(sql`date_trunc('day', ${ScheduledPosts.createdAt})`);

    for (const row of scheduledRows) {
      const key = String(row.day).slice(0, 10);
      const bucket = volumeMap.get(key);
      if (bucket) bucket.scheduled = Number(row.count || 0);
    }

    // Activity by platform (from scheduled posts, real data rather than engagement)
    const activityPlatform = await db
      .select({
        platform: ScheduledPosts.platform,
        posts: count(),
      })
      .from(ScheduledPosts)
      .where(and(scheduleScope, gte(ScheduledPosts.createdAt, startDate)))
      .groupBy(ScheduledPosts.platform);

    const activityPlatformStats = activityPlatform.map((p) => ({
      platform: p.platform || "unknown",
      posts: Number(p.posts || 0),
    }));

    const contentActivity = {
      totalContent: totalContentResult?.count || 0,
      scheduledPosts: scheduledResult?.count || 0,
      thisWeekContent: weekContentResult?.count || 0,
      topPlatform: topPlatformResult?.platform || null,
      tasksOpen,
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
      contentVolume: volume,
      activityPlatformStats,
      clientCount: clientIds.length,
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

function orUserOrClients(userId: number, clientIds: number[]) {
  return sql`(${GeneratedContent.userId} = ${userId} OR ${GeneratedContent.clientId} IN (${sql.join(
    clientIds.map((id) => sql`${id}`),
    sql`, `
  )}))`;
}

function orScheduleUserOrClients(userId: number, clientIds: number[]) {
  return sql`(${ScheduledPosts.userId} = ${userId} OR ${ScheduledPosts.clientId} IN (${sql.join(
    clientIds.map((id) => sql`${id}`),
    sql`, `
  )}))`;
}
