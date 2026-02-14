/**
 * Client Scheduled Posts API
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
} from "@/utils/db/actions";
import { ScheduledPosts } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/scheduled-posts
 * Get all scheduled posts for a client
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

        // Get scheduled posts for this client
        const posts = await db
            .select()
            .from(ScheduledPosts)
            .where(
                and(
                    eq(ScheduledPosts.clientId, clientId)
                )
            )
            .orderBy(desc(ScheduledPosts.scheduledFor))
            .execute();

        return NextResponse.json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error("[Scheduled Posts API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch scheduled posts",
            },
            { status: 500 }
        );
    }
}
