/**
 * Individual Task API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
    GetClientById,
    GetUserByClerkId,
} from "@/utils/db/actions";
import { Tasks, Users } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * PUT /api/clients/[id]/tasks/[taskId]
 * Update a task
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string; taskId: string } | Promise<{ id: string; taskId: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const body = await req.json();
        const bodyUserId = body?.userId ?? null;
        const authResult = await auth();
        let clerkUserId: string | null | undefined = authResult?.userId ?? bodyUserId ?? null;
        if (!clerkUserId) {
            try {
                const user = await currentUser();
                clerkUserId = user?.id ?? null;
            } catch {
                // ignore
            }
        }

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
        const taskId = parseInt(resolvedParams.taskId);

        if (isNaN(clientId) || isNaN(taskId)) {
            return NextResponse.json(
                { error: "Invalid client or task ID" },
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

        const { type, status, description, assignedTo, dueDate } = body;

        // Get current task to check if assignment changed
        const [currentTask] = await db
            .select()
            .from(Tasks)
            .where(
                and(
                    eq(Tasks.id, taskId),
                    eq(Tasks.clientId, clientId)
                )
            )
            .limit(1)
            .execute();

        const wasAssigned = currentTask?.assignedTo;
        const isNowAssigned = assignedTo ? parseInt(assignedTo) : null;
        const assignmentChanged = wasAssigned !== isNowAssigned && isNowAssigned;

        // Update task
        const [updatedTask] = await db
            .update(Tasks)
            .set({
                type,
                status,
                description,
                assignedTo: isNowAssigned,
                dueDate: dueDate ? new Date(dueDate) : null,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(Tasks.id, taskId),
                    eq(Tasks.clientId, clientId)
                )
            )
            .returning()
            .execute();

        // Send email notification if task was newly assigned
        if (assignmentChanged && isNowAssigned) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                
                // Get assigned user info
                const [assignedUser] = await db
                    .select({
                        id: Users.id,
                        stripecustomerId: Users.stripecustomerId,
                        email: Users.email,
                        name: Users.name,
                        points: Users.points,
                        timestamp: Users.timestamp,
                    })
                    .from(Users)
                    .where(eq(Users.id, isNowAssigned))
                    .limit(1)
                    .execute();

                // Get client info
                const client = await GetClientById(clientId, user.id);

                if (assignedUser?.email && client) {
                    await fetch(`${appUrl}/api/notifications/email`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            type: "task_assigned",
                            recipientEmail: assignedUser.email,
                            data: {
                                clientName: client.name,
                                taskType: type,
                                assignedToName: assignedUser.name || assignedUser.email,
                                description: description,
                                dueDate: dueDate ? new Date(dueDate).toLocaleString() : undefined,
                                taskLink: `${appUrl}/dashboard/clients/${clientId}/tasks`,
                            },
                        }),
                    }).catch((err) => {
                        console.error("Failed to send task assignment email:", err);
                    });
                }
            } catch (emailError) {
                console.error("Error sending task assignment email:", emailError);
                // Don't fail the task update if email fails
            }
        }

        if (!updatedTask) {
            return NextResponse.json(
                { error: "Task not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            task: updatedTask,
            message: "Task updated successfully",
        });
    } catch (error) {
        console.error("[Task API] PUT Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to update task",
            },
            { status: 500 }
        );
    }
}
