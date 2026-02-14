/**
 * Tasks API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
} from "@/utils/db/actions";
import { Tasks } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/tasks
 * Get all tasks for a client
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

        // Get tasks
        const tasks = await db
            .select()
            .from(Tasks)
            .where(eq(Tasks.clientId, clientId))
            .orderBy(desc(Tasks.createdAt))
            .execute();

        // TODO: Join with Users table to get assignedToName
        // For now, return tasks as-is

        return NextResponse.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error("[Tasks API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch tasks",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/clients/[id]/tasks
 * Create a new task
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get userId from request body first (from frontend)
        const body = await req.json();
        const bodyUserId = body.userId || null;
        
        // Get authentication from Clerk - try multiple methods
        const authResult = await auth();
        let clerkUserId: string | null | undefined = authResult?.userId || bodyUserId || null;
        
        // If auth() didn't work, try currentUser() as fallback
        if (!clerkUserId) {
            try {
                const { currentUser } = await import("@clerk/nextjs/server");
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
            } catch (userError) {
                console.warn("[Tasks API POST] currentUser() failed:", userError);
            }
        }
        
        if (!clerkUserId) {
            console.warn("[Tasks API POST] No userId from any auth method");
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

        // body already parsed above, extract fields
        const { type, description, assignedTo, dueDate, scheduledPostId } = body;

        if (!type) {
            return NextResponse.json(
                { error: "Task type is required" },
                { status: 400 }
            );
        }

        // Create task
        const [task] = await db
            .insert(Tasks)
            .values({
                clientId,
                scheduledPostId: scheduledPostId ? parseInt(scheduledPostId) : null,
                type,
                description,
                assignedTo: assignedTo ? parseInt(assignedTo) : null,
                assignedBy: user.id,
                status: "assigned",
                dueDate: dueDate ? new Date(dueDate) : null,
                updatedAt: new Date(),
            })
            .returning()
            .execute();

        return NextResponse.json({
            success: true,
            task,
            message: "Task created successfully",
        });
    } catch (error) {
        console.error("[Tasks API] POST Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to create task",
            },
            { status: 500 }
        );
    }
}
