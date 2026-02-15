/**
 * Client dashboard API – stats, posts, pending approvals for the logged-in client
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db/dbConfig";
import { Clients } from "@/utils/db/schema";
import { eq } from "drizzle-orm";
import { getUserRoleData } from "@/utils/auth/roles";
import {
  GetScheduledPostsByClientId,
  GetPendingApprovalsForClient,
} from "@/utils/db/actions";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> | { clientId: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const clientId = parseInt(resolvedParams.clientId, 10);
    if (isNaN(clientId) || clientId < 1) {
      return NextResponse.json({ error: "Invalid client" }, { status: 400 });
    }

    let clerkUserId: string | null = null;
    try {
      const authResult = await auth();
      clerkUserId = authResult?.userId ?? null;
    } catch {
      // ignore
    }
    if (!clerkUserId) {
      try {
        const user = await currentUser();
        clerkUserId = user?.id ?? null;
      } catch {
        // ignore
      }
    }
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleData = await getUserRoleData(clerkUserId);
    if (!roleData || roleData.role !== "client" || roleData.clientId !== clientId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [clientRow] = await db
      .select({ name: Clients.name })
      .from(Clients)
      .where(eq(Clients.id, clientId))
      .limit(1)
      .execute();
    const clientName = clientRow?.name ?? "Client";

    const posts = await GetScheduledPostsByClientId(clientId);
    const approvals = await GetPendingApprovalsForClient(clientId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const postsThisMonth = posts.filter(
      (p) => p.scheduledFor && new Date(p.scheduledFor) >= startOfMonth
    ).length;
    const publishedThisMonth = posts.filter(
      (p) => p.posted && p.postedAt && new Date(p.postedAt) >= startOfMonth
    ).length;
    const engagementRate = publishedThisMonth > 0 ? 0 : 0;

    const pendingApprovalsWithPosts = approvals.map((a) => {
      const post = posts.find((p) => p.id === a.scheduledPostId);
      return {
        id: a.id,
        approvalToken: a.approvalToken,
        status: a.status,
        scheduledPostId: a.scheduledPostId,
        content: post?.content ?? "",
        platform: post?.platform ?? "",
        scheduledFor: post?.scheduledFor ?? null,
      };
    });

    return NextResponse.json({
      clientName,
      stats: {
        postsThisMonth,
        pendingApprovals: pendingApprovalsWithPosts.length,
        engagementRate,
      },
      posts: posts.map((p) => ({
        id: p.id,
        platform: p.platform,
        content: p.content,
        scheduledFor: p.scheduledFor,
        posted: p.posted,
        postedAt: p.postedAt,
        approvalStatus: p.approvalStatus,
      })),
      pendingApprovals: pendingApprovalsWithPosts,
    });
  } catch (error) {
    console.error("[Client dashboard API]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
