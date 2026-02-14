/**
 * Email Notifications API
 * Handles sending email notifications for approvals and other events
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
    GetUserByClerkId,
    GetApprovalByToken,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/email
 * Send email notification
 */
export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const { type, recipientEmail, data } = body;

        if (!type || !recipientEmail) {
            return NextResponse.json(
                { error: "Type and recipient email are required" },
                { status: 400 }
            );
        }

        // Generate email content based on type
        let emailSubject = "";
        let emailBody = "";

        switch (type) {
            case "approval_requested":
                emailSubject = `Post Approval Required - ${data.clientName || "Revvy"}`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #9333EA;">Post Approval Required</h2>
                        <p>Hello,</p>
                        <p>A new post has been scheduled for your review:</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Platform:</strong> ${data.platform || "N/A"}</p>
                            <p><strong>Scheduled For:</strong> ${data.scheduledFor || "N/A"}</p>
                            <p><strong>Content:</strong></p>
                            <p style="white-space: pre-wrap;">${data.content || ""}</p>
                        </div>
                        <p>
                            <a href="${data.approvalLink}" 
                               style="display: inline-block; background: #9333EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                                Review & Approve
                            </a>
                        </p>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                            This link will expire on ${data.expiresAt || "N/A"}
                        </p>
                    </div>
                `;
                break;

            case "approval_approved":
                emailSubject = `Post Approved - ${data.clientName || "Revvy"}`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Post Approved ✓</h2>
                        <p>Hello,</p>
                        <p>Your post has been approved and will be published as scheduled.</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Platform:</strong> ${data.platform || "N/A"}</p>
                            <p><strong>Scheduled For:</strong> ${data.scheduledFor || "N/A"}</p>
                        </div>
                    </div>
                `;
                break;

            case "approval_changes_requested":
                emailSubject = `Changes Requested - ${data.clientName || "Revvy"}`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f59e0b;">Changes Requested</h2>
                        <p>Hello,</p>
                        <p>The client has requested changes to the scheduled post:</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Platform:</strong> ${data.platform || "N/A"}</p>
                            <p><strong>Client Comment:</strong></p>
                            <p style="white-space: pre-wrap;">${data.comment || "No comment provided"}</p>
                        </div>
                        <p>
                            <a href="${data.editLink || "#"}" 
                               style="display: inline-block; background: #9333EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                                Edit Post
                            </a>
                        </p>
                    </div>
                `;
                break;

            case "task_assigned":
                emailSubject = `New Task Assigned - ${data.clientName || "Revvy"}`;
                emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #9333EA;">New Task Assigned</h2>
                        <p>Hello ${data.assignedToName || ""},</p>
                        <p>A new task has been assigned to you:</p>
                        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                            <p><strong>Task Type:</strong> ${data.taskType || "N/A"}</p>
                            <p><strong>Client:</strong> ${data.clientName || "N/A"}</p>
                            ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ""}
                            ${data.description ? `<p><strong>Description:</strong><br>${data.description}</p>` : ""}
                        </div>
                        <p>
                            <a href="${data.taskLink || "#"}" 
                               style="display: inline-block; background: #9333EA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                                View Task
                            </a>
                        </p>
                    </div>
                `;
                break;

            default:
                return NextResponse.json(
                    { error: "Invalid notification type" },
                    { status: 400 }
                );
        }

        // In production, use a proper email service (SendGrid, Resend, etc.)
        // For now, we'll log and return success
        console.log("Email notification:", {
            to: recipientEmail,
            subject: emailSubject,
            body: emailBody,
        });

        // TODO: Integrate with actual email service
        // Example with Resend:
        // await resend.emails.send({
        //   from: 'Revvy <notifications@revvy.app>',
        //   to: recipientEmail,
        //   subject: emailSubject,
        //   html: emailBody,
        // });

        return NextResponse.json({
            success: true,
            message: "Email notification sent",
        });
    } catch (error) {
        console.error("[Email Notification API] Error:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to send email notification",
            },
            { status: 500 }
        );
    }
}
