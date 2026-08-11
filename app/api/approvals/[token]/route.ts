/**
 * Approval API Routes
 * Handles approval actions via token
 */

import { NextRequest, NextResponse } from "next/server";
import {
    GetApprovalByToken,
    UpdateApprovalStatus,
    ExtendApprovalExpiry,
} from "@/utils/db/actions";
import { computeApprovalExpiry } from "@/utils/approvals/token";
import {
    cookieNameFor,
    resolveVerifiedEmail,
} from "@/utils/approvals/verification";
import { ScheduledPosts, Clients, Users } from "@/utils/db/schema";
import { db } from "@/utils/db/dbConfig";
import { eq } from "drizzle-orm";
import { sendNotificationEmail } from "@/lib/email/send-notification";
import type { NotificationType } from "@/lib/email/types";

export const dynamic = "force-dynamic";

/**
 * Approval state changes and must never be cached.
 *
 * Without an explicit directive, 200/404/410 are all heuristically cacheable
 * (RFC 9111 §4.2.2) — browsers happily store a `410 Gone` on disk and keep
 * serving it long after the approval is valid again.
 */
function json(body: unknown, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
        },
    });
}

function isExpired(expiresAt: Date | string | null | undefined): boolean {
    if (!expiresAt) return false;
    const at = new Date(expiresAt);
    return !Number.isNaN(at.getTime()) && at < new Date();
}

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
            return json(
                { error: "Token is required" }, 400);
        }

        const approval = await GetApprovalByToken(token);

        if (!approval) {
            return json({ error: "Approval not found" }, 404);
        }

        // Get scheduled post details
        const [post] = await db
            .select()
            .from(ScheduledPosts)
            .where(eq(ScheduledPosts.id, approval.scheduledPostId))
            .limit(1)
            .execute();

        if (!post) {
            return json({ error: "Post not found" }, 404);
        }

        // Expiry is a staleness backstop, not a security boundary — the token
        // itself is a 128-bit secret. Refuse only once the link can no longer
        // do anything useful (post already published, or already decided).
        // While the post is unpublished and still pending, the client must be
        // able to act, so roll the expiry forward instead of locking them out.
        if (isExpired(approval.expiresAt)) {
            const stillActionable = approval.status === "pending" && !post.posted;

            if (!stillActionable) {
                return json({ error: "Approval link has expired" }, 410);
            }

            const renewed = computeApprovalExpiry(post.scheduledFor);
            await ExtendApprovalExpiry(approval.id, renewed);
            approval.expiresAt = renewed;
        }

        const [client] = await db
            .select({ id: Clients.id, name: Clients.name })
            .from(Clients)
            .where(eq(Clients.id, approval.clientId))
            .limit(1)
            .execute();

        // Lets the portal skip the challenge for an already-verified visitor
        const verifiedEmail = await resolveVerifiedEmail(
            approval.id,
            req.cookies.get(cookieNameFor(approval.id))?.value
        );

        return json({
            success: true,
            approval,
            post,
            client: client || null,
            verified: !!verifiedEmail,
            verifiedEmail,
        });
    } catch (error) {
        console.error("[Approval API] GET Error:", error);
        return json(
            {
                error: error instanceof Error ? error.message : "Failed to fetch approval",
            }, 500);
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
            return json({ error: "Token is required" }, 400);
        }

        if (!action || !["approve", "request_changes", "reject"].includes(action)) {
            return json({ error: "Invalid action. Must be: approve, request_changes, or reject" }, 400);
        }

        const approval = await GetApprovalByToken(token);

        if (!approval) {
            return json({ error: "Approval not found" }, 404);
        }

        // Check if already processed
        if (approval.status !== "pending") {
            return json({ error: `This post has already been ${approval.status}` }, 400);
        }

        // Identity gate: holding the link is not proof of being the client.
        // A decision is only recorded for someone who proved control of the
        // client's email address on file.
        const verifiedEmail = await resolveVerifiedEmail(
            approval.id,
            req.cookies.get(cookieNameFor(approval.id))?.value
        );

        if (!verifiedEmail) {
            return json(
                {
                    error: "Verify your email before submitting a decision.",
                    reason: "verification_required",
                },
                401
            );
        }

        // Mirrors GET: a still-pending decision on an unpublished post stays
        // actionable even past its expiry. Only a published post makes the
        // link genuinely dead.
        if (isExpired(approval.expiresAt)) {
            const [pending] = await db
                .select({ posted: ScheduledPosts.posted })
                .from(ScheduledPosts)
                .where(eq(ScheduledPosts.id, approval.scheduledPostId))
                .limit(1)
                .execute();

            if (pending?.posted) {
                return json({ error: "Approval link has expired" }, 410);
            }
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
            comment,
            verifiedEmail
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
                const notificationType: NotificationType =
                    action === "approve"
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
                    const emailResult = await sendNotificationEmail({
                        type: notificationType,
                        recipientEmail: agencyUser.email,
                        data: {
                            clientName: client.name,
                            platform: post.platform,
                            scheduledFor: post.scheduledFor?.toISOString?.() ?? String(post.scheduledFor),
                            content: post.content,
                            comment: comment,
                            // Proof the decision came from the client, not a
                            // forwarded link
                            decidedByEmail: verifiedEmail,
                            editLink: `${appUrl}/dashboard/schedule`,
                        },
                    });
                    if (!emailResult.sent) {
                        console.error("Failed to send email notification:", emailResult.error);
                    }
                }
            }
        } catch (emailError) {
            console.error("Error sending email notification:", emailError);
            // Don't fail the approval if email fails
        }

        return json({
            success: true,
            approval: updatedApproval,
            message: `Post ${action === "approve" ? "approved" : action === "request_changes" ? "changes requested" : "rejected"} successfully`,
        });
    } catch (error) {
        console.error("[Approval API] POST Error:", error);
        return json(
            {
                error: error instanceof Error ? error.message : "Failed to update approval",
            }, 500);
    }
}
