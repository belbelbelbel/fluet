import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  GetUserByClerkId,
  CreateScheduledPost,
  GetAccessibleScheduledPosts,
  DeleteScheduledPost,
  UpdateScheduledPost,
  CreatePostApproval,
  MarkScheduledPostAsPosted,
  CreateNotification,
} from "@/utils/db/actions";
import { shouldBlockAction } from "@/utils/payment/enforcement";
import {
  generateApprovalToken,
  computeApprovalExpiry,
} from "@/utils/approvals/token";
import { sendNotificationEmail } from "@/lib/email/send-notification";
import {
  resolveAgencyContext,
  getAccessibleClients,
  requireClientAccess,
} from "@/lib/team-access";

export const dynamic = "force-dynamic";

// Get all scheduled posts
export async function GET() {
  try {
    // Parse query params first to get client userId (same pattern as generate API)

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json([]);
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json([]);
    }

    const ctx = await resolveAgencyContext(clerkUserId);
    const clients = ctx ? await getAccessibleClients(ctx) : [];
    const scheduledPosts = await GetAccessibleScheduledPosts(
      user.id,
      clients.map((c) => c.id)
    );
    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

// Create a new scheduled post
export async function POST(req: Request) {
  try {
    // Parse body first to get client userId (same pattern as generate API)
    const body = await req.json();
    const { contentId, platform, content, scheduledFor, clientId, requiresApproval } = body;

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!platform || !content || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields: platform, content, scheduledFor" },
        { status: 400 }
      );
    }

    // Payment enforcement: block schedule if agency subscription or client payment is overdue
    const parsedClientId =
      clientId != null && clientId !== ""
        ? parseInt(String(clientId), 10)
        : null;
    const scheduleClientId =
      parsedClientId != null && !Number.isNaN(parsedClientId)
        ? parsedClientId
        : null;
    const blockCheck = await shouldBlockAction(
      clerkUserId,
      "schedule",
      scheduleClientId ?? undefined
    );
    if (blockCheck.blocked) {
      return NextResponse.json(
        { error: blockCheck.reason || "Action blocked. Resolve payment or subscription to continue." },
        { status: 403 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Invalid scheduled date. Must be in the future." },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please generate content first to create your account." },
        { status: 404 }
      );
    }

    let accessClient: { name: string; email: string | null } | null = null;
    if (scheduleClientId != null) {
      const access = await requireClientAccess(clerkUserId, scheduleClientId);
      if (!access.ok) {
        return NextResponse.json(
          { error: access.error },
          { status: access.status }
        );
      }
      accessClient = {
        name: access.client.name,
        email: access.client.email ?? null,
      };
    }

    // Create scheduled post
    const scheduledPost = await CreateScheduledPost(
      user.id,
      contentId || null,
      platform,
      content,
      scheduledDate,
      scheduleClientId,
      requiresApproval !== false // Default to true if clientId exists
    );

    // If clientId provided and requires approval, create approval record
    if (scheduleClientId != null && scheduledPost.requiresApproval) {
      try {
        const approvalToken = generateApprovalToken();
        const expiresAt = computeApprovalExpiry(scheduledDate);

        await CreatePostApproval({
          scheduledPostId: scheduledPost.id,
          clientId: scheduleClientId,
          approvalToken,
          expiresAt,
        });

        // Return approval link in response
        const { getEmailAppUrl } = await import("@/lib/email/send-notification");
        const approvalLink = `${getEmailAppUrl()}/client-portal/${approvalToken}`;

        // The approval link goes to the client and only the client. It used to
        // fall back to the agency's own inbox, which both looks like the client
        // was asked when they weren't, and is useless now that a decision
        // requires proving control of the client's address.
        const clientEmail = accessClient?.email?.trim() || null;
        let approvalEmailSent = false;

        if (clientEmail) {
          try {
            const emailResult = await sendNotificationEmail({
              type: "approval_requested",
              recipientEmail: clientEmail,
              data: {
                clientName: accessClient?.name || "Client",
                platform,
                scheduledFor: scheduledDate.toISOString(),
                content,
                approvalLink,
                expiresAt: expiresAt.toISOString(),
              },
            });
            approvalEmailSent = emailResult.sent;
            if (!emailResult.sent) {
              console.error("Failed to send approval email:", emailResult.error);
            }
          } catch (emailError) {
            console.error("Error sending approval email:", emailError);
            // Don't fail the post creation if email fails
          }
        }

        return NextResponse.json({
          ...scheduledPost,
          approvalLink,
          approvalToken,
          approvalEmailSent,
          approvalEmailWarning: clientEmail
            ? approvalEmailSent
              ? null
              : `Couldn't email ${clientEmail}. Share the link manually.`
            : "This client has no email on file, so no approval request was sent. Add one and we'll deliver it automatically.",
        });
      } catch (approvalError) {
        console.error("Error creating approval:", approvalError);
        // Don't fail the post creation if approval creation fails
      }
    }

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled post" },
      { status: 500 }
    );
  }
}

// Update a scheduled post
export async function PUT(req: Request) {
  try {
    // Parse body first to get client userId (same pattern as generate API)
    const body = await req.json();
    const { id, content, scheduledFor, platform, posted } = body;

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId = authResult?.userId || null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // Silent fallback
      }
    }

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify the post is in this user's accessible set (owner or assigned clients)
    const ctx = await resolveAgencyContext(clerkUserId);
    const clients = ctx ? await getAccessibleClients(ctx) : [];
    const accessible = await GetAccessibleScheduledPosts(
      user.id,
      clients.map((c) => c.id)
    );
    const owned = accessible.find((p) => p.id === Number(id));
    if (!owned) {
      return NextResponse.json(
        { error: "Post not found or access denied" },
        { status: 404 }
      );
    }

    // Mark as posted (manual publish loop)
    if (posted === true) {
      const marked = await MarkScheduledPostAsPosted(Number(id));
      try {
        await CreateNotification(
          user.id,
          "post_published",
          "Post marked as published",
          `Your ${owned.platform} post was marked as posted.`,
          "/dashboard/schedule"
        );
      } catch {
        /* non-fatal */
      }
      return NextResponse.json(marked);
    }

    const updates: Partial<{ content: string; scheduledFor: Date; platform: string }> = {};
    if (content) updates.content = content;
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        return NextResponse.json(
          { error: "Invalid scheduled date. Must be in the future." },
          { status: 400 }
        );
      }
      updates.scheduledFor = scheduledDate;
    }
    if (platform) updates.platform = platform;

    const updatedPost = await UpdateScheduledPost(id, owned.userId, updates);
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled post" },
      { status: 500 }
    );
  }
}

// Delete a scheduled post
export async function DELETE(req: Request) {
  try {
    // Parse query params first to get client userId (same pattern as generate API)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Use the EXACT same auth pattern as generate API (which works)
    const authResult = await auth();
    let clerkUserId: string | null | undefined = authResult?.userId ?? null;
    
    // If auth() didn't work, try currentUser() as fallback
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // Silent fallback
      }
    }
    
    // Use clientUserId as final fallback if provided

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const user = await GetUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    await DeleteScheduledPost(parseInt(id), user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post" },
      { status: 500 }
    );
  }
}

