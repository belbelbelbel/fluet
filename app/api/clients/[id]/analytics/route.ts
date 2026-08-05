/**
 * Client Analytics API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
} from "@/utils/db/actions";
import { ScheduledPosts } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and, gte } from "drizzle-orm";

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
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await GetUserByClerkId(clerkUserId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const clientId = parseInt(params.id);
        if (isNaN(clientId)) {
            return NextResponse.json(
                { error: "Invalid client ID" },
                { status: 400 }
            );
        }

        const client = await GetClientById(clientId, user.id);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
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

        const postsThisMonth = posts.filter((p) => {
            const postDate = new Date(p.createdAt);
            return postDate.getMonth() === now.getMonth() &&
                   postDate.getFullYear() === now.getFullYear();
        }).length;

        const lastMonth = new Date(now);
        lastMonth.setMonth(now.getMonth() - 1);
        const postsLastMonth = posts.filter((p) => {
            const postDate = new Date(p.createdAt);
            return postDate.getMonth() === lastMonth.getMonth() &&
                   postDate.getFullYear() === lastMonth.getFullYear();
        }).length;

        const platformCounts = posts.reduce<Record<string, number>>((acc, post) => {
            const key = post.platform || "unknown";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const topPlatform =
            Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        const analytics = {
            totalPosts,
            postedPosts: postedPosts.length,
            postsThisMonth,
            postsLastMonth,
            topPlatform,
            engagementMetricsAvailable: false,
            totalEngagement: null as number | null,
            averageEngagementRate: null as number | null,
            engagementGrowth: null as number | null,
            topPerformingPost: null as {
                id: number;
                platform: string;
                content: string;
                engagementRate: number;
            } | null,
            platformBreakdown: Object.entries(platformCounts).map(([platform, postCount]) => ({
                platform,
                posts: postCount,
                engagement: null as number | null,
                engagementRate: null as number | null,
            })),
            monthlyTrend: [] as Array<{ month: string; posts: number; engagement: number | null }>,
        };

        return NextResponse.json({
            success: true,
            analytics,
        });
    } catch (error) {
        console.error("[Analytics API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch analytics",
            },
            { status: 500 }
        );
    }
}
