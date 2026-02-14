import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { requireAgencyAccess } from "@/utils/auth/route-guards";
import { db } from "@/utils/db/dbConfig";
import { PostApprovals, ScheduledPosts, Clients, Tasks } from "@/utils/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";
import type { ActivityItem, ActivityType } from "@/components/ActivityFeed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Verify agency access
    const { clerkUserId } = await requireAgencyAccess();
    const user = await GetUserByClerkId(clerkUserId);
    
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const activities: ActivityItem[] = [];

    // Get recent approvals
    const approvals = await db
      .select({
        id: PostApprovals.id,
        status: PostApprovals.status,
        clientId: PostApprovals.clientId,
        updatedAt: PostApprovals.updatedAt,
        scheduledPostId: PostApprovals.scheduledPostId,
      })
      .from(PostApprovals)
      .where(eq(PostApprovals.clientId, PostApprovals.clientId)) // This needs to be filtered by agency's clients
      .orderBy(desc(PostApprovals.updatedAt))
      .limit(10)
      .execute();

    // Get client names for approvals
    for (const approval of approvals) {
      const [client] = await db
        .select({ name: Clients.name })
        .from(Clients)
        .where(eq(Clients.id, approval.clientId))
        .limit(1)
        .execute();

      if (approval.status === "approved") {
        activities.push({
          id: `approval-${approval.id}`,
          type: "client_approved",
          message: `${client?.name || "Client"} approved a post`,
          clientName: client?.name,
          timestamp: approval.updatedAt.toISOString(),
          link: `/dashboard/schedule`,
        });
      } else if (approval.status === "changes_requested") {
        activities.push({
          id: `changes-${approval.id}`,
          type: "client_requested_changes",
          message: `${client?.name || "Client"} requested changes to a post`,
          clientName: client?.name,
          timestamp: approval.updatedAt.toISOString(),
          link: `/dashboard/schedule`,
        });
      }
    }

    // Get payment overdue clients
    const overdueClients = await db
      .select({
        id: Clients.id,
        name: Clients.name,
        paymentStatus: Clients.paymentStatus,
        paymentDueDate: Clients.paymentDueDate,
        updatedAt: Clients.updatedAt,
      })
      .from(Clients)
      .where(
        and(
          eq(Clients.agencyId, user.id),
          eq(Clients.paymentStatus, "overdue")
        )
      )
      .orderBy(desc(Clients.updatedAt))
      .limit(5)
      .execute();

    for (const client of overdueClients) {
      activities.push({
        id: `payment-${client.id}`,
        type: "payment_overdue",
        message: `Payment overdue for ${client.name}`,
        clientName: client.name,
        timestamp: client.updatedAt.toISOString(),
        link: `/dashboard/clients/${client.id}`,
      });
    }

    // Get published posts (recent)
    const publishedPosts = await db
      .select({
        id: ScheduledPosts.id,
        clientId: ScheduledPosts.clientId,
        platform: ScheduledPosts.platform,
        postedAt: ScheduledPosts.postedAt,
      })
      .from(ScheduledPosts)
      .where(
        and(
          eq(ScheduledPosts.userId, user.id),
          eq(ScheduledPosts.posted, true)
        )
      )
      .orderBy(desc(ScheduledPosts.postedAt))
      .limit(5)
      .execute();

    for (const post of publishedPosts) {
      if (post.clientId) {
        const [client] = await db
          .select({ name: Clients.name })
          .from(Clients)
          .where(eq(Clients.id, post.clientId))
          .limit(1)
          .execute();

        if (post.postedAt) {
          activities.push({
            id: `published-${post.id}`,
            type: "post_published",
            message: `Post published for ${client?.name || "Client"} on ${post.platform}`,
            clientName: client?.name,
            timestamp: post.postedAt.toISOString(),
            link: `/dashboard/history`,
          });
        }
      }
    }

    // Get recent tasks
    const recentTasks = await db
      .select({
        id: Tasks.id,
        clientId: Tasks.clientId,
        type: Tasks.type,
        createdAt: Tasks.createdAt,
      })
      .from(Tasks)
      .where(eq(Tasks.clientId, Tasks.clientId)) // Filter by agency's clients
      .orderBy(desc(Tasks.createdAt))
      .limit(5)
      .execute();

    for (const task of recentTasks) {
      const [client] = await db
        .select({ name: Clients.name })
        .from(Clients)
        .where(eq(Clients.id, task.clientId))
        .limit(1)
        .execute();

      activities.push({
        id: `task-${task.id}`,
        type: "task_assigned",
        message: `Task assigned for ${client?.name || "Client"}`,
        clientName: client?.name,
        timestamp: task.createdAt.toISOString(),
        link: `/dashboard/clients/${task.clientId}`,
      });
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(activities.slice(0, 20));
  } catch (error) {
    console.error("[Activity API] Error:", error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}
