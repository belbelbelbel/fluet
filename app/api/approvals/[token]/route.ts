/**
 * Approval API Routes
 * Handles approval actions via token
 */

import { NextRequest, NextResponse } from "next/server";
import {
    GetApprovalByToken,
    UpdateApprovalStatus,
} from "@/utils/db/actions";
import { ScheduledPosts, Clients, Users } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/approvals/[token]
 * Get approval details by token
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const token = params.token;

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        const approval = await GetApprovalByToken(token);

        if (!approval) {
            return NextResponse.json(
                { error: "Approval not found" },
                { status: 404 }
            );
        }

        // Check if expired
        if (approval.expiresAt && new Date(approval.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Approval link has expired" },
                { status: 410 }
            );
        }

        // Get scheduled post details
        const [post] = await db
            .select()
            .from(ScheduledPosts)
            .where(eq(ScheduledPosts.id, approval.scheduledPostId))
            .limit(1)
            .execute();

        if (!post) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            approval,
            post,
        });
    } catch (error) {
        console.error("[Approval API] GET Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch approval",
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/approvals/[token]
 * Update approval status (approve, request changes, reject)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const token = params.token;
        const body = await req.json();
        const { action, comment } = body; // action: "approve" | "request_changes" | "reject"

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        if (!action || !["approve", "request_changes", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be: approve, request_changes, or reject" },
                { status: 400 }
            );
        }

        const approval = await GetApprovalByToken(token);

        if (!approval) {
            return NextResponse.json(
                { error: "Approval not found" },
                { status: 404 }
            );
        }

        // Check if expired
        if (approval.expiresAt && new Date(approval.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Approval link has expired" },
                { status: 410 }
            );
        }

        // Check if already processed
        if (approval.status !== "pending") {
            return NextResponse.json(
                { error: `This post has already been ${approval.status}` },
                { status: 400 }
            );
        }

        // Map action to status
        const statusMap: Record<string, string> = {
            approve: "approved",
            request_changes: "changes_requested",
            reject: "rejected",
        };

        const newStatus = statusMap[action];

        // Update approval
        const updatedApproval = await UpdateApprovalStatus(
            approval.id,
            newStatus,
            comment
        );

        // Update scheduled post approval status
        await db
            .update(ScheduledPosts)
            .set({
                approvalStatus: newStatus,
            })
            .where(eq(ScheduledPosts.id, approval.scheduledPostId))
            .execute();

        // Send email notification
        try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const [post] = await db
                .select()
                .from(ScheduledPosts)
                .where(eq(ScheduledPosts.id, approval.scheduledPostId))
                .limit(1)
                .execute();

            // Get client info for email
            const [client] = await db
                .select()
                .from(Clients)
                .where(eq(Clients.id, approval.clientId))
                .limit(1)
                .execute();

            if (post && client) {
                // Send notification to agency (not client)
                const notificationType = action === "approve" 
                    ? "approval_approved" 
                    : action === "request_changes"
                    ? "approval_changes_requested"
                    : "approval_rejected";

                // Get agency user email
                const [agencyUser] = await db
                    .select({
                        id: Users.id,
                        stripecustomerId: Users.stripecustomerId,
                        email: Users.email,
                        name: Users.name,
                        points: Users.points,
                        timestamp: Users.timestamp,
                    })
                    .from(Users)
                    .where(eq(Users.id, post.userId))
                    .limit(1)
                    .execute();

                if (agencyUser?.email) {
                    await fetch(`${appUrl}/api/notifications/email`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            type: notificationType,
                            recipientEmail: agencyUser.email,
                            data: {
                                clientName: client.name,
                                platform: post.platform,
                                scheduledFor: post.scheduledFor,
                                content: post.content,
                                comment: comment,
                                editLink: `${appUrl}/dashboard/schedule`,
                            },
                        }),
                    }).catch((err) => {
                        console.error("Failed to send email notification:", err);
                    });
                }
            }
        } catch (emailError) {
            console.error("Error sending email notification:", emailError);
            // Don't fail the approval if email fails
        }

        return NextResponse.json({
            success: true,
            approval: updatedApproval,
            message: `Post ${action === "approve" ? "approved" : action === "request_changes" ? "changes requested" : "rejected"} successfully`,
        });
    } catch (error) {
        console.error("[Approval API] POST Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to update approval",
            },
            { status: 500 }
        );
    }
}
