/**
 * Tasks API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GetUserByClerkId } from "@/utils/db/actions";
import { Tasks, Users } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, desc } from "drizzle-orm";
import { resolveAgencyContext, assertClientAccess } from "@/lib/team-access";
import {
    sendNotificationEmail,
    getEmailAppUrl,
} from "@/lib/email/send-notification";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients/[id]/tasks
 * Get all tasks for a client
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const { searchParams } = new URL(req.url);
        const queryUserId = searchParams.get("userId");
        const authResult = await auth();
        const clerkUserId = authResult?.userId ?? queryUserId ?? null;

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

        const clientId = parseInt(resolvedParams.id);
        if (isNaN(clientId)) {
            return NextResponse.json(
                { error: "Invalid client ID" },
                { status: 400 }
            );
        }

        const ctx = await resolveAgencyContext(clerkUserId);
        if (!ctx) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const client = await assertClientAccess(ctx, clientId);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found or access denied" },
                { status: 404 }
            );
        }

        // Get tasks with assignee name (left join Users)
        const rows = await db
            .select({
                id: Tasks.id,
                clientId: Tasks.clientId,
                scheduledPostId: Tasks.scheduledPostId,
                assignedTo: Tasks.assignedTo,
                assignedBy: Tasks.assignedBy,
                type: Tasks.type,
                status: Tasks.status,
                dueDate: Tasks.dueDate,
                description: Tasks.description,
                comments: Tasks.comments,
                attachments: Tasks.attachments,
                createdAt: Tasks.createdAt,
                updatedAt: Tasks.updatedAt,
                assignedToName: Users.name,
            })
            .from(Tasks)
            .leftJoin(Users, eq(Tasks.assignedTo, Users.id))
            .where(eq(Tasks.clientId, clientId))
            .orderBy(desc(Tasks.createdAt))
            .execute();

        // Normalize to camelCase for frontend (handle both driver shapes)
        const tasks = (rows || []).map((row: Record<string, unknown>) => ({
            id: row.id,
            clientId: row.clientId ?? row.client_id,
            scheduledPostId: row.scheduledPostId ?? row.scheduled_post_id,
            assignedTo: row.assignedTo ?? row.assigned_to,
            assignedBy: row.assignedBy ?? row.assigned_by,
            assignedToName: row.assignedToName ?? row.assigned_to_name ?? null,
            type: row.type,
            status: row.status ?? "assigned",
            dueDate: row.dueDate ?? row.due_date,
            description: row.description,
            comments: row.comments,
            attachments: row.attachments,
            createdAt: row.createdAt ?? row.created_at,
            updatedAt: row.updatedAt ?? row.updated_at,
        }));

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
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
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

        const clientId = parseInt(resolvedParams.id);
        if (isNaN(clientId)) {
            return NextResponse.json(
                { error: "Invalid client ID" },
                { status: 400 }
            );
        }

        const ctx = await resolveAgencyContext(clerkUserId);
        if (!ctx) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        const client = await assertClientAccess(ctx, clientId);
        if (!client) {
            return NextResponse.json(
                { error: "Client not found or access denied" },
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

        // Assigning on creation is just as much an assignment as reassigning
        // later — notify the assignee either way.
        if (task?.assignedTo) {
            try {
                const [assignee] = await db
                    .select({ email: Users.email, name: Users.name })
                    .from(Users)
                    .where(eq(Users.id, task.assignedTo))
                    .limit(1)
                    .execute();

                if (assignee?.email) {
                    const emailResult = await sendNotificationEmail({
                        type: "task_assigned",
                        recipientEmail: assignee.email,
                        data: {
                            clientName: client.name,
                            taskType: type,
                            assignedToName: assignee.name || assignee.email,
                            description,
                            dueDate: dueDate
                                ? new Date(dueDate).toLocaleString()
                                : undefined,
                            taskLink: `${getEmailAppUrl()}/dashboard/clients/${clientId}/tasks`,
                        },
                    });
                    if (!emailResult.sent) {
                        console.error(
                            "[Tasks API] Failed to send assignment email:",
                            emailResult.error
                        );
                    }
                }
            } catch (emailError) {
                // Never fail task creation because email failed
                console.error("[Tasks API] Assignment email error:", emailError);
            }
        }

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
