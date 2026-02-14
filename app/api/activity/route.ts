import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { PostApprovals, ScheduledPosts, Clients, Tasks, ClientCredits } from "@/utils/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { GetUserByClerkId } from "@/utils/db/actions";
import type { ActivityItem } from "@/components/ActivityFeed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let clerkUserId: string | null = null;
    try {
      const authResult = await auth();
      clerkUserId = authResult?.userId ?? null;
    } catch {
      const user = await currentUser();
      clerkUserId = user?.id ?? null;
    }
    if (!clerkUserId) {
      return NextResponse.json([], { status: 200 });
    }
    const user = await GetUserByClerkId(clerkUserId);
    
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const activities: ActivityItem[] = [];

    // Agency's client IDs for filtering
    const agencyClients = await db
      .select({ id: Clients.id })
      .from(Clients)
      .where(eq(Clients.agencyId, user.id))
      .execute();
    const agencyClientIds = agencyClients.map((c) => c.id);
    if (agencyClientIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get recent approvals (only for this agency's clients)
    const approvals = await db
      .select({
        id: PostApprovals.id,
        status: PostApprovals.status,
        clientId: PostApprovals.clientId,
        updatedAt: PostApprovals.updatedAt,
        scheduledPostId: PostApprovals.scheduledPostId,
      })
      .from(PostApprovals)
      .where(inArray(PostApprovals.clientId, agencyClientIds))
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

    // Credits warnings (80% used = warning, 100% = exceeded) for agency's clients
    const creditsRows = await db
      .select({
        clientId: ClientCredits.clientId,
        postsUsed: ClientCredits.postsUsed,
        postsPerMonth: ClientCredits.postsPerMonth,
        updatedAt: ClientCredits.updatedAt,
        name: Clients.name,
      })
      .from(ClientCredits)
      .innerJoin(Clients, eq(ClientCredits.clientId, Clients.id))
      .where(eq(Clients.agencyId, user.id))
      .execute();

    for (const row of creditsRows) {
      const limit = row.postsPerMonth ?? 12;
      const used = row.postsUsed ?? 0;
      const pct = limit > 0 ? (used / limit) * 100 : 0;
      if (pct >= 100) {
        activities.push({
          id: `credits-exceeded-${row.clientId}`,
          type: "credits_exceeded",
          message: `Credits exceeded for ${row.name}`,
          clientName: row.name,
          timestamp: row.updatedAt.toISOString(),
          link: `/dashboard/clients/${row.clientId}/credits`,
        });
      } else if (pct >= 80) {
        activities.push({
          id: `credits-warning-${row.clientId}`,
          type: "credits_warning",
          message: `Credits at ${Math.round(pct)}% for ${row.name}`,
          clientName: row.name,
          timestamp: row.updatedAt.toISOString(),
          link: `/dashboard/clients/${row.clientId}/credits`,
        });
      }
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

    // Get recent tasks (only for this agency's clients)
    const recentTasks = await db
      .select({
        id: Tasks.id,
        clientId: Tasks.clientId,
        type: Tasks.type,
        createdAt: Tasks.createdAt,
      })
      .from(Tasks)
      .where(inArray(Tasks.clientId, agencyClientIds))
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
