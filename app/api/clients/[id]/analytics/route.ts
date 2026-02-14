/**
 * Client Analytics API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
} from "@/utils/db/actions";
import { ScheduledPosts, ContentAnalytics } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and, gte, desc, sql } from "drizzle-orm";

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

        // Verify client belongs to agency
        const client = await GetClientById(clientId, user.id);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found" },
                { status: 404 }
            );
        }

        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "30d";

        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        if (range === "7d") {
            startDate.setDate(now.getDate() - 7);
        } else if (range === "30d") {
            startDate.setDate(now.getDate() - 30);
        } else if (range === "90d") {
            startDate.setDate(now.getDate() - 90);
        } else {
            startDate = new Date(0); // All time
        }

        // Get scheduled posts for this client
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

        // Get analytics data (mock for now - would need real analytics data)
        // In production, this would come from ContentAnalytics table
        const totalPosts = posts.length;
        const postedPosts = posts.filter((p) => p.posted);
        
        // Mock analytics data - in production, fetch from ContentAnalytics
        const analytics = {
            totalPosts,
            totalEngagement: postedPosts.length * 150, // Mock
            averageEngagementRate: 4.2, // Mock
            topPlatform: "instagram", // Mock
            postsThisMonth: posts.filter((p) => {
                const postDate = new Date(p.createdAt);
                return postDate.getMonth() === now.getMonth() &&
                       postDate.getFullYear() === now.getFullYear();
            }).length,
            postsLastMonth: posts.filter((p) => {
                const postDate = new Date(p.createdAt);
                const lastMonth = new Date(now);
                lastMonth.setMonth(now.getMonth() - 1);
                return postDate.getMonth() === lastMonth.getMonth() &&
                       postDate.getFullYear() === lastMonth.getFullYear();
            }).length,
            engagementGrowth: 12.5, // Mock
            topPerformingPost: postedPosts.length > 0 ? {
                id: postedPosts[0].id,
                platform: postedPosts[0].platform,
                content: postedPosts[0].content.substring(0, 100),
                engagementRate: 6.8,
            } : null,
            platformBreakdown: [
                { platform: "instagram", posts: 5, engagement: 750, engagementRate: 5.2 },
                { platform: "twitter", posts: 3, engagement: 320, engagementRate: 3.8 },
                { platform: "linkedin", posts: 2, engagement: 180, engagementRate: 4.5 },
            ],
            monthlyTrend: [
                { month: "Jan", posts: 8, engagement: 1200 },
                { month: "Feb", posts: 12, engagement: 1800 },
                { month: "Mar", posts: 15, engagement: 2400 },
            ],
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
